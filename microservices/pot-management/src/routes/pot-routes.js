// =====================================================
// POT MANAGEMENT ROUTES
// Core pot CRUD operations with invisible security
// =====================================================

const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware, optionalAuth } = require('../../../shared/auth/jwt-auth');
const { logger } = require('../../../shared/utils/logger');

const router = express.Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// =====================================================
// POT CREATION - Ultra smooth UX
// =====================================================

router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { db, cache, securityMonitor } = req.app.locals;
    const userId = req.user.id;
    
    // Log security event (invisible to user)
    securityMonitor.logSecurityEvent({
      type: 'pot_creation_attempt',
      userId: userId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      deviceId: req.headers['x-device-id']
    });

    // Validate required fields
    const { title, description, target_amount, birthday_date, is_public = true } = req.body;
    
    if (!title || !target_amount || !birthday_date) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title, target amount, and birthday date are required',
        required: ['title', 'target_amount', 'birthday_date']
      });
    }

    // Validate target amount
    const amount = parseFloat(target_amount);
    if (isNaN(amount) || amount <= 0 || amount > 10000000) { // Max 10M CFA
      return res.status(400).json({
        error: 'Invalid target amount',
        message: 'Amount must be between 1 and 10,000,000 CFA'
      });
    }

    // Validate birthday date
    const birthdayDate = new Date(birthday_date);
    const now = new Date();
    const oneYearFromNow = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000));
    
    if (birthdayDate < now || birthdayDate > oneYearFromNow) {
      return res.status(400).json({
        error: 'Invalid birthday date',
        message: 'Birthday must be between today and one year from now'
      });
    }

    // Process image if uploaded
    let imageUrl = null;
    if (req.file) {
      try {
        // Optimize image for fast loading
        const optimizedImage = await sharp(req.file.buffer)
          .resize(800, 800, { 
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ 
            quality: 85,
            progressive: true 
          })
          .toBuffer();

        // In a real app, upload to cloud storage (AWS S3, Cloudinary, etc.)
        // For now, we'll store as base64 (in production, use proper cloud storage)
        imageUrl = `data:image/jpeg;base64,${optimizedImage.toString('base64')}`;
        
      } catch (imageError) {
        logger.warn('Image processing failed:', imageError);
        // Don't fail the whole request, just proceed without image
      }
    }

    // Create pot in database
    const potId = uuidv4();
    const potData = {
      id: potId,
      user_id: userId,
      title: title.trim(),
      description: description?.trim() || '',
      target_amount: amount,
      current_amount: 0,
      birthday_date: birthdayDate.toISOString(),
      image_url: imageUrl,
      is_public: Boolean(is_public),
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: pot, error } = await db
      .from('pots')
      .insert([potData])
      .select()
      .single();

    if (error) {
      logger.error('Database error creating pot:', error);
      return res.status(500).json({
        error: 'Failed to create pot',
        message: 'Please try again in a moment'
      });
    }

    // Cache the new pot for fast access
    await cache.setex(`pot:${potId}`, 3600, JSON.stringify(pot)); // 1 hour cache

    // Log successful creation
    securityMonitor.logSecurityEvent({
      type: 'pot_created',
      userId: userId,
      potId: potId,
      amount: amount,
      isPublic: is_public
    });

    logger.info(`✨ New pot created: ${potId} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Your birthday pot is ready! 🎂',
      pot: {
        id: pot.id,
        title: pot.title,
        description: pot.description,
        target_amount: pot.target_amount,
        current_amount: pot.current_amount,
        birthday_date: pot.birthday_date,
        image_url: pot.image_url,
        is_public: pot.is_public,
        status: pot.status,
        created_at: pot.created_at,
        share_url: `${process.env.FRONTEND_URL}/pot/${pot.id}`
      }
    });

  } catch (error) {
    logger.error('Error creating pot:', error);
    res.status(500).json({
      error: 'Failed to create pot',
      message: 'Please try again in a moment'
    });
  }
});

// =====================================================
// GET USER'S POTS
// =====================================================

router.get('/my-pots', authMiddleware, async (req, res) => {
  try {
    const { db, cache } = req.app.locals;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Try cache first
    const cacheKey = `user:${userId}:pots:${page}:${limit}`;
    const cachedPots = await cache.get(cacheKey);
    
    if (cachedPots) {
      return res.json(JSON.parse(cachedPots));
    }

    // Fetch from database
    const { data: pots, error, count } = await db
      .from('pots')
      .select('*, profiles!inner(*)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Database error fetching user pots:', error);
      return res.status(500).json({
        error: 'Failed to fetch pots',
        message: 'Please try again in a moment'
      });
    }

    // Calculate additional metrics
    const potsWithMetrics = pots.map(pot => {
      const daysUntilBirthday = Math.ceil(
        (new Date(pot.birthday_date) - new Date()) / (1000 * 60 * 60 * 24)
      );
      
      const progressPercentage = (pot.current_amount / pot.target_amount) * 100;
      
      return {
        ...pot,
        days_until_birthday: Math.max(0, daysUntilBirthday),
        progress_percentage: Math.round(progressPercentage * 100) / 100,
        share_url: `${process.env.FRONTEND_URL}/pot/${pot.id}`
      };
    });

    const result = {
      pots: potsWithMetrics,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
        has_more: offset + limit < count
      }
    };

    // Cache for 5 minutes
    await cache.setex(cacheKey, 300, JSON.stringify(result));

    res.json(result);

  } catch (error) {
    logger.error('Error fetching user pots:', error);
    res.status(500).json({
      error: 'Failed to fetch pots',
      message: 'Please try again in a moment'
    });
  }
});

// =====================================================
// GET SPECIFIC POT (with privacy controls)
// =====================================================

router.get('/:potId', optionalAuth, async (req, res) => {
  try {
    const { db, cache, securityMonitor } = req.app.locals;
    const { potId } = req.params;
    const userId = req.user?.id;

    // Try cache first
    const cacheKey = `pot:${potId}`;
    const cachedPot = await cache.get(cacheKey);
    
    let pot;
    if (cachedPot) {
      pot = JSON.parse(cachedPot);
    } else {
      // Fetch from database
      const { data, error } = await db
        .from('pots')
        .select(`
          *,
          profiles!inner(
            id, user_id, first_name, last_name, avatar_url
          )
        `)
        .eq('id', potId)
        .single();

      if (error || !data) {
        return res.status(404).json({
          error: 'Pot not found',
          message: 'This birthday pot does not exist or has been removed'
        });
      }

      pot = data;
      // Cache for 10 minutes
      await cache.setex(cacheKey, 600, JSON.stringify(pot));
    }

    // Privacy check - only owner can see private pots
    if (!pot.is_public && (!userId || userId !== pot.user_id)) {
      // Log security event (someone trying to access private pot)
      securityMonitor.logSecurityEvent({
        type: 'private_pot_access_attempt',
        userId: userId || 'anonymous',
        potId: potId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(404).json({
        error: 'Pot not found',
        message: 'This birthday pot does not exist or is private'
      });
    }

    // Log legitimate access
    if (userId && userId !== pot.user_id) {
      securityMonitor.logSecurityEvent({
        type: 'pot_viewed',
        userId: userId,
        potId: potId,
        potOwnerId: pot.user_id
      });
    }

    // Calculate additional metrics
    const daysUntilBirthday = Math.ceil(
      (new Date(pot.birthday_date) - new Date()) / (1000 * 60 * 60 * 24)
    );
    
    const progressPercentage = (pot.current_amount / pot.target_amount) * 100;

    // Check if user is the owner
    const isOwner = userId === pot.user_id;

    const response = {
      id: pot.id,
      title: pot.title,
      description: pot.description,
      target_amount: pot.target_amount,
      current_amount: pot.current_amount,
      birthday_date: pot.birthday_date,
      image_url: pot.image_url,
      is_public: pot.is_public,
      status: pot.status,
      created_at: pot.created_at,
      updated_at: pot.updated_at,
      days_until_birthday: Math.max(0, daysUntilBirthday),
      progress_percentage: Math.round(progressPercentage * 100) / 100,
      share_url: `${process.env.FRONTEND_URL}/pot/${pot.id}`,
      owner: {
        id: pot.profiles.id,
        user_id: pot.profiles.user_id,
        first_name: pot.profiles.first_name,
        last_name: pot.profiles.last_name,
        avatar_url: pot.profiles.avatar_url
      },
      is_owner: isOwner,
      can_donate: !isOwner && pot.status === 'active' && daysUntilBirthday > 0
    };

    res.json(response);

  } catch (error) {
    logger.error('Error fetching pot:', error);
    res.status(500).json({
      error: 'Failed to fetch pot',
      message: 'Please try again in a moment'
    });
  }
});

// =====================================================
// UPDATE POT (owner only)
// =====================================================

router.put('/:potId', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { db, cache, securityMonitor } = req.app.locals;
    const { potId } = req.params;
    const userId = req.user.id;

    // Get current pot
    const { data: currentPot, error: fetchError } = await db
      .from('pots')
      .select('*')
      .eq('id', potId)
      .eq('user_id', userId) // Only owner can update
      .single();

    if (fetchError || !currentPot) {
      return res.status(404).json({
        error: 'Pot not found',
        message: 'This pot does not exist or you do not have permission to edit it'
      });
    }

    // Log security event
    securityMonitor.logSecurityEvent({
      type: 'pot_update_attempt',
      userId: userId,
      potId: potId,
      ip: req.ip
    });

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    // Update allowed fields
    const { title, description, is_public } = req.body;
    
    if (title !== undefined) {
      updateData.title = title.trim();
    }
    
    if (description !== undefined) {
      updateData.description = description.trim();
    }
    
    if (is_public !== undefined) {
      updateData.is_public = Boolean(is_public);
    }

    // Process new image if uploaded
    if (req.file) {
      try {
        const optimizedImage = await sharp(req.file.buffer)
          .resize(800, 800, { 
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ 
            quality: 85,
            progressive: true 
          })
          .toBuffer();

        updateData.image_url = `data:image/jpeg;base64,${optimizedImage.toString('base64')}`;
        
      } catch (imageError) {
        logger.warn('Image processing failed during update:', imageError);
        // Continue without updating image
      }
    }

    // Update in database
    const { data: updatedPot, error } = await db
      .from('pots')
      .update(updateData)
      .eq('id', potId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Database error updating pot:', error);
      return res.status(500).json({
        error: 'Failed to update pot',
        message: 'Please try again in a moment'
      });
    }

    // Invalidate cache
    await cache.del(`pot:${potId}`);
    await cache.del(`user:${userId}:pots:*`); // Clear user's pot list cache

    logger.info(`✏️ Pot updated: ${potId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Pot updated successfully! ✨',
      pot: updatedPot
    });

  } catch (error) {
    logger.error('Error updating pot:', error);
    res.status(500).json({
      error: 'Failed to update pot',
      message: 'Please try again in a moment'
    });
  }
});

