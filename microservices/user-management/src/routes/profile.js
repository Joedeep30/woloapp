const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const databaseProvider = require('../../../shared/providers/database');
const cacheProvider = require('../../../shared/providers/cache');

const router = express.Router();

/**
 * @route GET /profile
 * @desc Get user profile
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    // Try cache first
    const cacheKey = `profile:${userId}`;
    let profile = await cacheProvider.get(cacheKey);

    if (!profile) {
      // Get from database
      profile = await databaseProvider.findOne('profiles', { user_id: userId }, true);
      
      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found',
          message: 'Profil non trouvé'
        });
      }

      // Cache for 30 minutes
      await cacheProvider.set(cacheKey, profile, 30 * 60);
    }

    res.json({
      success: true,
      profile: profile
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Get profile failed',
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

/**
 * @route PUT /profile
 * @desc Update user profile
 * @access Private
 */
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const allowedFields = [
      'first_name', 'last_name', 'telephone', 'date_of_birth',
      'address', 'city', 'country', 'bio', 'avatar_url'
    ];

    // Filter only allowed fields
    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key) && req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update',
        message: 'Aucun champ valide à mettre à jour'
      });
    }

    // Update profile
    const updatedProfile = await databaseProvider.update(
      'profiles',
      { user_id: userId },
      updateData,
      true
    );

    if (!updatedProfile || updatedProfile.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
        message: 'Profil non trouvé'
      });
    }

    // Clear cache
    const cacheKey = `profile:${userId}`;
    await cacheProvider.delete(cacheKey);

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      profile: updatedProfile[0]
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Update profile failed',
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
});

/**
 * @route GET /profile/:userId
 * @desc Get public profile by user ID
 * @access Public
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required',
        message: 'ID utilisateur requis'
      });
    }

    // Get public profile fields only
    const cacheKey = `public_profile:${userId}`;
    let profile = await cacheProvider.get(cacheKey);

    if (!profile) {
      const fullProfile = await databaseProvider.findOne('profiles', { user_id: userId }, true);
      
      if (!fullProfile) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found',
          message: 'Profil non trouvé'
        });
      }

      // Return only public fields
      profile = {
        user_id: fullProfile.user_id,
        first_name: fullProfile.first_name,
        last_name: fullProfile.last_name,
        avatar_url: fullProfile.avatar_url,
        bio: fullProfile.bio,
        created_at: fullProfile.created_at
      };

      // Cache public profile for 1 hour
      await cacheProvider.set(cacheKey, profile, 60 * 60);
    }

    res.json({
      success: true,
      profile: profile
    });

  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Get profile failed',
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

/**
 * @route GET /profile/points/balance
 * @desc Get user points balance
 * @access Private
 */
router.get('/points/balance', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    // Try cache first
    const cacheKey = `points_balance:${userId}`;
    let pointsBalance = await cacheProvider.get(cacheKey);

    if (!pointsBalance) {
      pointsBalance = await databaseProvider.findOne('points_balances', { user_id: userId }, true);
      
      if (!pointsBalance) {
        // Create initial balance if not exists
        const initialBalance = {
          user_id: userId,
          total_points: 0,
          available_points: 0,
          used_points: 0
        };
        
        const [newBalance] = await databaseProvider.create('points_balances', initialBalance, true);
        pointsBalance = newBalance;
      }

      // Cache for 10 minutes
      await cacheProvider.set(cacheKey, pointsBalance, 10 * 60);
    }

    res.json({
      success: true,
      points_balance: pointsBalance
    });

  } catch (error) {
    console.error('Get points balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Get points balance failed',
      message: 'Erreur lors de la récupération du solde de points'
    });
  }
});

/**
 * @route GET /profile/points/history
 * @desc Get user points transaction history
 * @access Private
 */
router.get('/points/history', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 items
    const offset = (page - 1) * limit;

    // Get transactions (this would need a more sophisticated query in a real implementation)
    const transactions = await databaseProvider.find('point_transactions', { user_id: userId }, true);
    
    if (!transactions) {
      return res.json({
        success: true,
        transactions: [],
        pagination: {
          page: 1,
          limit: limit,
          total: 0,
          pages: 0
        }
      });
    }

    // Sort by date (newest first) and paginate
    const sortedTransactions = transactions
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(offset, offset + limit);

    const total = transactions.length;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      transactions: sortedTransactions,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('Get points history error:', error);
    res.status(500).json({
      success: false,
      error: 'Get points history failed',
      message: 'Erreur lors de la récupération de l\'historique des points'
    });
  }
});

/**
 * @route POST /profile/upload-avatar
 * @desc Upload user avatar (placeholder - would need file upload middleware)
 * @access Private
 */
router.post('/upload-avatar', authenticateToken, async (req, res) => {
  // TODO: Implement file upload with multer or similar
  res.status(501).json({
    success: false,
    error: 'Not implemented',
    message: 'Fonctionnalité en cours de développement'
  });
});

module.exports = router;