// =====================================================
// DONATION PROCESSING ROUTES
// Lightning-fast donations with Wave integration
// Invisible security + Maximum ease of use
// =====================================================

const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../../../shared/auth/jwt-auth');
const { logger } = require('../../../shared/utils/logger');
const WaveAPIService = require('../services/wave-api-service');

const router = express.Router();

// =====================================================
// CREATE DONATION - Ultra smooth 1-click experience
// =====================================================

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { db, cache, securityMonitor, waveConfig } = req.app.locals;
    const userId = req.user.id;
    const userAge = req.user.age;

    // Extract donation details
    const { 
      pot_id, 
      amount, 
      message = '', 
      is_anonymous = false,
      payment_method = 'wave_mobile' // Default to mobile money
    } = req.body;

    // Input validation
    if (!pot_id || !amount) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Pot ID and amount are required',
        required: ['pot_id', 'amount']
      });
    }

    // Amount validation
    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount <= 0 || donationAmount > 1000000) {
      return res.status(400).json({
        error: 'Invalid donation amount',
        message: 'Amount must be between 1 and 1,000,000 CFA',
        limits: { min: 1, max: 1000000 }
      });
    }

    // Log security event (invisible background check)
    securityMonitor.logSecurityEvent({
      type: 'donation_attempt',
      userId: userId,
      potId: pot_id,
      amount: donationAmount,
      userAge: userAge,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      deviceId: req.headers['x-device-id']
    });

    // Get pot details and validate
    const { data: pot, error: potError } = await db
      .from('pots')
      .select(`
        *,
        profiles!inner(first_name, last_name, avatar_url)
      `)
      .eq('id', pot_id)
      .eq('status', 'active')
      .single();

    if (potError || !pot) {
      return res.status(404).json({
        error: 'Pot not found',
        message: 'This birthday pot does not exist or is no longer active'
      });
    }

    // Check if pot is public or user has access
    if (!pot.is_public && pot.user_id !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You cannot donate to this private pot'
      });
    }

    // Prevent self-donation
    if (pot.user_id === userId) {
      return res.status(400).json({
        error: 'Cannot donate to your own pot',
        message: 'You cannot make a donation to your own birthday pot'
      });
    }

    // Check if birthday has passed
    const birthdayDate = new Date(pot.birthday_date);
    const now = new Date();
    
    if (birthdayDate < now) {
      return res.status(400).json({
        error: 'Birthday has passed',
        message: 'You cannot donate to a pot after the birthday date'
      });
    }

    // Get user profile for donation record
    const { data: userProfile, error: profileError } = await db
      .from('profiles')
      .select('first_name, last_name, avatar_url')
      .eq('user_id', userId)
      .single();

    if (profileError || !userProfile) {
      return res.status(400).json({
        error: 'Profile not found',
        message: 'Please complete your profile before making donations'
      });
    }

    // Initialize Wave API service
    const waveAPI = new WaveAPIService(waveConfig);

    // Create donation record with PENDING status
    const donationId = uuidv4();
    const donationData = {
      id: donationId,
      pot_id: pot_id,
      donor_user_id: userId,
      amount: donationAmount,
      message: message.trim().substring(0, 500), // Limit message length
      is_anonymous: Boolean(is_anonymous),
      payment_method: payment_method,
      status: 'pending',
      wave_transaction_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: donation, error: donationError } = await db
      .from('donations')
      .insert([donationData])
      .select()
      .single();

    if (donationError) {
      logger.error('Database error creating donation:', donationError);
      return res.status(500).json({
        error: 'Failed to create donation',
        message: 'Please try again in a moment'
      });
    }

    // Create Wave payment intent
    let paymentIntent;
    try {
      paymentIntent = await waveAPI.createPaymentIntent({
        amount: donationAmount,
        currency: 'XOF', // West African CFA Franc
        description: `Donation to ${pot.title}`,
        metadata: {
          donation_id: donationId,
          pot_id: pot_id,
          donor_user_id: userId,
          pot_owner: pot.profiles.first_name + ' ' + pot.profiles.last_name,
          pot_title: pot.title
        },
        success_url: `${process.env.FRONTEND_URL}/donation/success?donation_id=${donationId}`,
        cancel_url: `${process.env.FRONTEND_URL}/pot/${pot_id}?donation_cancelled=true`
      });

    } catch (waveError) {
      logger.error('Wave API error:', waveError);
      
      // Update donation status to failed
      await db
        .from('donations')
        .update({ 
          status: 'failed', 
          error_message: 'Payment processor error',
          updated_at: new Date().toISOString()
        })
        .eq('id', donationId);

      return res.status(500).json({
        error: 'Payment processing error',
        message: 'Unable to process payment at this time. Please try again.',
        support: 'Contact support if this persists'
      });
    }

    // Update donation with Wave transaction details
    await db
      .from('donations')
      .update({ 
        wave_transaction_id: paymentIntent.id,
        wave_payment_url: paymentIntent.payment_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', donationId);

    // Cache donation details for quick access
    await cache.setex(`donation:${donationId}`, 3600, JSON.stringify(donation));

    // Log successful payment intent creation
    securityMonitor.logSecurityEvent({
      type: 'payment_intent_created',
      userId: userId,
      donationId: donationId,
      potId: pot_id,
      amount: donationAmount,
      waveTransactionId: paymentIntent.id
    });

    logger.info(`💰 Donation created: ${donationId} for ${donationAmount} CFA to pot ${pot_id}`);

    // Return success response with payment details
    res.status(201).json({
      success: true,
      message: 'Ready to complete your donation! 💝',
      donation: {
        id: donationId,
        pot_id: pot_id,
        amount: donationAmount,
        message: donation.message,
        is_anonymous: donation.is_anonymous,
        status: 'pending',
        created_at: donation.created_at
      },
      payment: {
        id: paymentIntent.id,
        payment_url: paymentIntent.payment_url,
        amount: donationAmount,
        currency: 'XOF',
        description: `Donation to ${pot.title}`,
        expires_at: paymentIntent.expires_at
      },
      pot: {
        id: pot.id,
        title: pot.title,
        owner_name: `${pot.profiles.first_name} ${pot.profiles.last_name}`,
        birthday_date: pot.birthday_date,
        target_amount: pot.target_amount,
        current_amount: pot.current_amount
      },
      next_step: 'Complete payment using the payment_url'
    });

  } catch (error) {
    logger.error('Error creating donation:', error);
    res.status(500).json({
      error: 'Donation failed',
      message: 'Please try again in a moment'
    });
  }
});

