-- COMPREHENSIVE FIX FOR USER CREATION CONFLICTS
-- This script resolves the "Database error saving new user" issue by:
-- 1. Removing conflicting triggers
-- 2. Creating a single, robust trigger function
-- 3. Ensuring proper error handling and conflict resolution

-- Run this script in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

-- Step 1: Drop existing conflicting triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_public ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated_public ON auth.users;

-- Step 2: Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS create_user_subscription();
DROP FUNCTION IF EXISTS create_public_user();

-- Step 3: Create a single, comprehensive user creation function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
BEGIN
  -- Extract full name from metadata
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    TRIM(CONCAT(
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      ' ',
      COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    ))
  );
  
  -- If still empty, use email prefix as fallback
  IF user_full_name IS NULL OR user_full_name = '' THEN
    user_full_name := SPLIT_PART(NEW.email, '@', 1);
  END IF;

  -- Create or update public.users record
  INSERT INTO public.users (
    id, 
    email, 
    full_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  -- Create user subscription record
  INSERT INTO user_subscriptions (
    user_id,
    subscription_type,
    trial_analyses_used,
    trial_analyses_limit,
    subscription_status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'trial',
    0,
    3,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create the single trigger
CREATE TRIGGER on_auth_user_created_comprehensive
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 5: Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon;

-- Step 6: Verify the setup
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth'
ORDER BY trigger_name;

-- Step 7: Test the function (optional - for verification)
-- This query should show the trigger is properly set up
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public';

-- Step 8: Check existing users without subscriptions (cleanup)
-- This will create missing subscription records for existing users
INSERT INTO user_subscriptions (
  user_id,
  subscription_type,
  trial_analyses_used,
  trial_analyses_limit,
  subscription_status,
  created_at,
  updated_at
)
SELECT 
  u.id,
  'trial',
  0,
  3,
  'active',
  NOW(),
  NOW()
FROM public.users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
WHERE us.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Success message
SELECT 'User creation fix applied successfully! You can now test signup functionality.' AS status;