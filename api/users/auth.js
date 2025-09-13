// =====================================================
// WOLO USER AUTHENTICATION - VERCEL FUNCTION
// Replaces User Management Microservice
// Same functionality, serverless deployment
// =====================================================

import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Initialize Supabase (same database you're already using!)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Main handler function
export default async function handler(req, res) {
  // CORS headers for your frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action } = req.query;
    
    switch (action) {
      case 'login':
        return await handleLogin(req, res);
      case 'register': 
        return await handleRegister(req, res);
      case 'profile':
        return await handleProfile(req, res);
      case 'logout':
        return await handleLogout(req, res);
      default:
        return res.status(400).json({
          error: 'Invalid action',
          availableActions: ['login', 'register', 'profile', 'logout']
        });
    }
  } catch (error) {
    console.error('Auth function error:', error);
    return res.status(500).json({
      error: 'Authentication service error',
      message: 'Please try again'
    });
  }
}

// Login handler (same logic as your microservice)
async function handleLogin(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Missing credentials',
      message: 'Email and password are required'
    });
  }

  try {
    // Same Supabase database query as your microservice
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password incorrect'
      });
    }

    // Same password verification
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password incorrect'
      });
    }

    // Same JWT generation
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful! 🎉',
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Login failed',
      message: 'Please try again'
    });
  }
}

// Register handler
async function handleRegister(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, firstName, lastName, dateOfBirth, telephone } = req.body;

  try {
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user (same database structure)
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash: passwordHash,
        status: 'active',
        provider: 'email',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        error: 'Registration failed',
        message: error.message.includes('duplicate') ? 'Email already exists' : 'Please try again'
      });
    }

    // Create profile
    await supabase
      .from('profiles')
      .insert([{
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        telephone: telephone,
        created_at: new Date().toISOString()
      }]);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! 🎉',
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      error: 'Registration failed',
      message: 'Please try again'
    });
  }
}

// Profile handler
async function handleProfile(req, res) {
  // Extract JWT token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user profile (same query as microservice)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', decoded.userId)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'Please complete your profile'
      });
    }

    return res.json({
      success: true,
      profile: profile
    });

  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Please login again'
    });
  }
}

// Logout handler
async function handleLogout(req, res) {
  // In serverless, we just confirm logout
  return res.json({
    success: true,
    message: 'Logged out successfully'
  });
}