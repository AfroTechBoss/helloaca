# Google OAuth Setup Guide

To enable Google sign-in functionality, you need to configure Google OAuth in your Supabase project.

## Steps to Configure Google OAuth

### 1. Set up Google OAuth in Google Cloud Console

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Set the authorized redirect URI to: `https://your-project-ref.supabase.co/auth/v1/callback`
6. Note down your Client ID and Client Secret

### 2. Configure Google OAuth in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to Authentication > Providers
3. Find Google and click "Configure"
4. Enable Google provider
5. Enter your Google Client ID and Client Secret
6. Save the configuration

### 3. Update Site URL (if needed)

1. In Supabase Dashboard, go to Authentication > URL Configuration
2. Make sure your Site URL is set correctly (e.g., `http://localhost:3000` for development)
3. Add your production URL when deploying

### 4. Test the Integration

1. Start your development server: `npm run dev`
2. Go to the sign-in page
3. Click "Continue with Google"
4. Complete the OAuth flow
5. You should be redirected to the dashboard after successful authentication

## Important Notes

- The Google OAuth redirect is handled automatically by the `/auth/callback` page
- Users will be redirected to `/dashboard` after successful authentication
- Make sure your Google Cloud Console redirect URI matches your Supabase project URL
- For production, update the redirect URI to use your production domain

## Troubleshooting

- If you get "redirect_uri_mismatch" error, check that your Google Cloud Console redirect URI matches exactly
- If authentication fails, check the browser console for error messages
- Ensure your Supabase project has the Google provider properly configured and enabled