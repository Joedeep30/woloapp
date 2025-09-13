-- =====================================================
-- WOLO BANKING-GRADE DATABASE SECURITY POLICIES
-- Row Level Security (RLS) for Supabase
-- =====================================================

-- Enable RLS on all critical tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pots ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 1. USER DATA PROTECTION POLICIES
-- =====================================================

-- Users can only see their own user record
CREATE POLICY "Users can only see their own data" ON users
  FOR SELECT
  USING (auth.uid() = id::text);

-- Users can only update their own non-sensitive fields
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE
  USING (auth.uid() = id::text)
  WITH CHECK (
    auth.uid() = id::text 
    AND OLD.email = NEW.email  -- Prevent email changes
    AND OLD.id = NEW.id        -- Prevent ID changes
    AND OLD.created_at = NEW.created_at -- Prevent timestamp manipulation
  );

-- Service role can access all user data (for admin operations)
CREATE POLICY "Service role full access to users" ON users
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 2. PROFILE PROTECTION POLICIES
-- =====================================================

-- Users can only access their own profile
CREATE POLICY "Users see only their profile" ON profiles
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Public profiles (limited fields) can be seen by authenticated users
CREATE POLICY "Public profile access" ON profiles
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND is_public = true
  );

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (
    auth.uid()::text = user_id::text
    AND OLD.user_id = NEW.user_id -- Prevent user_id changes
  );

-- =====================================================
-- 3. POT ACCESS CONTROL
-- =====================================================

-- Users can see public pots
CREATE POLICY "Public pots visible to all" ON pots
  FOR SELECT
  USING (
    is_public = true 
    AND status = 'active'
  );

-- Pot owners can see their own pots (including private)
CREATE POLICY "Owners see their pots" ON pots
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Users can only create pots for themselves
CREATE POLICY "Users create own pots" ON pots
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id::text
    AND status IN ('draft', 'pending_verification')
  );

-- Pot owners can update their own pots (with restrictions)
CREATE POLICY "Owners update own pots" ON pots
  FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (
    auth.uid()::text = user_id::text
    AND OLD.user_id = NEW.user_id -- Prevent ownership transfer
    AND (
      -- Allow normal updates if pot is still in draft
      OLD.status = 'draft'
      OR 
      -- Only allow specific fields to be updated for active pots
      (OLD.status = 'active' AND OLD.target_amount = NEW.target_amount)
    )
  );

-- =====================================================
-- 4. DONATION SECURITY
-- =====================================================

-- Donors can see their own donations
CREATE POLICY "Donors see own donations" ON donations
  FOR SELECT
  USING (
    auth.uid()::text = donor_user_id::text
    OR auth.uid()::text IN (
      SELECT user_id::text FROM pots WHERE id = pot_id
    )
  );

-- Only authenticated users can make donations
CREATE POLICY "Authenticated users can donate" ON donations
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid()::text = donor_user_id::text
    AND amount > 0
    AND amount <= 1000000 -- Maximum donation limit (1M CFA)
  );

-- Prevent donation modifications (immutable after creation)
CREATE POLICY "No donation updates" ON donations
  FOR UPDATE
  USING (false); -- Nobody can update donations

-- =====================================================
-- 5. SPONSORSHIP PROTECTION
-- =====================================================

-- Users involved in sponsorship can see the record
CREATE POLICY "Sponsorship participants access" ON sponsorships
  FOR SELECT
  USING (
    auth.uid()::text = sponsor_user_id::text
    OR auth.uid()::text = minor_user_id::text
  );

-- Only sponsors can create sponsorship records
CREATE POLICY "Sponsors create sponsorships" ON sponsorships
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = sponsor_user_id::text
    AND status = 'pending'
  );

-- Limited updates allowed
CREATE POLICY "Limited sponsorship updates" ON sponsorships
  FOR UPDATE
  USING (
    auth.uid()::text = sponsor_user_id::text
    OR auth.uid()::text = minor_user_id::text
  )
  WITH CHECK (
    OLD.sponsor_user_id = NEW.sponsor_user_id -- Prevent sponsor changes
    AND OLD.minor_user_id = NEW.minor_user_id   -- Prevent minor changes
  );

-- =====================================================
-- 6. POINTS SYSTEM SECURITY
-- =====================================================

