// =====================================================
// POT DISCOVERY ROUTES
// Smart discovery, trending, and social sharing
// =====================================================

const express = require('express');
const { authMiddleware, optionalAuth } = require('../../../shared/auth/jwt-auth');
const { logger } = require('../../../shared/utils/logger');

const router = express.Router();

// =====================================================
// DISCOVER PUBLIC POTS - Instagram-like feed
// =====================================================

router.get('/feed', optionalAuth, async (req, res) => {
  try {
    const { db, cache } = req.app.locals;
    const userId = req.user?.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = (page - 1) * limit;

    // Cache key includes user ID for personalized feed
    const cacheKey = `discovery:feed:${userId || 'anonymous'}:${page}:${limit}`;
    const cachedFeed = await cache.get(cacheKey);
    
    if (cachedFeed) {
      return res.json(JSON.parse(cachedFeed));
    }

    // Base query for public, active pots
    let query = db
      .from('pots')
      .select(`
        *,
        profiles!inner(first_name, last_name, avatar_url)
      `)
      .eq('is_public', true)
      .eq('status', 'active')
      .gte('birthday_date', new Date().toISOString()) // Only future birthdays
      .order('created_at', { ascending: false });

    // Apply pagination
    const { data: pots, error, count } = await query
      .range(offset, offset + limit - 1)
      .limit(limit);

    if (error) {
      logger.error('Database error fetching discovery feed:', error);
      return res.status(500).json({
        error: 'Failed to load discovery feed',
        message: 'Please try again in a moment'
      });
    }

    // Enhance pots with metrics and user context
    const enhancedPots = pots.map(pot => {
      const daysUntilBirthday = Math.ceil(
        (new Date(pot.birthday_date) - new Date()) / (1000 * 60 * 60 * 24)
      );
      
      const progressPercentage = (pot.current_amount / pot.target_amount) * 100;
      const isOwner = userId === pot.user_id;

      return {
        id: pot.id,
        title: pot.title,
        description: pot.description,
        target_amount: pot.target_amount,
        current_amount: pot.current_amount,
        birthday_date: pot.birthday_date,
        image_url: pot.image_url,
        created_at: pot.created_at,
        days_until_birthday: Math.max(0, daysUntilBirthday),
        progress_percentage: Math.round(progressPercentage * 100) / 100,
        urgency: daysUntilBirthday <= 7 ? 'urgent' : daysUntilBirthday <= 30 ? 'soon' : 'later',
        share_url: `${process.env.FRONTEND_URL}/pot/${pot.id}`,
        owner: {
          first_name: pot.profiles.first_name,
          last_name: pot.profiles.last_name,
          avatar_url: pot.profiles.avatar_url
        },
        is_owner: isOwner,
        can_donate: !isOwner
      };
    });

    const result = {
      pots: enhancedPots,
      pagination: {
        page,
        limit,
        total: count || enhancedPots.length,
        has_more: enhancedPots.length === limit
      },
      feed_type: 'recent'
    };

    // Cache for 3 minutes (short cache for fresh content)
    await cache.setex(cacheKey, 180, JSON.stringify(result));

    res.json(result);

  } catch (error) {
    logger.error('Error fetching discovery feed:', error);
    res.status(500).json({
      error: 'Failed to load discovery feed',
      message: 'Please try again in a moment'
    });
  }
});

// =====================================================
// TRENDING POTS - Most popular and viral
// =====================================================

