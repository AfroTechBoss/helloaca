-- MANUAL FIX FOR USER CREATION CONFLICTS
-- Run this script in your Supabase SQL Editor to fix the "Database error saving new user" issue
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

-- Step 1: Update the user subscription creation function
CREATE OR REPLACE FUNCTION create_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure public.users record exists first
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      CONCAT(
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        ' ',
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
      )
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
  
  -- Then create subscription record
  INSERT INTO user_subscriptions (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_user_subscription() TO service_role;
GRANT EXECUTE ON FUNCTION create_user_subscription() TO authenticated;

-- Step 3: Verify the fix by checking existing triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- This should show both triggers:
-- 1. on_auth_user_created (calls create_user_subscription)
-- 2. on_auth_user_created_public (calls create_public_user)