-- Users can only see their own points
CREATE POLICY "Own points visibility" ON point_transactions
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Only system can create point transactions (not users directly)
CREATE POLICY "System creates points" ON point_transactions
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR auth.jwt() ->> 'iss' = 'wolo-security'
  );

-- No point modifications allowed
CREATE POLICY "Immutable points" ON point_transactions
  FOR UPDATE
  USING (false);

-- =====================================================
-- 7. IDENTITY VERIFICATION SECURITY
-- =====================================================

-- Only participants can see verification records
CREATE POLICY "Verification participants only" ON identity_verifications
  FOR SELECT
  USING (
    auth.uid()::text = minor_user_id::text
    OR auth.uid()::text = sponsor_user_id::text
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- Only system can create verification records
CREATE POLICY "System creates verifications" ON identity_verifications
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR auth.jwt() ->> 'iss' = 'wolo-security'
  );

-- Only admins can update verification status
CREATE POLICY "Admin updates verifications" ON identity_verifications
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    AND auth.jwt() ->> 'user_role' = 'admin'
  );

-- =====================================================
-- 8. AUDIT LOG SECURITY
-- =====================================================

-- Only service role and admins can read audit logs
CREATE POLICY "Admin audit access" ON security_audit_log
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    AND (
      auth.jwt() ->> 'user_role' = 'admin'
      OR auth.jwt() ->> 'iss' = 'wolo-security'
    )
  );

-- Only system can write to audit logs
CREATE POLICY "System writes audit" ON security_audit_log
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    AND auth.jwt() ->> 'iss' = 'wolo-security'
  );

-- Audit logs are immutable
CREATE POLICY "Immutable audit logs" ON security_audit_log
  FOR UPDATE
  USING (false);

-- =====================================================
-- 9. SECURITY INCIDENTS
-- =====================================================

-- Only security team can access incident records
CREATE POLICY "Security team access" ON security_incidents
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    AND auth.jwt() ->> 'user_role' IN ('admin', 'security_admin')
  );

-- =====================================================
-- 10. ADMIN SAFETY FUNCTIONS
-- =====================================================

-- Function to safely mask sensitive data in responses
CREATE OR REPLACE FUNCTION mask_sensitive_data(
  data_value TEXT,
  user_role TEXT DEFAULT 'user',
  field_type TEXT DEFAULT 'generic'
)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Admin users see everything
  IF user_role = 'admin' THEN
    RETURN data_value;
  END IF;
  
  -- Mask based on field type
  CASE field_type
    WHEN 'email' THEN
      RETURN SUBSTRING(data_value, 1, 2) || '***@' || SPLIT_PART(data_value, '@', 2);
    WHEN 'phone' THEN
      RETURN '***' || RIGHT(data_value, 3);
    WHEN 'id_number' THEN
      RETURN '***' || RIGHT(data_value, 2);
    WHEN 'birthday' THEN
      RETURN TO_CHAR(TO_DATE(data_value, 'YYYY-MM-DD'), 'MM') || '/****';
    ELSE
      RETURN '***';
  END CASE;
END;
$$;

