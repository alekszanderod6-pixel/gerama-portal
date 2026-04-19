# Supabase Setup Guide for GERAMA Portal

## 1. Authentication Settings

### Go to your Supabase project: https://hdrnnvvrtbwjsxtrxzfj.supabase.co

### Configure Authentication:
1. Go to **Authentication** > **Settings**
2. **Site URL**: Set to your deployment URL (e.g., http://localhost:3000 for development)
3. **Redirect URLs**: Add your URLs:
   - http://localhost:3000
   - http://localhost:8000
   - Your production URL when deployed

### Email Settings:
1. Go to **Authentication** > **Email Templates**
2. **Confirm signup**: Customize if needed
3. **Enable email confirmations**: Turn ON

### User Management:
1. Go to **Authentication** > **Users**
2. Users will appear here after signup

## 2. Database Setup (Optional - for storing user profiles)

### Create profiles table:
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  program TEXT,
  invite_code_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING ( auth.uid() = id );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING ( auth.uid() = id );
```

## 3. Environment Variables

Your current configuration:
- Project URL: https://hdrnnvvrtbwjsxtrxzfj.supabase.co
- Publishable Key: sb_publishable_EabJTURfeOC_5XOdGA0gfA_o_Tsh1lb

## 4. Testing Steps

1. **Test Connection**: Open browser console and check if Supabase loads
2. **Test Signup**: Try creating an account with GERAMA2026
3. **Check Email**: Verify email confirmation works
4. **Test Login**: Login with verified credentials

## 5. Common Issues

- **CORS errors**: Add your domain to allowed URLs
- **Email not sending**: Configure SMTP settings in Supabase
- **Auth errors**: Check if email confirmation is enabled
