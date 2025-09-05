-- 회원 등급 시스템 추가 스크립트
-- Supabase SQL 에디터에서 실행하세요

-- 회원 등급 enum 타입 생성
do $$ begin
    create type membership_tier as enum ('free', 'premium');
exception
    when duplicate_object then null;
end $$;

-- profiles 테이블에 membership_tier 컬럼 추가
alter table profiles add column if not exists membership_tier membership_tier default 'free';

-- 회원 등급 변경 히스토리 테이블
create table if not exists membership_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  from_tier membership_tier,
  to_tier membership_tier not null,
  changed_by uuid references profiles(id), -- admin이 변경한 경우
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 회원 등급 히스토리 RLS 설정
alter table membership_history enable row level security;

-- 히스토리 조회 정책 (본인 또는 관리자만)
create policy "Users can view own membership history" on membership_history
  for select using (
    auth.uid() = user_id or 
    exists (
      select 1 from profiles 
      where id = auth.uid() and membership_tier = 'premium'
    )
  );

-- 히스토리 생성 정책 (관리자만)
create policy "Only admins can insert membership history" on membership_history
  for insert with check (
    exists (
      select 1 from profiles 
      where id = auth.uid() and membership_tier = 'premium'
    )
  );

-- 회원 등급 업데이트 함수
create or replace function update_membership_tier(
  user_uuid uuid,
  new_tier membership_tier,
  reason text default null
)
returns void as $$
declare
  current_tier membership_tier;
begin
  -- 현재 등급 조회
  select membership_tier into current_tier 
  from profiles 
  where id = user_uuid;
  
  -- 등급이 다를 경우에만 업데이트
  if current_tier != new_tier then
    -- 등급 업데이트
    update profiles 
    set 
      membership_tier = new_tier,
      updated_at = now()
    where id = user_uuid;
    
    -- 히스토리 기록
    insert into membership_history (user_id, from_tier, to_tier, changed_by, reason)
    values (user_uuid, current_tier, new_tier, auth.uid(), reason);
  end if;
end;
$$ language plpgsql security definer;

-- 회원 등급별 기능 접근 체크 함수
create or replace function check_premium_access()
returns boolean as $$
begin
  return exists (
    select 1 from profiles 
    where id = auth.uid() and membership_tier = 'premium'
  );
end;
$$ language plpgsql security definer;

-- 유료 기능 사용 로그 테이블
create table if not exists premium_usage_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  feature_name text not null,
  usage_details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 유료 사용 로그 RLS 설정
alter table premium_usage_logs enable row level security;

-- 사용 로그 조회 정책 (본인만)
create policy "Users can view own usage logs" on premium_usage_logs
  for select using (auth.uid() = user_id);

-- 사용 로그 생성 정책 (인증된 사용자)
create policy "Authenticated users can insert usage logs" on premium_usage_logs
  for insert with check (auth.uid() = user_id);