-- Function to log data access for audit trail
CREATE OR REPLACE FUNCTION log_data_access()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO security_audit_log (
    id,
    table_name,
    operation,
    user_id,
    timestamp,
    service
  ) VALUES (
    gen_random_uuid(),
    TG_TABLE_NAME,
    TG_OP,
    auth.uid(),
    NOW(),
    'database-trigger'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- =====================================================
-- 11. TRIGGER CREATION FOR AUDIT TRAILS
-- =====================================================

-- Audit triggers for critical tables
CREATE TRIGGER audit_users_access
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION log_data_access();

CREATE TRIGGER audit_pots_access  
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON pots
  FOR EACH ROW EXECUTE FUNCTION log_data_access();

CREATE TRIGGER audit_donations_access
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON donations  
  FOR EACH ROW EXECUTE FUNCTION log_data_access();

-- =====================================================
-- 12. SECURITY VIEWS FOR SAFE DATA ACCESS
-- =====================================================

-- Safe user view that automatically masks sensitive data
CREATE OR REPLACE VIEW safe_users_view AS
SELECT 
  id,
  mask_sensitive_data(email, auth.jwt() ->> 'user_role', 'email') as email,
  created_at,
  last_login_at,
  status,
  provider
FROM users
WHERE (
  auth.uid()::text = id::text -- Own record
  OR auth.jwt() ->> 'user_role' = 'admin' -- Admin access
);

-- Safe profile view
CREATE OR REPLACE VIEW safe_profiles_view AS
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  CASE 
    WHEN auth.uid()::text = user_id::text THEN telephone
    ELSE mask_sensitive_data(telephone, auth.jwt() ->> 'user_role', 'phone')
  END as telephone,
  CASE
    WHEN auth.uid()::text = user_id::text THEN date_of_birth
    ELSE mask_sensitive_data(date_of_birth::text, auth.jwt() ->> 'user_role', 'birthday')
  END as date_of_birth,
  avatar_url,
  bio,
  created_at
FROM profiles;

-- =====================================================
-- 13. EMERGENCY PROCEDURES
-- =====================================================

-- Function to immediately lock a user account
CREATE OR REPLACE FUNCTION emergency_lock_user(target_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only security admins can use this function
  IF auth.jwt() ->> 'user_role' != 'security_admin' THEN
    RAISE EXCEPTION 'Unauthorized access to emergency lock function';
  END IF;
  
  UPDATE users 
  SET status = 'locked',
      locked_at = NOW(),
      locked_by = auth.uid()
  WHERE id = target_user_id;
  
  -- Log the emergency action
  INSERT INTO security_incidents (
    id, event_type, user_id, details, timestamp, severity, status
  ) VALUES (
    gen_random_uuid(),
    'emergency_user_lock',
    target_user_id,
    jsonb_build_object('locked_by', auth.uid(), 'reason', 'emergency_procedure'),
    NOW(),
    'HIGH',
    'open'
  );
  
  RETURN TRUE;
END;
$$;

-- Function to detect mass data access attempts
CREATE OR REPLACE FUNCTION detect_bulk_access()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  recent_access_count INTEGER;
BEGIN
  -- Count recent accesses by this user in the last 5 minutes
  SELECT COUNT(*) INTO recent_access_count
  FROM security_audit_log
  WHERE user_id = auth.uid()
    AND timestamp > (NOW() - INTERVAL '5 minutes')
    AND table_name = TG_TABLE_NAME;
  
  -- If more than 50 accesses in 5 minutes, flag as suspicious
  IF recent_access_count > 50 THEN
    INSERT INTO security_incidents (
      id, event_type, user_id, details, timestamp, severity, status
    ) VALUES (
      gen_random_uuid(),
      'bulk_data_access_detected',
      auth.uid(),
      jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'access_count', recent_access_count,
        'time_window', '5_minutes'
      ),
      NOW(),
      'HIGH',
      'open'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply bulk access detection to sensitive tables
CREATE TRIGGER detect_bulk_users_access
  AFTER SELECT ON users
  FOR EACH ROW EXECUTE FUNCTION detect_bulk_access();

CREATE TRIGGER detect_bulk_profiles_access
  AFTER SELECT ON profiles
  FOR EACH ROW EXECUTE FUNCTION detect_bulk_access();

-- =====================================================
-- 14. GRANTS AND PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON safe_users_view TO authenticated;
GRANT SELECT ON safe_profiles_view TO authenticated;

-- Grant specific permissions for service operations
GRANT ALL ON users TO service_role;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON pots TO service_role;
GRANT ALL ON donations TO service_role;
GRANT ALL ON sponsorships TO service_role;
GRANT ALL ON point_transactions TO service_role;
GRANT ALL ON identity_verifications TO service_role;
GRANT ALL ON security_audit_log TO service_role;
GRANT ALL ON security_incidents TO service_role;

-- =====================================================
-- 15. ADDITIONAL SECURITY SETTINGS
-- =====================================================

-- Set secure defaults
ALTER DATABASE postgres SET log_statement = 'all';
ALTER DATABASE postgres SET log_min_duration_statement = 1000; -- Log slow queries
ALTER DATABASE postgres SET shared_preload_libraries = 'pg_stat_statements';

-- Enable connection security
ALTER SYSTEM SET ssl = 'on';
ALTER SYSTEM SET password_encryption = 'scram-sha-256';

COMMENT ON SCHEMA public IS 'WOLO Banking-Grade Security Implementation - All database access is audited and controlled';

-- =====================================================
-- 16. SECURITY VERIFICATION QUERIES
-- =====================================================

-- Query to verify RLS is enabled on all critical tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'profiles', 'pots', 'donations', 'sponsorships', 'point_transactions');

-- Query to verify all policies are in place
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;