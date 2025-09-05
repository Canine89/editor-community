-- 기존 테이블과 관련 데이터 모두 삭제
-- Supabase SQL Editor에서 실행하세요

-- 1. 트리거 먼저 삭제
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_boards_updated_at ON boards;
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
DROP TRIGGER IF EXISTS update_job_postings_updated_at ON job_postings;
DROP TRIGGER IF EXISTS update_utility_tasks_updated_at ON utility_tasks;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. RLS 정책 삭제
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

DROP POLICY IF EXISTS "Anyone can view boards" ON boards;

DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

DROP POLICY IF EXISTS "Anyone can view job postings" ON job_postings;
DROP POLICY IF EXISTS "Users can insert own job postings" ON job_postings;
DROP POLICY IF EXISTS "Users can update own job postings" ON job_postings;
DROP POLICY IF EXISTS "Users can delete own job postings" ON job_postings;

DROP POLICY IF EXISTS "Users can view own utility tasks" ON utility_tasks;
DROP POLICY IF EXISTS "Users can insert own utility tasks" ON utility_tasks;
DROP POLICY IF EXISTS "Users can update own utility tasks" ON utility_tasks;

-- 3. 함수 삭제
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 4. 테이블 삭제 (외래키 관계 때문에 순서 중요)
DROP TABLE IF EXISTS utility_tasks;
DROP TABLE IF EXISTS job_postings;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS boards;
DROP TABLE IF EXISTS profiles;

-- 완료 메시지
SELECT '모든 기존 테이블과 관련 데이터가 삭제되었습니다.' as status;