// =====================================================
// GET USER'S DONATIONS
// =====================================================

router.get('/my-donations', authMiddleware, async (req, res) => {
  try {
    const { db, cache } = req.app.locals;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = (page - 1) * limit;

    // Try cache first
    const cacheKey = `user:${userId}:donations:${page}:${limit}`;
    const cachedDonations = await cache.get(cacheKey);
    
    if (cachedDonations) {
      return res.json(JSON.parse(cachedDonations));
    }

    // Fetch donations with pot details
    const { data: donations, error, count } = await db
      .from('donations')
      .select(`
        *,
        pots!inner(
          id, title, birthday_date, target_amount, current_amount, image_url,
          profiles!inner(first_name, last_name, avatar_url)
        )
      `, { count: 'exact' })
      .eq('donor_user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Database error fetching user donations:', error);
      return res.status(500).json({
        error: 'Failed to fetch donations',
        message: 'Please try again in a moment'
      });
    }

    // Format donations for response
    const formattedDonations = donations.map(donation => {
      const daysUntilBirthday = Math.ceil(
        (new Date(donation.pots.birthday_date) - new Date()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: donation.id,
        amount: donation.amount,
        message: donation.message,
        is_anonymous: donation.is_anonymous,
        status: donation.status,
        payment_method: donation.payment_method,
        created_at: donation.created_at,
        pot: {
          id: donation.pots.id,
          title: donation.pots.title,
          birthday_date: donation.pots.birthday_date,
          target_amount: donation.pots.target_amount,
          current_amount: donation.pots.current_amount,
          image_url: donation.pots.image_url,
          days_until_birthday: Math.max(0, daysUntilBirthday),
          owner_name: `${donation.pots.profiles.first_name} ${donation.pots.profiles.last_name}`,
          share_url: `${process.env.FRONTEND_URL}/pot/${donation.pots.id}`
        }
      };
    });

    // Calculate donation stats
    const totalDonated = donations
      .filter(d => d.status === 'completed')
      .reduce((sum, d) => sum + d.amount, 0);

    const result = {
      donations: formattedDonations,
      stats: {
        total_donations: donations.filter(d => d.status === 'completed').length,
        total_amount: totalDonated,
        pending_donations: donations.filter(d => d.status === 'pending').length
      },
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
    logger.error('Error fetching user donations:', error);
    res.status(500).json({
      error: 'Failed to fetch donations',
      message: 'Please try again in a moment'
    });
  }
});

// =====================================================
// GET SPECIFIC DONATION STATUS
// =====================================================

router.get('/:donationId', authMiddleware, async (req, res) => {
  try {
    const { db, cache } = req.app.locals;
    const { donationId } = req.params;
    const userId = req.user.id;

    // Try cache first
    const cacheKey = `donation:${donationId}`;
    const cachedDonation = await cache.get(cacheKey);
    
    let donation;
    if (cachedDonation) {
      donation = JSON.parse(cachedDonation);
    } else {
      // Fetch from database
      const { data, error } = await db
        .from('donations')
        .select(`
          *,
          pots!inner(
            id, title, birthday_date, target_amount, current_amount,
            profiles!inner(first_name, last_name)
          )
        `)
        .eq('id', donationId)
        .single();

      if (error || !data) {
        return res.status(404).json({
          error: 'Donation not found',
          message: 'This donation does not exist'
        });
      }

      donation = data;
      // Cache for 10 minutes
      await cache.setex(cacheKey, 600, JSON.stringify(donation));
    }

    // Check if user has permission to view this donation
    const isPotOwner = donation.pots.user_id === userId;
    const isDonor = donation.donor_user_id === userId;
    
    if (!isDonor && !isPotOwner) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this donation'
      });
    }

    // Format response
    const response = {
      id: donation.id,
      pot_id: donation.pot_id,
      amount: donation.amount,
      message: donation.message,
      is_anonymous: donation.is_anonymous,
      status: donation.status,
      payment_method: donation.payment_method,
      wave_transaction_id: donation.wave_transaction_id,
      created_at: donation.created_at,
      updated_at: donation.updated_at,
      pot: {
        id: donation.pots.id,
        title: donation.pots.title,
        birthday_date: donation.pots.birthday_date,
        target_amount: donation.pots.target_amount,
        current_amount: donation.pots.current_amount,
        owner_name: `${donation.pots.profiles.first_name} ${donation.pots.profiles.last_name}`
      },
      is_donor: isDonor,
      is_pot_owner: isPotOwner
    };

    // Add payment URL if still pending and user is the donor
    if (donation.status === 'pending' && isDonor && donation.wave_payment_url) {
      response.payment_url = donation.wave_payment_url;
      response.can_complete = true;
    }

    res.json(response);

  } catch (error) {
    logger.error('Error fetching donation:', error);
    res.status(500).json({
      error: 'Failed to fetch donation',
      message: 'Please try again in a moment'
    });
  }
});