// =====================================================
// DELETE POT (owner only, with restrictions)
// =====================================================

router.delete('/:potId', authMiddleware, async (req, res) => {
  try {
    const { db, cache, securityMonitor } = req.app.locals;
    const { potId } = req.params;
    const userId = req.user.id;

    // Get current pot with donation count
    const { data: potWithDonations, error: fetchError } = await db
      .from('pots')
      .select(`
        *,
        donations(count)
      `)
      .eq('id', potId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !potWithDonations) {
      return res.status(404).json({
        error: 'Pot not found',
        message: 'This pot does not exist or you do not have permission to delete it'
      });
    }

    // Log security event
    securityMonitor.logSecurityEvent({
      type: 'pot_deletion_attempt',
      userId: userId,
      potId: potId,
      ip: req.ip,
      hasDonations: potWithDonations.donations?.length > 0
    });

    // Prevent deletion if pot has received donations
    if (potWithDonations.donations && potWithDonations.donations.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete pot with donations',
        message: 'This pot has received donations and cannot be deleted. You can deactivate it instead.',
        suggestion: 'Use PUT /pots/:id with status: "inactive"'
      });
    }

    // Soft delete (change status instead of hard delete)
    const { error: deleteError } = await db
      .from('pots')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', potId)
      .eq('user_id', userId);

    if (deleteError) {
      logger.error('Database error deleting pot:', deleteError);
      return res.status(500).json({
        error: 'Failed to delete pot',
        message: 'Please try again in a moment'
      });
    }

    // Clear caches
    await cache.del(`pot:${potId}`);
    await cache.del(`user:${userId}:pots:*`);

    logger.info(`🗑️ Pot deleted: ${potId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Pot deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting pot:', error);
    res.status(500).json({
      error: 'Failed to delete pot',
      message: 'Please try again in a moment'
    });
  }
});

// =====================================================
// GET POT DONATIONS (owner and donors can see)
// =====================================================

router.get('/:potId/donations', optionalAuth, async (req, res) => {
  try {
    const { db, cache } = req.app.locals;
    const { potId } = req.params;
    const userId = req.user?.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50); // Max 50 per page
    const offset = (page - 1) * limit;

    // Check if pot exists and user has permission to see donations
    const { data: pot, error: potError } = await db
      .from('pots')
      .select('id, user_id, is_public')
      .eq('id', potId)
      .single();

    if (potError || !pot) {
      return res.status(404).json({
        error: 'Pot not found',
        message: 'This pot does not exist'
      });
    }

    // Privacy check
    const isOwner = userId === pot.user_id;
    if (!pot.is_public && !isOwner) {
      return res.status(404).json({
        error: 'Pot not found',
        message: 'This pot is private'
      });
    }

    // Try cache first
    const cacheKey = `pot:${potId}:donations:${page}:${limit}`;
    const cachedDonations = await cache.get(cacheKey);
    
    if (cachedDonations) {
      return res.json(JSON.parse(cachedDonations));
    }

    // Fetch donations
    const { data: donations, error, count } = await db
      .from('donations')
      .select(`
        id, amount, message, created_at, is_anonymous,
        profiles!inner(first_name, last_name, avatar_url)
      `, { count: 'exact' })
      .eq('pot_id', potId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Database error fetching donations:', error);
      return res.status(500).json({
        error: 'Failed to fetch donations',
        message: 'Please try again in a moment'
      });
    }

    // Format donations (respect anonymity)
    const formattedDonations = donations.map(donation => ({
      id: donation.id,
      amount: donation.amount,
      message: donation.message,
      created_at: donation.created_at,
      donor: donation.is_anonymous ? {
        name: 'Anonymous',
        avatar_url: null
      } : {
        name: `${donation.profiles.first_name} ${donation.profiles.last_name}`,
        avatar_url: donation.profiles.avatar_url
      }
    }));

    const result = {
      donations: formattedDonations,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
        has_more: offset + limit < count
      }
    };

    // Cache for 2 minutes
    await cache.setex(cacheKey, 120, JSON.stringify(result));

    res.json(result);

  } catch (error) {
    logger.error('Error fetching pot donations:', error);
    res.status(500).json({
      error: 'Failed to fetch donations',
      message: 'Please try again in a moment'
    });
  }
});

module.exports = router;