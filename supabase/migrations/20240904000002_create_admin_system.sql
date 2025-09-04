-- Create admin system tables and policies

-- 1. Admin permissions table
CREATE TABLE admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    permission_type TEXT NOT NULL CHECK (permission_type IN ('master', 'community_admin', 'jobs_admin', 'users_admin')),
    granted_by UUID REFERENCES profiles(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, permission_type)
);

-- 2. Admin activity logs table
CREATE TABLE admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES profiles(id),
    action TEXT NOT NULL,
    target_type TEXT, -- 'post', 'job', 'user', 'comment' 등
    target_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Insert master admin permission for hgpark@goldenrabbit.co.kr
INSERT INTO admin_permissions (user_id, permission_type, granted_by, granted_at, is_active)
SELECT 
    p.id,
    'master',
    p.id, -- self-granted for master
    NOW(),
    true
FROM profiles p
WHERE p.email = 'hgpark@goldenrabbit.co.kr'
ON CONFLICT (user_id, permission_type) DO UPDATE SET
    is_active = true,
    granted_at = NOW();

-- 4. Create function to check admin permissions
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID, permission_type_param TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has master permission
    IF EXISTS (
        SELECT 1 FROM admin_permissions 
        WHERE user_id = user_uuid 
        AND permission_type = 'master' 
        AND is_active = true
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- If specific permission type is requested, check for that
    IF permission_type_param IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM admin_permissions 
            WHERE user_id = user_uuid 
            AND permission_type = permission_type_param 
            AND is_active = true
        );
    END IF;
    
    -- Check if user has any admin permission
    RETURN EXISTS (
        SELECT 1 FROM admin_permissions 
        WHERE user_id = user_uuid 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create admin view for posts (including soft-deleted)
CREATE VIEW admin_posts_view AS
SELECT 
    p.*,
    prof.full_name as author_name,
    prof.email as author_email,
    prof.avatar_url as author_avatar,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
FROM posts p
LEFT JOIN profiles prof ON p.author_id = prof.id;

-- 6. Create admin view for jobs (including inactive)
CREATE VIEW admin_jobs_view AS
SELECT 
    j.*,
    prof.full_name as poster_name,
    prof.email as poster_email,
    prof.avatar_url as poster_avatar
FROM jobs j
LEFT JOIN profiles prof ON j.poster_id = prof.id;

-- 7. RLS Policies for admin tables

-- Admin permissions table
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;

-- Admins can read all permissions
CREATE POLICY "Admins can read all permissions" ON admin_permissions
    FOR SELECT USING (is_admin(auth.uid()));

-- Only master admins can modify permissions
CREATE POLICY "Only master admins can modify permissions" ON admin_permissions
    FOR ALL USING (is_admin(auth.uid(), 'master'));

-- Admin activity logs table  
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all activity logs
CREATE POLICY "Admins can read activity logs" ON admin_activity_logs
    FOR SELECT USING (is_admin(auth.uid()));

-- Admins can insert their own activity logs
CREATE POLICY "Admins can insert activity logs" ON admin_activity_logs
    FOR INSERT WITH CHECK (admin_id = auth.uid() AND is_admin(auth.uid()));

-- 8. Update posts policies for admin access
CREATE POLICY "Admins can manage all posts" ON posts
    FOR ALL USING (is_admin(auth.uid()));

-- 9. Update jobs policies for admin access  
CREATE POLICY "Admins can manage all jobs" ON jobs
    FOR ALL USING (is_admin(auth.uid()));

-- 10. Update comments policies for admin access
CREATE POLICY "Admins can manage all comments" ON comments
    FOR ALL USING (is_admin(auth.uid()));

-- 11. Grant permissions to admin views
GRANT SELECT ON admin_posts_view TO authenticated;
GRANT SELECT ON admin_jobs_view TO authenticated;

-- Create RLS policies for admin views
CREATE POLICY "Only admins can view admin_posts_view" ON admin_posts_view
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can view admin_jobs_view" ON admin_jobs_view  
    FOR SELECT USING (is_admin(auth.uid()));

-- 12. Create function to log admin activities
CREATE OR REPLACE FUNCTION log_admin_activity(
    action_param TEXT,
    target_type_param TEXT DEFAULT NULL,
    target_id_param UUID DEFAULT NULL,
    details_param JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO admin_activity_logs (
        admin_id,
        action,
        target_type,
        target_id,
        details
    ) VALUES (
        auth.uid(),
        action_param,
        target_type_param,
        target_id_param,
        details_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;