// =====================================================
// CANCEL PENDING DONATION
// =====================================================

router.delete('/:donationId', authMiddleware, async (req, res) => {
  try {
    const { db, cache, securityMonitor, waveConfig } = req.app.locals;
    const { donationId } = req.params;
    const userId = req.user.id;

    // Get donation details
    const { data: donation, error: fetchError } = await db
      .from('donations')
      .select('*')
      .eq('id', donationId)
      .eq('donor_user_id', userId) // Only donor can cancel
      .single();

    if (fetchError || !donation) {
      return res.status(404).json({
        error: 'Donation not found',
        message: 'This donation does not exist or you do not have permission to cancel it'
      });
    }

    // Only allow cancellation of pending donations
    if (donation.status !== 'pending') {
      return res.status(400).json({
        error: 'Cannot cancel donation',
        message: `Donation is already ${donation.status} and cannot be cancelled`
      });
    }

    // Log security event
    securityMonitor.logSecurityEvent({
      type: 'donation_cancellation',
      userId: userId,
      donationId: donationId,
      amount: donation.amount,
      ip: req.ip
    });

    // Cancel Wave payment intent if exists
    if (donation.wave_transaction_id) {
      try {
        const waveAPI = new WaveAPIService(waveConfig);
        await waveAPI.cancelPaymentIntent(donation.wave_transaction_id);
        logger.info(`Cancelled Wave payment intent: ${donation.wave_transaction_id}`);
      } catch (waveError) {
        logger.warn('Failed to cancel Wave payment intent:', waveError);
        // Continue with database cancellation even if Wave cancellation fails
      }
    }

    // Update donation status to cancelled
    const { error: updateError } = await db
      .from('donations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', donationId);

    if (updateError) {
      logger.error('Database error cancelling donation:', updateError);
      return res.status(500).json({
        error: 'Failed to cancel donation',
        message: 'Please try again in a moment'
      });
    }

    // Clear cache
    await cache.del(`donation:${donationId}`);

    logger.info(`💔 Donation cancelled: ${donationId}`);

    res.json({
      success: true,
      message: 'Donation cancelled successfully',
      donation_id: donationId,
      status: 'cancelled'
    });

  } catch (error) {
    logger.error('Error cancelling donation:', error);
    res.status(500).json({
      error: 'Failed to cancel donation',
      message: 'Please try again in a moment'
    });
  }
});