router.get('/trending', optionalAuth, async (req, res) => {
  try {
    const { db, cache } = req.app.locals;
    const userId = req.user?.id;
    const period = req.query.period || '7d'; // 24h, 7d, 30d
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    const cacheKey = `discovery:trending:${period}:${userId || 'anonymous'}:${limit}`;
    const cachedTrending = await cache.get(cacheKey);
    
    if (cachedTrending) {
      return res.json(JSON.parse(cachedTrending));
    }

    // Calculate trending score based on:
    // - Recent donations count and amount
    // - Progress percentage
    // - Days until birthday (urgency)
    // - Creation recency
    
    let dateFilter = new Date();
    switch (period) {
      case '24h':
        dateFilter.setDate(dateFilter.getDate() - 1);
        break;
      case '7d':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case '30d':
        dateFilter.setDate(dateFilter.getDate() - 30);
        break;
      default:
        dateFilter.setDate(dateFilter.getDate() - 7);
    }

    // Complex query to get trending pots with donation metrics
    const { data: pots, error } = await db
      .from('pots')
      .select(`
        *,
        profiles!inner(first_name, last_name, avatar_url)
      `)
      .eq('is_public', true)
      .eq('status', 'active')
      .gte('birthday_date', new Date().toISOString())
      .gte('created_at', dateFilter.toISOString())
      .order('current_amount', { ascending: false })
      .limit(limit * 2); // Get more to calculate trending score

    if (error) {
      logger.error('Database error fetching trending pots:', error);
      return res.status(500).json({
        error: 'Failed to load trending pots',
        message: 'Please try again in a moment'
      });
    }

    // Calculate trending scores
    const potsWithScores = pots.map(pot => {
      const daysUntilBirthday = Math.ceil(
        (new Date(pot.birthday_date) - new Date()) / (1000 * 60 * 60 * 24)
      );
      
      const progressPercentage = (pot.current_amount / pot.target_amount) * 100;
      const isOwner = userId === pot.user_id;
      
      // Trending score algorithm
      let trendingScore = 0;
      
      // Progress weight (0-40 points)
      trendingScore += Math.min(progressPercentage * 0.4, 40);
      
      // Amount weight (0-30 points)
      trendingScore += Math.min(pot.current_amount / 10000, 30); // Scale by 10k CFA
      
      // Urgency weight (0-20 points)
      if (daysUntilBirthday <= 7) trendingScore += 20;
      else if (daysUntilBirthday <= 30) trendingScore += 10;
      else if (daysUntilBirthday <= 90) trendingScore += 5;
      
      // Recency weight (0-10 points)
      const daysSinceCreation = (new Date() - new Date(pot.created_at)) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation <= 1) trendingScore += 10;
      else if (daysSinceCreation <= 7) trendingScore += 5;

      return {
        id: pot.id,
        title: pot.title,
        description: pot.description,
        target_amount: pot.target_amount,
        current_amount: pot.current_amount,
        birthday_date: pot.birthday_date,
        image_url: pot.image_url,
        created_at: pot.created_at,
        days_until_birthday: Math.max(0, daysUntilBirthday),
        progress_percentage: Math.round(progressPercentage * 100) / 100,
        trending_score: Math.round(trendingScore),
        urgency: daysUntilBirthday <= 7 ? 'urgent' : daysUntilBirthday <= 30 ? 'soon' : 'later',
        share_url: `${process.env.FRONTEND_URL}/pot/${pot.id}`,
        owner: {
          first_name: pot.profiles.first_name,
          last_name: pot.profiles.last_name,
          avatar_url: pot.profiles.avatar_url
        },
        is_owner: isOwner,
        can_donate: !isOwner
      };
    });

    // Sort by trending score and limit results
    const trendingPots = potsWithScores
      .sort((a, b) => b.trending_score - a.trending_score)
      .slice(0, limit);

    const result = {
      pots: trendingPots,
      period: period,
      feed_type: 'trending',
      algorithm: 'progress + amount + urgency + recency'
    };

    // Cache for 10 minutes
    await cache.setex(cacheKey, 600, JSON.stringify(result));

    res.json(result);

  } catch (error) {
    logger.error('Error fetching trending pots:', error);
    res.status(500).json({
      error: 'Failed to load trending pots',
      message: 'Please try again in a moment'
    });
  }
});

// =====================================================
// URGENT POTS - Birthdays coming soon
// =====================================================

