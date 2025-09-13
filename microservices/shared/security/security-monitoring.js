// =====================================================
// WOLO REAL-TIME SECURITY MONITORING SERVICE
// Banking-grade threat detection and incident response
// =====================================================

const EventEmitter = require('events');
const rateLimit = require('express-rate-limit');
const geoip = require('geoip-lite');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SecurityMonitoringService extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      suspiciousLoginThreshold: options.suspiciousLoginThreshold || 5,
      bulkAccessThreshold: options.bulkAccessThreshold || 100,
      suspiciousLocationRadius: options.suspiciousLocationRadius || 500, // km
      alertChannels: options.alertChannels || ['email', 'sms', 'dashboard'],
      enableGeoBlocking: options.enableGeoBlocking || false,
      blockedCountries: options.blockedCountries || ['CN', 'RU'], // Example blocked countries
      enableBehaviorAnalytics: options.enableBehaviorAnalytics || true,
      riskScoreThreshold: options.riskScoreThreshold || 70,
      ...options
    };

    this.activeThreats = new Map();
    this.userBehaviorProfiles = new Map();
    this.recentEvents = [];
    this.alertBuffer = [];
    
    this.startMonitoring();
  }

  // Start monitoring processes
  startMonitoring() {
    console.log('🛡️  Security monitoring service starting...');
    
    // Clean old events every 5 minutes
    setInterval(() => this.cleanOldEvents(), 5 * 60 * 1000);
    
    // Process alert buffer every 30 seconds
    setInterval(() => this.processAlertBuffer(), 30 * 1000);
    
    // Update behavior profiles every minute
    if (this.config.enableBehaviorAnalytics) {
      setInterval(() => this.updateBehaviorProfiles(), 60 * 1000);
    }

    console.log('✅ Security monitoring active');
  }

  // Log and analyze security event
  logSecurityEvent(eventData) {
    const event = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...eventData
    };

    this.recentEvents.push(event);
    this.emit('security:event', event);

    // Immediate threat analysis
    this.analyzeEvent(event);

    return event.id;
  }

  // Analyze individual security event for threats
  analyzeEvent(event) {
    const riskScore = this.calculateRiskScore(event);
    
    if (riskScore >= this.config.riskScoreThreshold) {
      this.handleHighRiskEvent(event, riskScore);
    }

    // Specific threat detection rules
    switch (event.type) {
      case 'login_attempt':
        this.analyzeLoginAttempt(event);
        break;
      
      case 'data_access':
        this.analyzeDataAccess(event);
        break;
      
      case 'suspicious_activity':
        this.handleSuspiciousActivity(event);
        break;
      
      case 'payment_transaction':
        this.analyzePaymentSecurity(event);
        break;

      case 'api_abuse':
        this.analyzeAPIAbuse(event);
        break;
    }
  }

  // Calculate risk score for event (0-100)
  calculateRiskScore(event) {
    let score = 0;

    // Geographic risk
    if (event.ip && this.config.enableGeoBlocking) {
      const geo = geoip.lookup(event.ip);
      if (geo && this.config.blockedCountries.includes(geo.country)) {
        score += 40;
      }
    }

    // Time-based risk (unusual hours)
    const hour = new Date(event.timestamp).getHours();
    if (hour < 6 || hour > 22) {
      score += 15;
    }

    // Failed attempts frequency
    if (event.type === 'login_attempt' && !event.success) {
      const recentFailures = this.getRecentEventCount(event.userId, 'login_attempt', 15);
      score += Math.min(recentFailures * 10, 40);
    }

    // Bulk access patterns
    if (event.type === 'data_access') {
      const recentAccess = this.getRecentEventCount(event.userId, 'data_access', 5);
      if (recentAccess > this.config.bulkAccessThreshold) {
        score += 35;
      }
    }

    // Device/location changes
    if (event.deviceId && event.userId) {
      const profile = this.userBehaviorProfiles.get(event.userId);
      if (profile) {
        if (!profile.knownDevices.includes(event.deviceId)) {
          score += 20;
        }
        if (event.location && !this.isKnownLocation(event.userId, event.location)) {
          score += 25;
        }
      }
    }

    // Age-related risk (minors need extra protection)
    if (event.userAge && event.userAge < 18) {
      score += 10; // Slightly higher vigilance for minors
    }

    return Math.min(score, 100);
  }

  // Analyze login attempts for suspicious patterns
  analyzeLoginAttempt(event) {
    const userId = event.userId || event.email;
    const recentFailures = this.getRecentEventCount(userId, 'login_attempt', 15);

    // Brute force detection
    if (recentFailures >= this.config.suspiciousLoginThreshold) {
      this.createSecurityIncident({
        type: 'brute_force_attempt',
        severity: 'HIGH',
        userId: userId,
        details: {
          attempts: recentFailures,
          timeWindow: '15 minutes',
          ip: event.ip,
          userAgent: event.userAgent
        }
      });
    }

    // Geographic anomaly detection
    if (event.ip && event.userId) {
      const geo = geoip.lookup(event.ip);
      if (geo && this.isUnusualLocation(event.userId, geo)) {
        this.createSecurityIncident({
          type: 'unusual_login_location',
          severity: 'MEDIUM',
          userId: event.userId,
          details: {
            country: geo.country,
            city: geo.city,
            ip: event.ip,
            coordinates: [geo.ll[0], geo.ll[1]]
          }
        });
      }
    }
  }

  // Analyze data access patterns
  analyzeDataAccess(event) {
    const recentAccess = this.getRecentEventCount(event.userId, 'data_access', 5);
    
    if (recentAccess > this.config.bulkAccessThreshold) {
      this.createSecurityIncident({
        type: 'bulk_data_access',
        severity: 'HIGH',
        userId: event.userId,
        details: {
          accessCount: recentAccess,
          timeWindow: '5 minutes',
          tables: event.tables || [],
          records: event.recordCount || 0
        }
      });
    }

    // Sensitive data access by minors
    if (event.userAge && event.userAge < 18 && event.sensitiveData) {
      this.createSecurityIncident({
        type: 'minor_sensitive_access',
        severity: 'MEDIUM',
        userId: event.userId,
        details: {
          dataType: event.dataType,
          age: event.userAge
        }
      });
    }
  }

  // Handle suspicious activity events
  handleSuspiciousActivity(event) {
    this.createSecurityIncident({
      type: event.activityType || 'general_suspicious',
      severity: event.severity || 'MEDIUM',
      userId: event.userId,
      details: event.details || {}
    });
  }

  // Analyze payment transaction security
  analyzePaymentSecurity(event) {
    // Unusual amount detection
    const profile = this.userBehaviorProfiles.get(event.userId);
    if (profile && profile.averageTransaction) {
      const deviation = Math.abs(event.amount - profile.averageTransaction) / profile.averageTransaction;
      
      if (deviation > 5) { // 500% deviation
        this.createSecurityIncident({
          type: 'unusual_transaction_amount',
          severity: 'MEDIUM',
          userId: event.userId,
          details: {
            amount: event.amount,
            averageAmount: profile.averageTransaction,
            deviation: deviation
          }
        });
      }
    }

    // Rapid transaction detection
    const recentTransactions = this.getRecentEventCount(event.userId, 'payment_transaction', 10);
    if (recentTransactions > 5) {
      this.createSecurityIncident({
        type: 'rapid_transactions',
        severity: 'HIGH',
        userId: event.userId,
        details: {
          transactionCount: recentTransactions,
          timeWindow: '10 minutes'
        }
      });
    }
  }

  // Analyze API abuse patterns
  analyzeAPIAbuse(event) {
    const recentAPIRequests = this.getRecentEventCount(event.ip, 'api_request', 1);
    
    if (recentAPIRequests > 100) { // 100 requests per minute
      this.createSecurityIncident({
        type: 'api_rate_limit_abuse',
        severity: 'HIGH',
        userId: event.userId || 'anonymous',
        details: {
          ip: event.ip,
          requestCount: recentAPIRequests,
          endpoint: event.endpoint
        }
      });
    }
  }

  // Create security incident
  createSecurityIncident(incidentData) {
    const incident = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      status: 'open',
      ...incidentData
    };

    this.activeThreats.set(incident.id, incident);
    this.emit('security:incident', incident);

    // Add to alert buffer for processing
    this.alertBuffer.push({
      type: 'incident',
      data: incident,
      timestamp: new Date()
    });

    console.log(`🚨 Security incident created: ${incident.type} (${incident.severity})`);
    
    return incident.id;
  }

  // Handle high risk events immediately
  handleHighRiskEvent(event, riskScore) {
    console.log(`⚠️  High risk event detected: ${event.type} (Risk: ${riskScore})`);
    
    const incident = this.createSecurityIncident({
      type: 'high_risk_event',
      severity: riskScore > 90 ? 'CRITICAL' : 'HIGH',
      userId: event.userId,
      details: {
        originalEvent: event,
        riskScore: riskScore,
        riskFactors: this.identifyRiskFactors(event)
      }
    });

    // Immediate response actions
    if (riskScore > 90) {
      this.triggerEmergencyResponse(event, incident);
    }
  }

  // Trigger emergency response for critical threats
  triggerEmergencyResponse(event, incident) {
    console.log('🚨 CRITICAL SECURITY ALERT - Emergency response triggered');
    
    // Emergency actions
    const actions = [];

    // Consider temporary account lockout for critical threats
    if (event.userId && incident.severity === 'CRITICAL') {
      actions.push({
        type: 'temporary_lockout',
        userId: event.userId,
        duration: '1 hour'
      });
    }

    // IP blocking for severe abuse
    if (event.ip && ['api_abuse', 'brute_force'].includes(incident.type)) {
      actions.push({
        type: 'ip_block',
        ip: event.ip,
        duration: '24 hours'
      });
    }

    // Send immediate alerts
    this.sendImmediateAlert({
      type: 'critical_security_incident',
      incident: incident,
      suggestedActions: actions,
      requiresImmedateAttention: true
    });

    incident.emergencyActions = actions;
    incident.emergencyTriggered = true;
  }

  // Update user behavior profiles
  updateBehaviorProfiles() {
    if (!this.config.enableBehaviorAnalytics) return;

    const now = new Date();
    const cutoff = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // Last 7 days

    // Update profiles based on recent events
    const userEvents = {};
    
    this.recentEvents
      .filter(event => event.timestamp > cutoff && event.userId)
      .forEach(event => {
        if (!userEvents[event.userId]) {
          userEvents[event.userId] = [];
        }
        userEvents[event.userId].push(event);
      });

    for (const [userId, events] of Object.entries(userEvents)) {
      const profile = this.calculateBehaviorProfile(userId, events);
      this.userBehaviorProfiles.set(userId, profile);
    }
  }

  // Calculate behavior profile for user
  calculateBehaviorProfile(userId, events) {
    const profile = {
      userId: userId,
      lastUpdated: new Date(),
      knownDevices: [],
      knownLocations: [],
      averageTransaction: 0,
      loginPatterns: {},
      activityHours: [],
      riskLevel: 'LOW'
    };

    // Extract device information
    profile.knownDevices = [...new Set(
      events.filter(e => e.deviceId).map(e => e.deviceId)
    )];

    // Extract location information
    const locations = events
      .filter(e => e.ip)
      .map(e => geoip.lookup(e.ip))
      .filter(geo => geo)
      .map(geo => ({
        country: geo.country,
        city: geo.city,
        coordinates: geo.ll
      }));
    
    profile.knownLocations = locations.slice(-10); // Keep last 10 locations

    // Calculate average transaction amount
    const transactions = events.filter(e => e.type === 'payment_transaction' && e.amount);
    if (transactions.length > 0) {
      profile.averageTransaction = transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length;
    }

    // Extract activity hour patterns
    profile.activityHours = events.map(e => new Date(e.timestamp).getHours());
    
    // Calculate risk level
    const failedLogins = events.filter(e => e.type === 'login_attempt' && !e.success).length;
    const totalLogins = events.filter(e => e.type === 'login_attempt').length;
    
    if (failedLogins / Math.max(totalLogins, 1) > 0.3) {
      profile.riskLevel = 'HIGH';
    } else if (failedLogins > 5) {
      profile.riskLevel = 'MEDIUM';
    }

    return profile;
  }

  // Check if location is unusual for user
  isUnusualLocation(userId, geoData) {
    const profile = this.userBehaviorProfiles.get(userId);
    if (!profile || profile.knownLocations.length === 0) {
      return false; // No baseline yet
    }

    // Check if location is significantly far from known locations
    const currentCoords = geoData.ll;
    
    return !profile.knownLocations.some(knownLocation => {
      const distance = this.calculateDistance(
        currentCoords[0], currentCoords[1],
        knownLocation.coordinates[0], knownLocation.coordinates[1]
      );
      return distance < this.config.suspiciousLocationRadius;
    });
  }

  // Check if location is known for user
  isKnownLocation(userId, location) {
    const profile = this.userBehaviorProfiles.get(userId);
    if (!profile) return false;

    return profile.knownLocations.some(known => 
      known.country === location.country && known.city === location.city
    );
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Get count of recent events
  getRecentEventCount(identifier, eventType, minutesBack) {
    const cutoff = new Date(Date.now() - (minutesBack * 60 * 1000));
    
    return this.recentEvents.filter(event => 
      event.timestamp > cutoff &&
      event.type === eventType &&
      (event.userId === identifier || event.email === identifier || event.ip === identifier)
    ).length;
  }

  // Identify risk factors for an event
  identifyRiskFactors(event) {
    const factors = [];
    
    if (event.ip) {
      const geo = geoip.lookup(event.ip);
      if (geo && this.config.blockedCountries.includes(geo.country)) {
        factors.push(`High-risk country: ${geo.country}`);
      }
    }

    const hour = new Date(event.timestamp).getHours();
    if (hour < 6 || hour > 22) {
      factors.push('Unusual hour activity');
    }

    if (event.type === 'login_attempt' && !event.success) {
      factors.push('Failed login attempt');
    }

    return factors;
  }

  // Process alert buffer
  async processAlertBuffer() {
    if (this.alertBuffer.length === 0) return;

    const alertsToProcess = [...this.alertBuffer];
    this.alertBuffer = [];

    for (const alert of alertsToProcess) {
      try {
        await this.sendAlert(alert);
      } catch (error) {
        console.error('Failed to send alert:', error);
        // Re-queue failed alerts
        this.alertBuffer.push(alert);
      }
    }
  }

  // Send security alert
  async sendAlert(alert) {
    const alertData = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      channels: this.config.alertChannels,
      ...alert
    };

    // Log alert
    console.log(`📢 Security Alert: ${alertData.type}`);
    
    // Emit alert event
    this.emit('security:alert', alertData);

    // Here you would integrate with actual alerting services
    // Email, SMS, Slack, PagerDuty, etc.
    if (this.config.alertChannels.includes('email')) {
      await this.sendEmailAlert(alertData);
    }

    if (this.config.alertChannels.includes('sms')) {
      await this.sendSMSAlert(alertData);
    }

    return alertData.id;
  }

  // Send immediate alert for critical situations
  async sendImmediateAlert(alertData) {
    console.log('🚨 IMMEDIATE ALERT:', alertData.type);
    
    // Priority alert processing
    try {
      await this.sendAlert({
        type: alertData.type,
        priority: 'CRITICAL',
        data: alertData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('❌ Failed to send immediate alert:', error);
    }
  }

  // Placeholder for email alerts
  async sendEmailAlert(alertData) {
    // Integration with SendGrid, AWS SES, etc.
    console.log('📧 Email alert sent:', alertData.type);
    return true;
  }

  // Placeholder for SMS alerts
  async sendSMSAlert(alertData) {
    // Integration with Twilio, AWS SNS, etc.
    console.log('📱 SMS alert sent:', alertData.type);
    return true;
  }

  // Clean old events to prevent memory issues
  cleanOldEvents() {
    const cutoff = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours
    const initialCount = this.recentEvents.length;
    
    this.recentEvents = this.recentEvents.filter(event => event.timestamp > cutoff);
    
    const cleaned = initialCount - this.recentEvents.length;
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} old security events`);
    }
  }

  // Get security dashboard data
  getSecurityDashboard() {
    const now = new Date();
    const last24h = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const last1h = new Date(now.getTime() - (60 * 60 * 1000));

    const recentEvents24h = this.recentEvents.filter(e => e.timestamp > last24h);
    const recentEvents1h = this.recentEvents.filter(e => e.timestamp > last1h);

    return {
      timestamp: now,
      activeThreats: this.activeThreats.size,
      eventsLast24h: recentEvents24h.length,
      eventsLastHour: recentEvents1h.length,
      threatsByType: this.getThreatsByType(),
      topRiskUsers: this.getTopRiskUsers(),
      geographicThreats: this.getGeographicThreats(),
      systemHealth: this.getSystemHealth()
    };
  }

  // Get threats grouped by type
  getThreatsByType() {
    const threats = {};
    
    for (const threat of this.activeThreats.values()) {
      threats[threat.type] = (threats[threat.type] || 0) + 1;
    }

    return threats;
  }

  // Get users with highest risk profiles
  getTopRiskUsers() {
    return Array.from(this.userBehaviorProfiles.entries())
      .filter(([_, profile]) => profile.riskLevel !== 'LOW')
      .sort(([_, a], [__, b]) => {
        const riskOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      })
      .slice(0, 10)
      .map(([userId, profile]) => ({
        userId,
        riskLevel: profile.riskLevel,
        lastActivity: profile.lastUpdated
      }));
  }

  // Get geographic threat distribution
  getGeographicThreats() {
    const countries = {};
    
    this.recentEvents
      .filter(e => e.ip)
      .forEach(event => {
        const geo = geoip.lookup(event.ip);
        if (geo) {
          countries[geo.country] = (countries[geo.country] || 0) + 1;
        }
      });

    return countries;
  }

  // Get system health metrics
  getSystemHealth() {
    return {
      monitoring: 'active',
      eventBufferSize: this.recentEvents.length,
      alertBufferSize: this.alertBuffer.length,
      behaviorProfiles: this.userBehaviorProfiles.size,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  // Manually close security incident
  closeIncident(incidentId, resolution) {
    const incident = this.activeThreats.get(incidentId);
    if (incident) {
      incident.status = 'closed';
      incident.resolution = resolution;
      incident.closedAt = new Date();
      
      this.activeThreats.delete(incidentId);
      this.emit('security:incident:closed', incident);
      
      console.log(`✅ Security incident closed: ${incidentId}`);
      return true;
    }
    return false;
  }

  // Export security logs
  async exportSecurityLogs(startDate, endDate, filePath) {
    const logs = {
      exportTimestamp: new Date(),
      dateRange: { startDate, endDate },
      events: this.recentEvents.filter(e => 
        e.timestamp >= startDate && e.timestamp <= endDate
      ),
      incidents: Array.from(this.activeThreats.values()).filter(i =>
        i.timestamp >= startDate && i.timestamp <= endDate
      )
    };

    await fs.writeFile(filePath, JSON.stringify(logs, null, 2));
    console.log(`📁 Security logs exported to: ${filePath}`);
    
    return logs;
  }
}

module.exports = SecurityMonitoringService;