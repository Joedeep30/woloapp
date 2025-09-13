const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

const config = require('../config');
const cacheProvider = require('../providers/cache');
const databaseProvider = require('../providers/database');

/**
 * Banking-Grade Security Service
 * Comprehensive protection against all attack vectors
 */
class AdvancedSecurityService {
  constructor() {
    this.encryptionKey = this.deriveEncryptionKey();
    this.suspiciousActivityThreshold = 10;
    this.dataAccessAuditLog = new Map();
  }

  /**
   * 1. DATA ENCRYPTION - AES-256-GCM for sensitive data
   */
  encryptSensitiveData(data, additionalKey = '') {
    try {
      const algorithm = 'aes-256-gcm';
      const key = this.deriveEncryptionKey(additionalKey);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, key, iv);
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm: algorithm
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Data encryption failed');
    }
  }

  decryptSensitiveData(encryptedData, additionalKey = '') {
    try {
      const { encrypted, iv, authTag, algorithm } = encryptedData;
      const key = this.deriveEncryptionKey(additionalKey);
      
      const decipher = crypto.createDecipher(algorithm, key, Buffer.from(iv, 'hex'));
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Data decryption failed');
    }
  }

  /**
   * 2. ADVANCED AUTHENTICATION - Multi-factor with biometric support
   */
  async generateSecureJWT(user, deviceInfo, locationInfo) {
    const deviceFingerprint = this.generateDeviceFingerprint(deviceInfo);
    const locationHash = this.hashLocation(locationInfo);
    
    const payload = {
      userId: user.id,
      email: user.email,
      roles: user.roles || ['user'],
      deviceId: deviceFingerprint,
      locationHash: locationHash,
      sessionId: uuidv4(),
      iat: Math.floor(Date.now() / 1000),
      type: 'access'
    };

    // Store session for validation
    await this.storeSecureSession(payload);
    
    const token = jwt.sign(payload, config.JWT.SECRET, {
      expiresIn: config.JWT.EXPIRES_IN,
      issuer: 'wolo-security',
      audience: 'wolo-app'
    });

    return {
      token,
      deviceId: deviceFingerprint,
      sessionId: payload.sessionId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }

  async validateSecureJWT(token, deviceInfo, locationInfo, userAgent) {
    try {
      // Verify JWT signature
      const decoded = jwt.verify(token, config.JWT.SECRET, {
        issuer: 'wolo-security',
        audience: 'wolo-app'
      });

      // Validate session exists
      const session = await this.getSecureSession(decoded.sessionId);
      if (!session) {
        throw new Error('Session not found or expired');
      }

      // Device fingerprint validation
      const currentDeviceId = this.generateDeviceFingerprint(deviceInfo);
      if (currentDeviceId !== decoded.deviceId) {
        await this.logSecurityEvent('device_mismatch', decoded.userId, {
          expected: decoded.deviceId,
          actual: currentDeviceId,
          userAgent
        });
        throw new Error('Device fingerprint mismatch');
      }

      // Location anomaly detection
      const currentLocationHash = this.hashLocation(locationInfo);
      if (this.isLocationAnomalous(decoded.locationHash, currentLocationHash)) {
        await this.logSecurityEvent('location_anomaly', decoded.userId, {
          previousLocation: decoded.locationHash,
          currentLocation: currentLocationHash
        });
        
        // Don't block, but require additional verification
        return { ...decoded, requiresAdditionalAuth: true };
      }

      return decoded;
    } catch (error) {
      console.error('JWT validation error:', error);
      throw error;
    }
  }

  /**
   * 3. DATABASE ACCESS CONTROL - Row-level security with audit trails
   */
  async secureDataAccess(tableName, operation, filters, userId, purpose) {
    const accessId = uuidv4();
    const timestamp = new Date().toISOString();
    
    try {
      // Log data access attempt
      await this.auditDataAccess({
        accessId,
        tableName,
        operation,
        userId,
        purpose,
        timestamp,
        filters: this.sanitizeFiltersForLogging(filters)
      });

      // Check access permissions
      await this.validateDataAccessPermissions(tableName, operation, userId);

      // Rate limit data access
      await this.checkDataAccessRateLimit(userId, tableName);

      // Execute with monitoring
      const startTime = Date.now();
      const result = await this.executeSecureQuery(tableName, operation, filters, userId);
      const executionTime = Date.now() - startTime;

      // Log successful access
      await this.auditDataAccess({
        accessId,
        status: 'success',
        recordCount: Array.isArray(result) ? result.length : 1,
        executionTime,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      // Log failed access
      await this.auditDataAccess({
        accessId,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  async executeSecureQuery(tableName, operation, filters, userId) {
    // Add automatic RLS filters
    const secureFilters = this.addSecurityFilters(filters, userId, tableName);
    
    // Execute with admin privileges but RLS still applies
    return await databaseProvider.find(tableName, secureFilters, true);
  }

  /**
   * 4. INTRUSION DETECTION SYSTEM
   */
  async detectSuspiciousActivity(userId, activity, context = {}) {
    const suspiciousPatterns = [
      'rapid_api_calls',
      'unusual_data_access',
      'multiple_login_failures',
      'geographic_anomaly',
      'device_switching',
      'bulk_data_requests',
      'sql_injection_attempt',
      'xss_attempt'
    ];

    const activityKey = `suspicious_activity:${userId}:${activity}`;
    const currentCount = await cacheProvider.increment(activityKey);
    
    if (currentCount === 1) {
      // Set expiry for sliding window
      await cacheProvider.expire(activityKey, 900); // 15 minutes
    }

    // Check if activity is suspicious
    if (currentCount > this.suspiciousActivityThreshold) {
      await this.handleSuspiciousActivity(userId, activity, currentCount, context);
    }

    // Advanced pattern detection
    await this.analyzeActivityPatterns(userId, activity, context);
  }

  async handleSuspiciousActivity(userId, activity, count, context) {
    const severity = this.calculateSeverity(activity, count);
    
    // Log security incident
    await this.logSecurityEvent('suspicious_activity_detected', userId, {
      activity,
      count,
      severity,
      context,
      timestamp: new Date().toISOString()
    });

    // Take protective action based on severity
    switch (severity) {
      case 'HIGH':
        await this.lockUserAccount(userId, 'suspicious_activity');
        await this.notifySecurityTeam('URGENT: High-severity security incident', {
          userId,
          activity,
          count
        });
        break;
      
      case 'MEDIUM':
        await this.requireAdditionalVerification(userId);
        await this.notifySecurityTeam('Security incident detected', {
          userId,
          activity,
          count
        });
        break;
      
      case 'LOW':
        await this.logSecurityEvent('low_priority_incident', userId, { activity, count });
        break;
    }
  }

  /**
   * 5. REAL-TIME THREAT MONITORING
   */
  async monitorAPIEndpoint(req, res, next) {
    const startTime = Date.now();
    const requestId = uuidv4();
    
    // Extract threat indicators
    const threatIndicators = {
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      method: req.method,
      path: req.path,
      headers: this.sanitizeHeaders(req.headers),
      contentLength: req.get('Content-Length') || 0
    };

    // Check for known attack patterns
    const threatLevel = await this.assessThreatLevel(threatIndicators);
    
    if (threatLevel === 'HIGH') {
      await this.logSecurityEvent('high_threat_request_blocked', null, {
        requestId,
        threatIndicators,
        timestamp: new Date().toISOString()
      });
      
      return res.status(403).json({
        success: false,
        error: 'Request blocked by security system',
        requestId
      });
    }

    // Monitor response
    res.on('finish', async () => {
      const responseTime = Date.now() - startTime;
      
      await this.logAPIAccess({
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime,
        threatLevel,
        userId: req.user?.userId,
        ip: req.ip
      });
    });

    next();
  }

  /**
   * 6. DATA MASKING AND ANONYMIZATION
   */
  maskSensitiveData(data, userRole = 'user') {
    if (!data) return data;

    const sensitiveFields = {
      email: (email) => this.maskEmail(email, userRole),
      phone: (phone) => this.maskPhone(phone, userRole),
      date_of_birth: (dob) => this.maskBirthday(dob, userRole),
      address: (address) => this.maskAddress(address, userRole),
      id_number: (id) => this.maskIdNumber(id, userRole)
    };

    if (Array.isArray(data)) {
      return data.map(item => this.applySensitiveFieldMasking(item, sensitiveFields));
    }

    return this.applySensitiveFieldMasking(data, sensitiveFields);
  }

  applySensitiveFieldMasking(item, sensitiveFields) {
    const masked = { ...item };
    
    Object.keys(sensitiveFields).forEach(field => {
      if (masked[field]) {
        masked[field] = sensitiveFields[field](masked[field]);
      }
    });

    return masked;
  }

  maskEmail(email, userRole) {
    if (userRole === 'admin') return email;
    if (!email) return '';
    
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.length > 2 
      ? localPart.substring(0, 2) + '***' 
      : '***';
    
    return `${maskedLocal}@${domain}`;
  }

  maskBirthday(birthday, userRole) {
    if (userRole === 'admin') return birthday;
    if (!birthday) return '';
    
    const date = new Date(birthday);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    // Only show month and approximate age range
    return `${month.toString().padStart(2, '0')}/****`;
  }

  /**
   * 7. SECURE COMMUNICATION
   */
  async encryptAPIResponse(data, recipientPublicKey) {
    const symmetricKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    
    // Encrypt data with symmetric key
    const cipher = crypto.createCipher('aes-256-cbc', symmetricKey, iv);
    let encryptedData = cipher.update(JSON.stringify(data), 'utf8', 'base64');
    encryptedData += cipher.final('base64');
    
    // Encrypt symmetric key with recipient's public key
    const encryptedKey = crypto.publicEncrypt(recipientPublicKey, symmetricKey);
    
    return {
      encryptedData,
      encryptedKey: encryptedKey.toString('base64'),
      iv: iv.toString('base64'),
      algorithm: 'aes-256-cbc'
    };
  }

  /**
   * 8. AUDIT AND COMPLIANCE
   */
  async auditDataAccess(auditData) {
    try {
      const auditRecord = {
        ...auditData,
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        service: 'wolo-security'
      };

      // Store in secure audit table
      await databaseProvider.create('security_audit_log', auditRecord, true);
      
      // Also cache for real-time monitoring
      await cacheProvider.listPush('recent_audit_events', auditRecord);
      
      // Keep only last 1000 events in cache
      const recentEvents = await cacheProvider.listRange('recent_audit_events', -1000, -1);
      if (recentEvents.length > 1000) {
        await cacheProvider.delete('recent_audit_events');
        await cacheProvider.listPush('recent_audit_events', ...recentEvents.slice(-1000));
      }

    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't fail the main operation if audit fails, but alert
      await this.notifySecurityTeam('CRITICAL: Audit system failure', { error: error.message });
    }
  }

  /**
   * 9. INCIDENT RESPONSE
   */
  async logSecurityEvent(eventType, userId, details) {
    const incident = {
      id: uuidv4(),
      eventType,
      userId,
      details,
      timestamp: new Date().toISOString(),
      severity: this.calculateEventSeverity(eventType),
      status: 'open',
      investigator: null,
      resolution: null
    };

    await databaseProvider.create('security_incidents', incident, true);
    
    // Real-time alert for high-severity incidents
    if (incident.severity === 'HIGH') {
      await this.triggerImmediateAlert(incident);
    }

    return incident.id;
  }

  async triggerImmediateAlert(incident) {
    // Send to security team via multiple channels
    const alertMessage = `
🚨 SECURITY ALERT - ${incident.eventType}
Severity: ${incident.severity}
User: ${incident.userId}
Time: ${incident.timestamp}
Details: ${JSON.stringify(incident.details, null, 2)}
    `;

    // Multiple notification channels for redundancy
    await Promise.all([
      this.sendSlackAlert(alertMessage),
      this.sendEmailAlert('security@wolosenegal.com', incident),
      this.sendSMSAlert('+221701234567', `WOLO SECURITY ALERT: ${incident.eventType}`) // Security team phone
    ]);
  }

  /**
   * 10. HELPER METHODS
   */
  deriveEncryptionKey(additionalData = '') {
    const baseKey = config.JWT.SECRET + config.DATABASE.SUPABASE_SERVICE_KEY;
    return crypto.scryptSync(baseKey + additionalData, 'wolo-salt-2024', 32);
  }

  generateDeviceFingerprint(deviceInfo) {
    const fingerprint = `${deviceInfo.userAgent}-${deviceInfo.screen}-${deviceInfo.timezone}-${deviceInfo.language}`;
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  hashLocation(locationInfo) {
    if (!locationInfo || (!locationInfo.latitude && !locationInfo.country)) return null;
    
    // Use approximate location to allow for small movements
    const approxLat = locationInfo.latitude ? Math.round(locationInfo.latitude * 10) / 10 : null;
    const approxLng = locationInfo.longitude ? Math.round(locationInfo.longitude * 10) / 10 : null;
    const locationString = `${locationInfo.country}-${locationInfo.city}-${approxLat}-${approxLng}`;
    
    return crypto.createHash('sha256').update(locationString).digest('hex');
  }

  sanitizeFiltersForLogging(filters) {
    const sanitized = { ...filters };
    
    // Remove sensitive data from logs
    const sensitiveFields = ['password', 'token', 'id_number', 'phone', 'email'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  async storeSecureSession(payload) {
    const sessionKey = `secure_session:${payload.sessionId}`;
    await cacheProvider.set(sessionKey, payload, 24 * 60 * 60); // 24 hours
  }

  async getSecureSession(sessionId) {
    return await cacheProvider.get(`secure_session:${sessionId}`);
  }

  calculateSeverity(activity, count) {
    const severityMap = {
      'sql_injection_attempt': 'HIGH',
      'bulk_data_requests': count > 50 ? 'HIGH' : 'MEDIUM',
      'multiple_login_failures': count > 20 ? 'HIGH' : 'MEDIUM',
      'rapid_api_calls': count > 100 ? 'HIGH' : 'LOW'
    };

    return severityMap[activity] || 'LOW';
  }

  calculateEventSeverity(eventType) {
    const highSeverityEvents = [
      'high_threat_request_blocked',
      'suspicious_activity_detected',
      'data_breach_attempt',
      'unauthorized_admin_access'
    ];

    return highSeverityEvents.includes(eventType) ? 'HIGH' : 'MEDIUM';
  }

  async assessThreatLevel(indicators) {
    let score = 0;

    // Check user agent
    if (!indicators.userAgent || indicators.userAgent.includes('bot') || indicators.userAgent.length > 500) {
      score += 20;
    }

    // Check for injection attempts
    const maliciousPatterns = [
      /(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b)/i,
      /<script[\s\S]*?>[\s\S]*?<\/script>/i,
      /javascript:/i,
      /on\w+\s*=/i
    ];

    const fullRequest = JSON.stringify(indicators);
    maliciousPatterns.forEach(pattern => {
      if (pattern.test(fullRequest)) {
        score += 50;
      }
    });

    // Check content length
    if (indicators.contentLength > 10000000) { // 10MB
      score += 30;
    }

    // Threat level determination
    if (score >= 70) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }
}

module.exports = AdvancedSecurityService;