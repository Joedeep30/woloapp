// =====================================================
// WOLO POT MANAGEMENT - VERCEL FUNCTION
// Replaces Pot Management Microservice
// Same functionality, serverless deployment
// =====================================================

import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase (same database!)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action } = req.query;
    
    switch (action) {
      case 'create':
        return await handleCreatePot(req, res);
      case 'list':
        return await handleListPots(req, res);
      case 'get':
        return await handleGetPot(req, res);
      case 'update':
        return await handleUpdatePot(req, res);
      case 'delete':
        return await handleDeletePot(req, res);
      case 'my-pots':
        return await handleMyPots(req, res);
      default:
        return res.status(400).json({
          error: 'Invalid action',
          availableActions: ['create', 'list', 'get', 'update', 'delete', 'my-pots']
        });
    }
  } catch (error) {
    console.error('Pot management error:', error);
    return res.status(500).json({
      error: 'Pot management service error',
      message: 'Please try again'
    });
  }
}

// Authenticate user
async function authenticateUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded;
}

// Create pot handler
async function handleCreatePot(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await authenticateUser(req);
    const { title, description, target_amount, birthday_date, is_public = true, image_url } = req.body;

    // Validation
    if (!title || !target_amount || !birthday_date) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title, target amount, and birthday date are required'
      });
    }

    const amount = parseFloat(target_amount);
    if (isNaN(amount) || amount <= 0 || amount > 10000000) {
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

    // Create pot
    const potId = uuidv4();
    const { data: pot, error } = await supabase
      .from('pots')
      .insert([{
        id: potId,
        user_id: user.userId,
        title: title.trim(),
        description: description?.trim() || '',
        target_amount: amount,
        current_amount: 0,
        birthday_date: birthdayDate.toISOString(),
        image_url: image_url,
        is_public: Boolean(is_public),
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error creating pot:', error);
      return res.status(500).json({
        error: 'Failed to create pot',
        message: 'Please try again in a moment'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Your birthday pot is ready! 🎂',
      pot: {
        ...pot,
        share_url: `${process.env.VERCEL_URL || 'https://your-app.vercel.app'}/pot/${pot.id}`
      }
    });

  } catch (error) {
    if (error.message === 'No token provided') {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login to create a pot'
      });
    }
    
    console.error('Create pot error:', error);
    return res.status(500).json({
      error: 'Failed to create pot',
      message: 'Please try again'
    });
  }
}

// Get user's pots
async function handleMyPots(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await authenticateUser(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data: pots, error, count } = await supabase
      .from('pots')
      .select('*', { count: 'exact' })
      .eq('user_id', user.userId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error fetching user pots:', error);
      return res.status(500).json({
        error: 'Failed to fetch pots',
        message: 'Please try again'
      });
    }

    // Calculate metrics
    const potsWithMetrics = pots.map(pot => {
      const daysUntilBirthday = Math.ceil(
        (new Date(pot.birthday_date) - new Date()) / (1000 * 60 * 60 * 24)
      );
      
      const progressPercentage = (pot.current_amount / pot.target_amount) * 100;
      
      return {
        ...pot,
        days_until_birthday: Math.max(0, daysUntilBirthday),
        progress_percentage: Math.round(progressPercentage * 100) / 100,
        share_url: `${process.env.VERCEL_URL || 'https://your-app.vercel.app'}/pot/${pot.id}`
      };
    });

    return res.json({
      pots: potsWithMetrics,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
        has_more: offset + limit < count
      }
    });

  } catch (error) {
    if (error.message === 'No token provided') {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login to view your pots'
      });
    }

    console.error('Error fetching user pots:', error);
    return res.status(500).json({
      error: 'Failed to fetch pots',
      message: 'Please try again'
    });
  }
}

