# 🆓 **WOLO - Complete FREE Deployment Guide**

This guide will help you deploy your WOLO birthday pot app **completely FREE** using Supabase + Vercel.

## 🚀 **Step 1: Create FREE Supabase Account**

### **1.1 Sign Up**
1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with **GitHub** (easiest)
4. Verify your email

### **1.2 Create Project**
1. Click **"New Project"**
2. **Organization**: Choose your personal org
3. **Name**: `wolo-app`
4. **Database Password**: Create a strong password (save it!)
5. **Region**: Choose **West Europe** (closest to Senegal)
6. Click **"Create new project"**

### **1.3 Get API Keys**
1. Go to **Settings** > **API**
2. Copy these values:
   - **Project URL**: `https://xxx.supabase.co`
   - **Project API Keys** > **anon/public**: `eyJhbG...`
   - **Project API Keys** > **service_role**: `eyJhbG...` ⚠️ **KEEP SECRET!**

## 📊 **Step 2: Create Database Tables**

### **2.1 Run Database Schema**
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the content from `database/supabase-schema.sql`
3. Paste it and click **"Run"**
4. Wait for all tables to be created ✅

### **2.2 Enable Row Level Security**
Your tables now have banking-grade security automatically! 🛡️

## ▶️ **Step 3: Deploy to Vercel**

### **3.1 Prepare for Deployment**
1. Make sure all your Vercel function files are in the `api/` folder
2. Your current structure:
   ```
   WoloApp/
   ├── api/
   │   ├── users/
   │   │   └── auth.js
   │   └── pots/
   │       └── manage.js
   ├── database/
   │   └── supabase-schema.sql
   └── FREE-DEPLOYMENT-GUIDE.md
   ```

### **3.2 Deploy to Vercel**
1. Go to **https://vercel.com**
2. Sign in with **GitHub**
3. Click **"Import Project"**
4. Select your **WoloApp** repository
5. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave default)
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty

### **3.3 Add Environment Variables**
In Vercel deployment settings, add these environment variables:

```bash
# Required - Get from Supabase Dashboard
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbG...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your-service-key

# Required - Create a random secret
JWT_SECRET=your-super-long-random-jwt-secret-here

# Auto-filled by Vercel
VERCEL_URL=$VERCEL_URL
FRONTEND_URL=https://your-app.vercel.app
```

### **3.4 Deploy!**
Click **"Deploy"** and wait 2-3 minutes ⏱️

## ✅ **Step 4: Test Your API**

Once deployed, test your endpoints:

```bash
# Test health
GET https://your-app.vercel.app/api/users/auth

# Register user
POST https://your-app.vercel.app/api/users/auth?action=register
{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "Test",
  "lastName": "User",
  "dateOfBirth": "1990-01-01",
  "telephone": "+221123456789"
}

# Login
POST https://your-app.vercel.app/api/users/auth?action=login
{
  "email": "test@example.com",
  "password": "password123"
}
```

## 🔄 **Step 5: Add More Services** 

Continue with payment processing and other functions...

## 💡 **What You Get FREE**

### **Supabase FREE Tier:**
- ✅ **500MB Database Storage**
- ✅ **2GB Bandwidth**  
- ✅ **50,000 Monthly Active Users**
- ✅ **Unlimited API Requests**
- ✅ **Real-time subscriptions**
- ✅ **Authentication**
- ✅ **Row Level Security**

### **Vercel FREE Tier:**
- ✅ **100GB Bandwidth**
- ✅ **1000 Serverless Function Invocations per day**
- ✅ **Custom domains**
- ✅ **Automatic HTTPS**
- ✅ **Global CDN**

## 🚨 **Important Notes**

1. **Never expose Service Role Key** in frontend - only use in API functions
2. **Use Anon Key** for frontend Supabase client
3. **Row Level Security** automatically protects your data
4. **Environment variables** are automatically encrypted by Vercel

## 🆘 **Need Help?**

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Discord**: https://discord.supabase.com/

## 🎯 **Next Steps**

Once your basic API is working:
1. ✅ Add payment processing with Wave
2. ✅ Add notifications with SendGrid (free tier)
3. ✅ Add analytics tracking
4. ✅ Build your frontend interface

**Total Cost: $0/month** until you scale big! 🎉