router.get('/urgent', optionalAuth, async (req, res) => {
  try {
    const { db, cache } = req.app.locals;
    const userId = req.user?.id;
    const days = Math.min(parseInt(req.query.days) || 7, 30); // Max 30 days
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    const cacheKey = `discovery:urgent:${days}:${userId || 'anonymous'}:${limit}`;
    const cachedUrgent = await cache.get(cacheKey);
    
    if (cachedUrgent) {
      return res.json(JSON.parse(cachedUrgent));
    }

    // Calculate date range
    const now = new Date();
    const urgentDeadline = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));

    const { data: pots, error } = await db
      .from('pots')
      .select(`
        *,
        profiles!inner(first_name, last_name, avatar_url)
      `)
      .eq('is_public', true)
      .eq('status', 'active')
      .gte('birthday_date', now.toISOString())
      .lte('birthday_date', urgentDeadline.toISOString())
      .order('birthday_date', { ascending: true }) // Soonest first
      .limit(limit);

    if (error) {
      logger.error('Database error fetching urgent pots:', error);
      return res.status(500).json({
        error: 'Failed to load urgent pots',
        message: 'Please try again in a moment'
      });
    }

    // Enhance pots with urgency metrics
    const urgentPots = pots.map(pot => {
      const daysUntilBirthday = Math.ceil(
        (new Date(pot.birthday_date) - new Date()) / (1000 * 60 * 60 * 24)
      );
      
      const progressPercentage = (pot.current_amount / pot.target_amount) * 100;
      const isOwner = userId === pot.user_id;
      const amountNeeded = pot.target_amount - pot.current_amount;

      return {
        id: pot.id,
        title: pot.title,
        description: pot.description,
        target_amount: pot.target_amount,
        current_amount: pot.current_amount,
        amount_needed: amountNeeded,
        birthday_date: pot.birthday_date,
        image_url: pot.image_url,
        created_at: pot.created_at,
        days_until_birthday: Math.max(0, daysUntilBirthday),
        progress_percentage: Math.round(progressPercentage * 100) / 100,
        urgency_level: daysUntilBirthday <= 1 ? 'critical' : 
                      daysUntilBirthday <= 3 ? 'high' : 
                      daysUntilBirthday <= 7 ? 'medium' : 'low',
        share_url: `${process.env.FRONTEND_URL}/pot/${pot.id}`,
        owner: {
          first_name: pot.profiles.first_name,
          last_name: pot.profiles.last_name,
          avatar_url: pot.profiles.avatar_url
        },
        is_owner: isOwner,
        can_donate: !isOwner
      };
    });

    const result = {
      pots: urgentPots,
      filter: `${days} days`,
      total_urgent: urgentPots.length,
      feed_type: 'urgent'
    };

    // Cache for 5 minutes (frequent updates for urgency)
    await cache.setex(cacheKey, 300, JSON.stringify(result));

    res.json(result);

  } catch (error) {
    logger.error('Error fetching urgent pots:', error);
    res.status(500).json({
      error: 'Failed to load urgent pots',
      message: 'Please try again in a moment'
    });
  }
});

// =====================================================
// SEARCH POTS - Smart search with filters
// =====================================================

router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { db, cache } = req.app.locals;
    const userId = req.user?.id;
    const query = req.query.q?.trim();
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = (page - 1) * limit;

    // Filters
    const minAmount = parseFloat(req.query.min_amount) || 0;
    const maxAmount = parseFloat(req.query.max_amount) || 10000000;
    const daysRange = parseInt(req.query.days) || 365; // Max days until birthday

    if (!query || query.length < 2) {
      return res.status(400).json({
        error: 'Search query too short',
        message: 'Please enter at least 2 characters to search'
      });
    }

    const cacheKey = `discovery:search:${query}:${minAmount}:${maxAmount}:${daysRange}:${page}:${limit}`;
    const cachedResults = await cache.get(cacheKey);
    
    if (cachedResults) {
      return res.json(JSON.parse(cachedResults));
    }

    // Calculate date range for birthday filter
    const now = new Date();
    const maxBirthdayDate = new Date(now.getTime() + (daysRange * 24 * 60 * 60 * 1000));

    // Build search query
    let dbQuery = db
      .from('pots')
      .select(`
        *,
        profiles!inner(first_name, last_name, avatar_url)
      `)
      .eq('is_public', true)
      .eq('status', 'active')
      .gte('birthday_date', now.toISOString())
      .lte('birthday_date', maxBirthdayDate.toISOString())
      .gte('target_amount', minAmount)
      .lte('target_amount', maxAmount);

    // Add text search (search in title and description)
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);

    // Execute with pagination
    const { data: pots, error, count } = await dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Database error searching pots:', error);
      return res.status(500).json({
        error: 'Search failed',
        message: 'Please try again in a moment'
      });
    }

    // Enhance results
    const searchResults = pots.map(pot => {
      const daysUntilBirthday = Math.ceil(
        (new Date(pot.birthday_date) - new Date()) / (1000 * 60 * 60 * 24)
      );
      
      const progressPercentage = (pot.current_amount / pot.target_amount) * 100;
      const isOwner = userId === pot.user_id;

      // Calculate relevance score
      let relevanceScore = 0;
      if (pot.title.toLowerCase().includes(query.toLowerCase())) relevanceScore += 10;
      if (pot.description.toLowerCase().includes(query.toLowerCase())) relevanceScore += 5;
      
      return {
        id: pot.id,
        title: pot.title,
        description: pot.description,
        target_amount: pot.target_amount,
        current_amount: pot.current_amount,
        birthday_date: pot.birthday_date,
        image_url: pot.image_url,
        created_at: pot.created_at,
        days_until_birthday: Math.max(0, daysUntilBirthday),
        progress_percentage: Math.round(progressPercentage * 100) / 100,
        relevance_score: relevanceScore,
        urgency: daysUntilBirthday <= 7 ? 'urgent' : daysUntilBirthday <= 30 ? 'soon' : 'later',
        share_url: `${process.env.FRONTEND_URL}/pot/${pot.id}`,
        owner: {
          first_name: pot.profiles.first_name,
          last_name: pot.profiles.last_name,
          avatar_url: pot.profiles.avatar_url
        },
        is_owner: isOwner,
        can_donate: !isOwner
      };
    });

    // Sort by relevance score
    searchResults.sort((a, b) => b.relevance_score - a.relevance_score);

    const result = {
      query: query,
      results: searchResults,
      filters: {
        min_amount: minAmount,
        max_amount: maxAmount,
        days_range: daysRange
      },
      pagination: {
        page,
        limit,
        total: count || searchResults.length,
        has_more: searchResults.length === limit
      }
    };

    // Cache for 5 minutes
    await cache.setex(cacheKey, 300, JSON.stringify(result));

    res.json(result);

  } catch (error) {
    logger.error('Error searching pots:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'Please try again in a moment'
    });
  }
});

