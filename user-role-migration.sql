-- 사용자 역할 시스템 통합 마이그레이션 스크립트
-- 기존의 membership_tier와 admin_permissions를 user_role로 통합

-- 1단계: profiles 테이블에 user_role 컬럼 추가
ALTER TABLE profiles 
ADD COLUMN user_role text CHECK (user_role IN ('user', 'premium', 'employee', 'master')) DEFAULT 'user';

-- 2단계: 기존 데이터 마이그레이션
-- 우선순위: master > employee > premium > user

-- Master 관리자 설정 (admin_permissions에 master가 있는 사용자)
UPDATE profiles 
SET user_role = 'master'
WHERE id IN (
    SELECT user_id 
    FROM admin_permissions 
    WHERE permission_type = 'master' AND is_active = true
);

-- 골든래빗 임직원 설정 (master가 아닌 사용자 중 goldenrabbit_employee가 있는 사용자)
UPDATE profiles 
SET user_role = 'employee'
WHERE user_role = 'user' 
AND id IN (
    SELECT user_id 
    FROM admin_permissions 
    WHERE permission_type = 'goldenrabbit_employee' AND is_active = true
);

-- 프리미엄 사용자 설정 (membership_tier가 premium이고 아직 user인 사용자)
UPDATE profiles 
SET user_role = 'premium'
WHERE user_role = 'user' 
AND membership_tier = 'premium';

-- 3단계: user_role에 NOT NULL 제약조건 추가
ALTER TABLE profiles 
ALTER COLUMN user_role SET NOT NULL;

-- 4단계: 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON profiles(user_role);

-- 5단계: 역할 변경을 위한 RPC 함수 생성
CREATE OR REPLACE FUNCTION update_user_role(
    user_uuid UUID,
    new_role TEXT,
    reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    old_role TEXT;
BEGIN
    -- 현재 역할 조회
    SELECT user_role INTO old_role 
    FROM profiles 
    WHERE id = user_uuid;

    -- 역할이 실제로 변경되는 경우에만 처리
    IF old_role != new_role THEN
        -- profiles 테이블의 user_role 업데이트
        UPDATE profiles 
        SET user_role = new_role, 
            updated_at = NOW()
        WHERE id = user_uuid;

        -- membership_history 테이블에 기록 (기존 시스템과의 호환성)
        INSERT INTO membership_history (user_id, from_tier, to_tier, reason, created_at)
        VALUES (
            user_uuid, 
            CASE old_role 
                WHEN 'premium' THEN 'premium'::membership_tier
                ELSE 'free'::membership_tier
            END,
            CASE new_role 
                WHEN 'premium' THEN 'premium'::membership_tier
                ELSE 'free'::membership_tier
            END,
            COALESCE(reason, '역할 변경: ' || old_role || ' → ' || new_role),
            NOW()
        );
    END IF;
END;
$$;

-- 6단계: 역할별 권한 확인을 위한 함수
CREATE OR REPLACE FUNCTION user_has_permission(
    user_uuid UUID,
    required_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_current_role TEXT;
    role_hierarchy INTEGER;
    required_hierarchy INTEGER;
BEGIN
    -- 사용자의 현재 역할 조회
    SELECT user_role INTO user_current_role 
    FROM profiles 
    WHERE id = user_uuid;

    -- 역할별 계층 정의 (숫자가 높을수록 높은 권한)
    role_hierarchy := CASE user_current_role
        WHEN 'master' THEN 4
        WHEN 'employee' THEN 3
        WHEN 'premium' THEN 2
        WHEN 'user' THEN 1
        ELSE 0
    END;

    required_hierarchy := CASE required_role
        WHEN 'master' THEN 4
        WHEN 'employee' THEN 3
        WHEN 'premium' THEN 2
        WHEN 'user' THEN 1
        ELSE 0
    END;

    -- 현재 역할이 요구 역할보다 같거나 높으면 권한 허용
    RETURN role_hierarchy >= required_hierarchy;
END;
$$;

-- 7단계: 데이터 검증 쿼리 (마이그레이션 후 실행하여 확인)
-- SELECT 
--     user_role,
--     COUNT(*) as count,
--     ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM profiles), 2) as percentage
-- FROM profiles 
-- GROUP BY user_role
-- ORDER BY 
--     CASE user_role 
--         WHEN 'master' THEN 1
--         WHEN 'employee' THEN 2
--         WHEN 'premium' THEN 3
--         WHEN 'user' THEN 4
--     END;