// =====================================================
// WAVE WEBHOOK HANDLER - Payment completion
// =====================================================

router.post('/webhooks/wave', async (req, res) => {
  try {
    const { db, cache, securityMonitor } = req.app.locals;
    const signature = req.headers['x-wave-signature'];
    const payload = req.rawBody || JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.WAVE_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    if (signature !== `sha256=${expectedSignature}`) {
      logger.warn('Invalid Wave webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const { type, data } = event;

    logger.info(`📨 Wave webhook received: ${type}`);

    // Handle payment completion
    if (type === 'payment_intent.succeeded') {
      const paymentIntent = data.object;
      const donationId = paymentIntent.metadata?.donation_id;

      if (!donationId) {
        logger.warn('Payment succeeded but no donation_id in metadata');
        return res.status(400).json({ error: 'Missing donation_id' });
      }

      // Get donation record
      const { data: donation, error: donationError } = await db
        .from('donations')
        .select(`
          *,
          pots!inner(id, user_id, title, current_amount, target_amount)
        `)
        .eq('id', donationId)
        .single();

      if (donationError || !donation) {
        logger.error(`Donation not found for payment: ${donationId}`);
        return res.status(404).json({ error: 'Donation not found' });
      }

      // Prevent duplicate processing
      if (donation.status === 'completed') {
        logger.info(`Donation ${donationId} already completed`);
        return res.json({ received: true });
      }

      // Update donation status and pot amount in a transaction
      const { error: transactionError } = await db.rpc('process_successful_donation', {
        p_donation_id: donationId,
        p_pot_id: donation.pot_id,
        p_amount: donation.amount
      });

      if (transactionError) {
        logger.error('Error processing successful donation:', transactionError);
        return res.status(500).json({ error: 'Processing failed' });
      }

      // Clear relevant caches
      await Promise.all([
        cache.del(`donation:${donationId}`),
        cache.del(`pot:${donation.pot_id}`),
        cache.del(`user:${donation.donor_user_id}:donations:*`),
        cache.del(`pot:${donation.pot_id}:donations:*`)
      ]);

      // Log security event
      securityMonitor.logSecurityEvent({
        type: 'donation_completed',
        userId: donation.donor_user_id,
        donationId: donationId,
        potId: donation.pot_id,
        amount: donation.amount,
        waveTransactionId: paymentIntent.id
      });

      logger.info(`✅ Donation completed: ${donationId} for ${donation.amount} CFA`);

      // TODO: Send notification to pot owner (will be handled by notification service)
      // TODO: Update user points (will be handled by analytics service)

      return res.json({ received: true });
    }

    // Handle payment failures
    if (type === 'payment_intent.payment_failed') {
      const paymentIntent = data.object;
      const donationId = paymentIntent.metadata?.donation_id;

      if (donationId) {
        await db
          .from('donations')
          .update({
            status: 'failed',
            error_message: 'Payment failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', donationId);

        await cache.del(`donation:${donationId}`);
        logger.info(`💔 Donation failed: ${donationId}`);
      }

      return res.json({ received: true });
    }

    // Log unhandled webhook types
    logger.info(`Unhandled Wave webhook type: ${type}`);
    res.json({ received: true });

  } catch (error) {
    logger.error('Error processing Wave webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;