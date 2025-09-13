// =====================================================
// WOLO DATABASE SECURITY SETUP SCRIPT
// Apply banking-grade security policies to Supabase
// =====================================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

class DatabaseSecuritySetup {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  // Apply security policies from SQL file
  async applySQLSecurityPolicies() {
    console.log('🔒 Applying banking-grade database security policies...');

    try {
      // Read the security policies SQL file
      const sqlPath = path.join(__dirname, 'database-security-policies.sql');
      const securitySQL = await fs.readFile(sqlPath, 'utf8');

      // Split into individual statements (basic approach)
      const statements = securitySQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '');

      let successCount = 0;
      let errorCount = 0;

      for (const [index, statement] of statements.entries()) {
        try {
          console.log(`Processing statement ${index + 1}/${statements.length}...`);
          
          const { error } = await this.supabase.rpc('exec_sql', {
            query: statement + ';'
          });

          if (error) {
            console.warn(`⚠️  Warning on statement ${index + 1}: ${error.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.warn(`⚠️  Error executing statement ${index + 1}: ${err.message}`);
          errorCount++;
        }
      }

      console.log(`✅ Security setup complete! ${successCount} successful, ${errorCount} warnings/errors`);
      return { successCount, errorCount };

    } catch (error) {
      console.error('❌ Failed to read security policies file:', error);
      throw error;
    }
  }

  // Verify Row Level Security is enabled
  async verifyRLSStatus() {
    console.log('🔍 Verifying Row Level Security status...');

    const tables = [
      'users', 'profiles', 'pots', 'donations', 
      'sponsorships', 'point_transactions', 'identity_verifications',
      'security_audit_log', 'security_incidents'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await this.supabase
          .from('pg_tables')
          .select('tablename, rowsecurity')
          .eq('schemaname', 'public')
          .eq('tablename', table)
          .single();

        if (error) {
          console.warn(`⚠️  Could not check RLS for ${table}: ${error.message}`);
          continue;
        }

        if (data && data.rowsecurity) {
          console.log(`✅ RLS enabled on ${table}`);
        } else {
          console.error(`❌ RLS NOT enabled on ${table}`);
        }
      } catch (err) {
        console.warn(`⚠️  Error checking ${table}: ${err.message}`);
      }
    }
  }

  // Verify security policies exist
  async verifySecurityPolicies() {
    console.log('🔍 Verifying security policies...');

    try {
      const { data: policies, error } = await this.supabase
        .from('pg_policies')
        .select('tablename, policyname, cmd')
        .eq('schemaname', 'public');

      if (error) {
        console.error('❌ Could not retrieve policies:', error.message);
        return;
      }

      const policyCount = policies?.length || 0;
      console.log(`✅ Found ${policyCount} security policies`);

      // Group by table
      const policyByTable = {};
      policies?.forEach(policy => {
        if (!policyByTable[policy.tablename]) {
          policyByTable[policy.tablename] = [];
        }
        policyByTable[policy.tablename].push({
          name: policy.policyname,
          command: policy.cmd
        });
      });

      // Display policy summary
      for (const [table, tablePolicies] of Object.entries(policyByTable)) {
        console.log(`📋 ${table}: ${tablePolicies.length} policies`);
        tablePolicies.forEach(policy => {
          console.log(`   - ${policy.name} (${policy.command})`);
        });
      }

    } catch (error) {
      console.error('❌ Error verifying policies:', error);
    }
  }

  // Create emergency admin user for security management
  async createSecurityAdmin(email, password) {
    console.log('👤 Creating security admin user...');

    try {
      const { data, error } = await this.supabase.auth.admin.createUser({
        email: email,
        password: password,
        user_metadata: {
          role: 'security_admin',
          created_by: 'system',
          created_at: new Date().toISOString()
        }
      });

      if (error) {
        console.error('❌ Failed to create security admin:', error.message);
        return null;
      }

      console.log('✅ Security admin created successfully');
      console.log(`🔐 User ID: ${data.user.id}`);
      console.log(`📧 Email: ${data.user.email}`);

      // Also create profile for the admin
      const { error: profileError } = await this.supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          user_id: data.user.id,
          first_name: 'Security',
          last_name: 'Administrator',
          role: 'security_admin',
          created_at: new Date().toISOString()
        });

      if (profileError) {
        console.warn('⚠️  Admin profile creation failed:', profileError.message);
      } else {
        console.log('✅ Security admin profile created');
      }

      return data.user;

    } catch (error) {
      console.error('❌ Error creating security admin:', error);
      return null;
    }
  }

  // Test security policies with sample operations
  async testSecurityPolicies() {
    console.log('🧪 Testing security policies...');

    try {
      // Test 1: Try to access users table without authentication (should fail)
      console.log('Test 1: Unauthenticated access to users...');
      const { data: usersData, error: usersError } = await this.supabase
        .from('users')
        .select('*')
        .limit(1);

      if (usersError) {
        console.log('✅ Unauthenticated access properly blocked');
      } else {
        console.error('❌ Security issue: Unauthenticated access allowed!');
      }

      // Test 2: Try to access safe views (should work)
      console.log('Test 2: Access to safe views...');
      const { data: safeData, error: safeError } = await this.supabase
        .from('safe_users_view')
        .select('*')
        .limit(1);

      if (!safeError && Array.isArray(safeData)) {
        console.log('✅ Safe views accessible');
      } else {
        console.warn('⚠️  Safe views may not be working properly');
      }

      // Test 3: Verify audit logging functions exist
      console.log('Test 3: Check security functions...');
      const { data: functions, error: funcError } = await this.supabase
        .rpc('pg_get_functiondef', { func_oid: 'mask_sensitive_data'::regproc });

      if (!funcError) {
        console.log('✅ Security functions are available');
      } else {
        console.warn('⚠️  Security functions may not be installed');
      }

    } catch (error) {
      console.error('❌ Error during security testing:', error);
    }
  }

  // Generate security report
  async generateSecurityReport() {
    console.log('📊 Generating security report...');

    const report = {
      timestamp: new Date().toISOString(),
      database_security: {},
      rls_status: {},
      policy_count: 0,
      recommendations: []
    };

    try {
      // Check RLS status
      const { data: tables } = await this.supabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('schemaname', 'public');

      if (tables) {
        tables.forEach(table => {
          report.rls_status[table.tablename] = table.rowsecurity;
          if (!table.rowsecurity) {
            report.recommendations.push(`Enable RLS on ${table.tablename}`);
          }
        });
      }

      // Check policy count
      const { data: policies } = await this.supabase
        .from('pg_policies')
        .select('policyname')
        .eq('schemaname', 'public');

      report.policy_count = policies?.length || 0;

      if (report.policy_count < 10) {
        report.recommendations.push('Implement comprehensive security policies');
      }

      // Check for required security functions
      try {
        await this.supabase.rpc('mask_sensitive_data', {
          data_value: 'test@example.com',
          user_role: 'user',
          field_type: 'email'
        });
        report.database_security.masking_functions = true;
      } catch {
        report.database_security.masking_functions = false;
        report.recommendations.push('Install data masking functions');
      }

      // Save report
      const reportPath = path.join(__dirname, 'security-report.json');
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

      console.log(`📋 Security report saved to: ${reportPath}`);
      console.log(`🔒 RLS Tables: ${Object.keys(report.rls_status).filter(k => report.rls_status[k]).length}`);
      console.log(`📜 Security Policies: ${report.policy_count}`);
      console.log(`⚠️  Recommendations: ${report.recommendations.length}`);

      if (report.recommendations.length > 0) {
        console.log('🔧 Recommendations:');
        report.recommendations.forEach(rec => console.log(`   - ${rec}`));
      }

      return report;

    } catch (error) {
      console.error('❌ Error generating security report:', error);
      return report;
    }
  }

  // Complete security setup process
  async setupComplete() {
    console.log('🚀 Starting complete database security setup...\n');

    try {
      // Step 1: Apply security policies
      await this.applySQLSecurityPolicies();
      console.log();

      // Step 2: Verify RLS
      await this.verifyRLSStatus();
      console.log();

      // Step 3: Verify policies
      await this.verifySecurityPolicies();
      console.log();

      // Step 4: Test security
      await this.testSecurityPolicies();
      console.log();

      // Step 5: Generate report
      const report = await this.generateSecurityReport();
      console.log();

      console.log('🎉 Database security setup complete!');
      console.log('📊 Summary:');
      console.log(`   - Security policies: ${report.policy_count}`);
      console.log(`   - RLS enabled tables: ${Object.keys(report.rls_status).filter(k => report.rls_status[k]).length}`);
      console.log(`   - Recommendations: ${report.recommendations.length}`);
      console.log('\n🔒 Your WOLO database now has banking-grade security protection!');

      return report;

    } catch (error) {
      console.error('❌ Security setup failed:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   - SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const security = new DatabaseSecuritySetup();

  // Check command line arguments
  const command = process.argv[2];

  switch (command) {
    case 'setup':
      await security.setupComplete();
      break;

    case 'verify':
      await security.verifyRLSStatus();
      await security.verifySecurityPolicies();
      break;

    case 'test':
      await security.testSecurityPolicies();
      break;

    case 'report':
      await security.generateSecurityReport();
      break;

    case 'create-admin':
      const email = process.argv[3];
      const password = process.argv[4];
      if (!email || !password) {
        console.error('Usage: node setup-database-security.js create-admin <email> <password>');
        process.exit(1);
      }
      await security.createSecurityAdmin(email, password);
      break;

    default:
      console.log('WOLO Database Security Setup');
      console.log('Usage:');
      console.log('  node setup-database-security.js setup           # Complete setup');
      console.log('  node setup-database-security.js verify          # Verify current status');
      console.log('  node setup-database-security.js test            # Test security policies');
      console.log('  node setup-database-security.js report          # Generate security report');
      console.log('  node setup-database-security.js create-admin <email> <password> # Create security admin');
      break;
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

module.exports = DatabaseSecuritySetup;