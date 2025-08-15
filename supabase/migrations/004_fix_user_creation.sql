-- Fix user creation by adding trigger to populate public.users from auth.users
-- This fixes the "Database error saving new user" issue

-- Create function to automatically create public.users record for new auth users
CREATE OR REPLACE FUNCTION create_public_user()
RETURNS TRIGGER AS $$
BEGIN
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create public.users record
CREATE TRIGGER on_auth_user_created_public
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_public_user();

-- Also create trigger for updates to sync data
CREATE TRIGGER on_auth_user_updated_public
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_public_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_public_user() TO service_role;
GRANT EXECUTE ON FUNCTION create_public_user() TO authenticated;

-- Ensure existing auth users have corresponding public.users records
INSERT INTO public.users (id, email, full_name)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name', 
    CONCAT(
      COALESCE(au.raw_user_meta_data->>'first_name', ''),
      ' ',
      COALESCE(au.raw_user_meta_data->>'last_name', '')
    )
  )
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;