// Get specific pot
async function handleGetPot(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { potId } = req.query;
    
    if (!potId) {
      return res.status(400).json({
        error: 'Missing pot ID',
        message: 'Pot ID is required'
      });
    }

    // Try to authenticate user (optional)
    let userId = null;
    try {
      const user = await authenticateUser(req);
      userId = user.userId;
    } catch (error) {
      // User not authenticated, that's ok for public pots
    }

    // Fetch pot with profile info
    const { data: pot, error } = await supabase
      .from('pots')
      .select(`
        *,
        profiles!inner(
          id, user_id, first_name, last_name, avatar_url
        )
      `)
      .eq('id', potId)
      .neq('status', 'deleted')
      .single();

    if (error || !pot) {
      return res.status(404).json({
        error: 'Pot not found',
        message: 'This birthday pot does not exist or has been removed'
      });
    }

    // Privacy check
    if (!pot.is_public && (!userId || userId !== pot.user_id)) {
      return res.status(404).json({
        error: 'Pot not found',
        message: 'This birthday pot does not exist or is private'
      });
    }

    // Calculate metrics
    const daysUntilBirthday = Math.ceil(
      (new Date(pot.birthday_date) - new Date()) / (1000 * 60 * 60 * 24)
    );
    
    const progressPercentage = (pot.current_amount / pot.target_amount) * 100;
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
      days_until_birthday: Math.max(0, daysUntilBirthday),
      progress_percentage: Math.round(progressPercentage * 100) / 100,
      share_url: `${process.env.VERCEL_URL || 'https://your-app.vercel.app'}/pot/${pot.id}`,
      owner: {
        first_name: pot.profiles.first_name,
        last_name: pot.profiles.last_name,
        avatar_url: pot.profiles.avatar_url
      },
      is_owner: isOwner,
      can_donate: !isOwner && pot.status === 'active' && daysUntilBirthday > 0
    };

    return res.json(response);

  } catch (error) {
    console.error('Error fetching pot:', error);
    return res.status(500).json({
      error: 'Failed to fetch pot',
      message: 'Please try again'
    });
  }
}

// Update pot
async function handleUpdatePot(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await authenticateUser(req);
    const { potId } = req.query;
    const { title, description, is_public, image_url } = req.body;

    if (!potId) {
      return res.status(400).json({
        error: 'Missing pot ID',
        message: 'Pot ID is required'
      });
    }

    // Check ownership
    const { data: currentPot, error: fetchError } = await supabase
      .from('pots')
      .select('*')
      .eq('id', potId)
      .eq('user_id', user.userId)
      .single();

    if (fetchError || !currentPot) {
      return res.status(404).json({
        error: 'Pot not found',
        message: 'This pot does not exist or you do not have permission to edit it'
      });
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (is_public !== undefined) updateData.is_public = Boolean(is_public);
    if (image_url !== undefined) updateData.image_url = image_url;

    // Update pot
    const { data: updatedPot, error } = await supabase
      .from('pots')
      .update(updateData)
      .eq('id', potId)
      .eq('user_id', user.userId)
      .select()
      .single();

    if (error) {
      console.error('Database error updating pot:', error);
      return res.status(500).json({
        error: 'Failed to update pot',
        message: 'Please try again'
      });
    }

    return res.json({
      success: true,
      message: 'Pot updated successfully! ✨',
      pot: updatedPot
    });

  } catch (error) {
    if (error.message === 'No token provided') {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login to update pot'
      });
    }

    console.error('Error updating pot:', error);
    return res.status(500).json({
      error: 'Failed to update pot',
      message: 'Please try again'
    });
  }
}

// Delete pot
async function handleDeletePot(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await authenticateUser(req);
    const { potId } = req.query;

    if (!potId) {
      return res.status(400).json({
        error: 'Missing pot ID',
        message: 'Pot ID is required'
      });
    }

    // Check ownership and donations
    const { data: currentPot, error: fetchError } = await supabase
      .from('pots')
      .select('*')
      .eq('id', potId)
      .eq('user_id', user.userId)
      .single();

    if (fetchError || !currentPot) {
      return res.status(404).json({
        error: 'Pot not found',
        message: 'This pot does not exist or you do not have permission to delete it'
      });
    }

    // Prevent deletion if pot has donations
    if (currentPot.current_amount > 0) {
      return res.status(400).json({
        error: 'Cannot delete pot with donations',
        message: 'This pot has received donations and cannot be deleted'
      });
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('pots')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', potId)
      .eq('user_id', user.userId);

    if (deleteError) {
      console.error('Database error deleting pot:', deleteError);
      return res.status(500).json({
        error: 'Failed to delete pot',
        message: 'Please try again'
      });
    }

    return res.json({
      success: true,
      message: 'Pot deleted successfully'
    });

  } catch (error) {
    if (error.message === 'No token provided') {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login to delete pot'
      });
    }

    console.error('Error deleting pot:', error);
    return res.status(500).json({
      error: 'Failed to delete pot',
      message: 'Please try again'
    });
  }
}