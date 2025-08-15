-- Create function to atomically increment trial usage
CREATE OR REPLACE FUNCTION increment_trial_usage(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE user_subscriptions 
  SET trial_analyses_used = trial_analyses_used + 1,
      updated_at = NOW()
  WHERE user_subscriptions.user_id = increment_trial_usage.user_id
  RETURNING trial_analyses_used INTO new_count;
  
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_trial_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_trial_usage(UUID) TO service_role;