// =====================================================
// RANDOM POT - Discover something new
// =====================================================

router.get('/random', optionalAuth, async (req, res) => {
  try {
    const { db, cache } = req.app.locals;
    const userId = req.user?.id;
    const count = Math.min(parseInt(req.query.count) || 1, 10);

    // Random discovery doesn't use cache for freshness
    const { data: pots, error } = await db
      .from('pots')
      .select(`
        *,
        profiles!inner(first_name, last_name, avatar_url)
      `)
      .eq('is_public', true)
      .eq('status', 'active')
      .gte('birthday_date', new Date().toISOString())
      .limit(count * 10); // Get more to randomize

    if (error || !pots.length) {
      return res.status(404).json({
        error: 'No pots found',
        message: 'No public pots available for discovery'
      });
    }

    // Randomly select from results
    const shuffled = pots.sort(() => 0.5 - Math.random());
    const randomPots = shuffled.slice(0, count);

    // Enhance with metrics
    const enhancedPots = randomPots.map(pot => {
      const daysUntilBirthday = Math.ceil(
        (new Date(pot.birthday_date) - new Date()) / (1000 * 60 * 60 * 24)
      );
      
      const progressPercentage = (pot.current_amount / pot.target_amount) * 100;
      const isOwner = userId === pot.user_id;

      return {
        id: pot.id,
        title: pot.title,
        description: pot.description,
        target_amount: pot.target_amount,
        current_amount: pot.current_amount,
        birthday_date: pot.birthday_date,
        image_url: pot.image_url,
        created_at: pot.created_at,
        days_until_birthday: Math.max(0, daysUntilBirthday),
        progress_percentage: Math.round(progressPercentage * 100) / 100,
        urgency: daysUntilBirthday <= 7 ? 'urgent' : daysUntilBirthday <= 30 ? 'soon' : 'later',
        share_url: `${process.env.FRONTEND_URL}/pot/${pot.id}`,
        owner: {
          first_name: pot.profiles.first_name,
          last_name: pot.profiles.last_name,
          avatar_url: pot.profiles.avatar_url
        },
        is_owner: isOwner,
        can_donate: !isOwner
      };
    });

    res.json({
      pots: enhancedPots,
      randomized: true,
      feed_type: 'random'
    });

  } catch (error) {
    logger.error('Error fetching random pots:', error);
    res.status(500).json({
      error: 'Failed to load random pots',
      message: 'Please try again in a moment'
    });
  }
});

module.exports = router;