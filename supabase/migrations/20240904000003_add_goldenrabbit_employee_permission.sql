-- Add goldenrabbit_employee permission type to admin_permissions table

-- 1. Update the CHECK constraint to include goldenrabbit_employee
ALTER TABLE admin_permissions 
DROP CONSTRAINT admin_permissions_permission_type_check;

ALTER TABLE admin_permissions 
ADD CONSTRAINT admin_permissions_permission_type_check 
CHECK (permission_type IN ('master', 'community_admin', 'jobs_admin', 'users_admin', 'goldenrabbit_employee'));

-- 2. Update is_admin function to handle goldenrabbit_employee permission
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID, permission_type_param TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has master permission (master has all permissions)
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
    
    -- Check if user has any admin permission (including goldenrabbit_employee)
    RETURN EXISTS (
        SELECT 1 FROM admin_permissions 
        WHERE user_id = user_uuid 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create function specifically for goldenrabbit employee check
CREATE OR REPLACE FUNCTION is_goldenrabbit_employee(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Master admin also has goldenrabbit employee access
    IF EXISTS (
        SELECT 1 FROM admin_permissions 
        WHERE user_id = user_uuid 
        AND permission_type = 'master' 
        AND is_active = true
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user has goldenrabbit_employee permission
    RETURN EXISTS (
        SELECT 1 FROM admin_permissions 
        WHERE user_id = user_uuid 
        AND permission_type = 'goldenrabbit_employee' 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;