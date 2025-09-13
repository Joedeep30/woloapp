const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const config = require('../../../shared/config');
const databaseProvider = require('../../../shared/providers/database');
const cacheProvider = require('../../../shared/providers/cache');

class AuthController {
  /**
   * User registration
   */
  async register(req, res) {
    try {
      const { email, password, first_name, last_name, telephone, date_of_birth } = req.body;

      // Validation
      if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Email, mot de passe, prénom et nom requis'
        });
      }

      // Validate password strength
      if (password.length < config.SECURITY.PASSWORD_MIN_LENGTH) {
        return res.status(400).json({
          success: false,
          error: 'Password too weak',
          message: `Le mot de passe doit contenir au moins ${config.SECURITY.PASSWORD_MIN_LENGTH} caractères`
        });
      }

      // Check if user already exists
      const existingUser = await databaseProvider.findOne('users', { email: email.toLowerCase() }, true);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User already exists',
          message: 'Un utilisateur avec cet email existe déjà'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, config.SECURITY.BCRYPT_ROUNDS);

      // Create user
      const userData = {
        id: uuidv4(),
        email: email.toLowerCase(),
        password: hashedPassword,
        email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const [newUser] = await databaseProvider.create('users', userData, true);

      // Create user profile
      const profileData = {
        user_id: newUser.id,
        first_name,
        last_name,
        telephone: telephone || null,
        date_of_birth: date_of_birth || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await databaseProvider.create('profiles', profileData, true);

      // Initialize points balance
      const pointsData = {
        user_id: newUser.id,
        total_points: 0,
        available_points: 0,
        used_points: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await databaseProvider.create('points_balances', pointsData, true);

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(newUser);

      // Store refresh token
      await this.storeRefreshToken(newUser.id, refreshToken);

      // Remove password from response
      delete newUser.password;

      res.status(201).json({
        success: true,
        message: 'Inscription réussie',
        user: newUser,
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: 'Bearer',
          expires_in: '24h'
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed',
        message: 'Erreur lors de l\'inscription'
      });
    }
  }

  /**
   * User login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Missing credentials',
          message: 'Email et mot de passe requis'
        });
      }

      // Check for too many failed attempts
      const lockKey = `login_attempts:${email.toLowerCase()}`;
      const attempts = await cacheProvider.get(lockKey) || 0;

      if (attempts >= config.SECURITY.MAX_LOGIN_ATTEMPTS) {
        return res.status(423).json({
          success: false,
          error: 'Account locked',
          message: 'Compte temporairement verrouillé. Réessayez plus tard.',
          retryAfter: Math.floor(config.SECURITY.LOCKOUT_TIME / 60000) + ' minutes'
        });
      }

      // Find user
      const user = await databaseProvider.findOne('users', { 
        email: email.toLowerCase() 
      }, true);

      if (!user) {
        await this.recordFailedAttempt(email);
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        await this.recordFailedAttempt(email);
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Check if account is active
      if (user.status === 'inactive') {
        return res.status(403).json({
          success: false,
          error: 'Account inactive',
          message: 'Votre compte est temporairement désactivé'
        });
      }

      // Clear failed attempts
      await cacheProvider.delete(lockKey);

      // Update last login
      await databaseProvider.update('users', { id: user.id }, { 
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, true);

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(user);

      // Store refresh token
      await this.storeRefreshToken(user.id, refreshToken);

      // Get user profile
      const profile = await databaseProvider.findOne('profiles', { user_id: user.id }, true);

      // Remove password from response
      delete user.password;

      res.json({
        success: true,
        message: 'Connexion réussie',
        user: {
          ...user,
          profile
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: 'Bearer',
          expires_in: '24h'
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed',
        message: 'Erreur lors de la connexion'
      });
    }
  }

  /**
   * Social login (Google, Facebook, Apple)
   */
  async socialLogin(req, res) {
    try {
      const { provider, provider_id, email, first_name, last_name, avatar_url } = req.body;

      if (!provider || !provider_id || !email) {
        return res.status(400).json({
          success: false,
          error: 'Missing social login data',
          message: 'Données de connexion sociale manquantes'
        });
      }

      // Check if user exists by social provider
      let user = await databaseProvider.findOne('users', {
        provider,
        provider_id
      }, true);

      if (!user) {
        // Check if user exists by email
        user = await databaseProvider.findOne('users', {
          email: email.toLowerCase()
        }, true);

        if (user) {
          // Link social account to existing user
          await databaseProvider.update('users', { id: user.id }, {
            provider,
            provider_id,
            updated_at: new Date().toISOString()
          }, true);
        } else {
          // Create new user
          const userData = {
            id: uuidv4(),
            email: email.toLowerCase(),
            provider,
            provider_id,
            email_verified: true, // Social accounts are pre-verified
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          [user] = await databaseProvider.create('users', userData, true);

          // Create user profile
          const profileData = {
            user_id: user.id,
            first_name: first_name || '',
            last_name: last_name || '',
            avatar_url: avatar_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          await databaseProvider.create('profiles', profileData, true);

          // Initialize points balance
          const pointsData = {
            user_id: user.id,
            total_points: 0,
            available_points: 0,
            used_points: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          await databaseProvider.create('points_balances', pointsData, true);
        }
      }

      // Update last login
      await databaseProvider.update('users', { id: user.id }, {
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, true);

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(user);

      // Store refresh token
      await this.storeRefreshToken(user.id, refreshToken);

      // Get user profile
      const profile = await databaseProvider.findOne('profiles', { user_id: user.id }, true);

      res.json({
        success: true,
        message: 'Connexion sociale réussie',
        user: {
          ...user,
          profile
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: 'Bearer',
          expires_in: '24h'
        }
      });

    } catch (error) {
      console.error('Social login error:', error);
      res.status(500).json({
        success: false,
        error: 'Social login failed',
        message: 'Erreur lors de la connexion sociale'
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          error: 'Missing refresh token',
          message: 'Token de rafraîchissement requis'
        });
      }

      // Verify refresh token
      let decoded;
      try {
        decoded = jwt.verify(refresh_token, config.JWT.SECRET);
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
          message: 'Token de rafraîchissement invalide'
        });
      }

      // Check if refresh token exists in cache
      const storedToken = await cacheProvider.get(`refresh_token:${decoded.userId}`);
      if (!storedToken || storedToken !== refresh_token) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
          message: 'Token de rafraîchissement invalide'
        });
      }

      // Get user
      const user = await databaseProvider.findOne('users', { id: decoded.userId }, true);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
          message: 'Utilisateur non trouvé'
        });
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user);

      // Store new refresh token
      await this.storeRefreshToken(user.id, newRefreshToken);

      res.json({
        success: true,
        message: 'Token rafraîchi avec succès',
        tokens: {
          access_token: accessToken,
          refresh_token: newRefreshToken,
          token_type: 'Bearer',
          expires_in: '24h'
        }
      });

    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        error: 'Token refresh failed',
        message: 'Erreur lors du rafraîchissement du token'
      });
    }
  }

  /**
   * User logout
   */
  async logout(req, res) {
    try {
      const { userId } = req.user;

      // Remove refresh token from cache
      await cacheProvider.delete(`refresh_token:${userId}`);

      res.json({
        success: true,
        message: 'Déconnexion réussie'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
        message: 'Erreur lors de la déconnexion'
      });
    }
  }

  /**
   * Get current user info
   */
  async getMe(req, res) {
    try {
      const { userId } = req.user;

      // Get user
      const user = await databaseProvider.findOne('users', { id: userId }, true);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'Utilisateur non trouvé'
        });
      }

      // Get profile
      const profile = await databaseProvider.findOne('profiles', { user_id: userId }, true);

      // Get points balance
      const pointsBalance = await databaseProvider.findOne('points_balances', { user_id: userId }, true);

      // Remove sensitive information
      delete user.password;

      res.json({
        success: true,
        user: {
          ...user,
          profile,
          points_balance: pointsBalance
        }
      });

    } catch (error) {
      console.error('Get user info error:', error);
      res.status(500).json({
        success: false,
        error: 'Get user info failed',
        message: 'Erreur lors de la récupération des informations utilisateur'
      });
    }
  }

  /**
   * Generate JWT tokens
   */
  generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      type: 'access'
    };

    const accessToken = jwt.sign(payload, config.JWT.SECRET, {
      expiresIn: config.JWT.EXPIRES_IN
    });

    const refreshPayload = {
      userId: user.id,
      type: 'refresh'
    };

    const refreshToken = jwt.sign(refreshPayload, config.JWT.SECRET, {
      expiresIn: config.JWT.REFRESH_EXPIRES_IN
    });

    return { accessToken, refreshToken };
  }

  /**
   * Store refresh token in cache
   */
  async storeRefreshToken(userId, refreshToken) {
    const refreshTTL = 7 * 24 * 60 * 60; // 7 days in seconds
    await cacheProvider.set(`refresh_token:${userId}`, refreshToken, refreshTTL);
  }

  /**
   * Record failed login attempt
   */
  async recordFailedAttempt(email) {
    const lockKey = `login_attempts:${email.toLowerCase()}`;
    const attempts = await cacheProvider.get(lockKey) || 0;
    const lockoutTTL = Math.floor(config.SECURITY.LOCKOUT_TIME / 1000);
    
    await cacheProvider.set(lockKey, attempts + 1, lockoutTTL);
  }
}

module.exports = new AuthController();