# Admin System Migration - Manual Application Guide

Since the MCP Supabase connection is not available, you'll need to manually apply the admin system migration in your Supabase dashboard.

## Steps to Apply Migration:

1. **Go to your Supabase Project Dashboard**
   - Visit: https://supabase.com/dashboard/projects
   - Select your `editor-community` project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Execute the Migration SQL**
   - Copy the entire content from: `supabase/migrations/20240904000002_create_admin_system.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute

## What This Migration Does:

✅ **Creates Admin Tables:**
- `admin_permissions` - Manages user admin permissions
- `admin_activity_logs` - Logs all admin actions

✅ **Sets Up Master Admin:**
- Automatically grants master permissions to `hgpark@goldenrabbit.co.kr`

✅ **Creates Security Functions:**
- `is_admin()` function for permission checking
- `log_admin_activity()` function for activity logging

✅ **Creates Admin Views:**
- `admin_posts_view` - Enhanced posts view for admins
- `admin_jobs_view` - Enhanced jobs view for admins

✅ **Sets Up RLS Policies:**
- Proper security policies for admin tables
- Admin access policies for posts, jobs, and comments

## After Migration:

1. **Verify Tables Created:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name LIKE 'admin%';
   ```

2. **Check Master Admin Setup:**
   ```sql
   SELECT ap.*, p.email FROM admin_permissions ap
   JOIN profiles p ON ap.user_id = p.id
   WHERE p.email = 'hgpark@goldenrabbit.co.kr';
   ```

3. **Test Admin Access:**
   - Log in with `hgpark@goldenrabbit.co.kr`
   - Navigate to `/admin` - should now be accessible

## If You Encounter Errors:

- Make sure the `profiles` table exists
- Ensure the user `hgpark@goldenrabbit.co.kr` has a profile record
- Check that all referenced tables (`posts`, `jobs`, `comments`) exist

The migration is designed to be safe and will handle conflicts gracefully.