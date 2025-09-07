-- 편집자 커뮤니티 데이터베이스 스키마
-- Supabase SQL 에디터에서 이 스크립트를 실행하세요
--
-- 실행 후 확인 방법:
-- 1. Supabase 대시보드 → Table Editor
-- 2. 다음 테이블들이 생성되었는지 확인:
--    - profiles
--    - posts
--    - comments
--    - jobs
--    - advertisements
--    - ad_settings

-- 프로필 테이블
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  bio text,
  expertise text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 게시글 테이블
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  author_id uuid references profiles(id) on delete cascade not null,
  category text not null,
  is_anonymous boolean default false,
  view_count integer default 0 not null,
  like_count integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 댓글 테이블
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  author_id uuid references profiles(id) on delete cascade not null,
  post_id uuid references posts(id) on delete cascade not null,
  is_anonymous boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 구인구직 테이블
create table if not exists jobs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  company text not null,
  location text not null,
  type text check (type in ('full-time', 'part-time', 'freelance', 'contract')) not null,
  salary_range text,
  requirements text[],
  poster_id uuid references profiles(id) on delete cascade not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) 정책 설정
alter table profiles enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table jobs enable row level security;

-- 프로필 정책
create policy "Public profiles are viewable by everyone" on profiles
  for select using (true);

create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- 게시글 정책
create policy "Posts are viewable by everyone" on posts
  for select using (true);

create policy "Authenticated users can insert posts" on posts
  for insert with check (auth.uid() = author_id);

create policy "Users can update own posts" on posts
  for update using (auth.uid() = author_id);

create policy "Users can delete own posts" on posts
  for delete using (auth.uid() = author_id);

-- 구인구직 정책
create policy "Jobs are viewable by everyone" on jobs
  for select using (true);

create policy "Authenticated users can insert jobs" on jobs
  for insert with check (auth.uid() = poster_id);

create policy "Users can update own jobs" on jobs
  for update using (auth.uid() = poster_id);

create policy "Users can delete own jobs" on jobs
  for delete using (auth.uid() = poster_id);

-- 댓글 정책
create policy "Comments are viewable by everyone" on comments
  for select using (true);

create policy "Authenticated users can insert comments" on comments
  for insert with check (auth.uid() = author_id);

create policy "Users can update own comments" on comments
  for update using (auth.uid() = author_id);

create policy "Users can delete own comments" on comments
  for delete using (auth.uid() = author_id);

-- 좋아요 테이블
create table if not exists likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  post_id uuid references posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

-- 좋아요 정책
alter table likes enable row level security;

create policy "Likes are viewable by everyone" on likes
  for select using (true);

create policy "Authenticated users can insert likes" on likes
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own likes" on likes
  for delete using (auth.uid() = user_id);

-- 조회수 업데이트를 위한 함수
create or replace function increment_post_views(post_uuid uuid)
returns void as $$
begin
  update posts set view_count = view_count + 1 where id = post_uuid;
end;
$$ language plpgsql security definer;

-- 좋아요 수 업데이트를 위한 함수
create or replace function update_post_like_count(post_uuid uuid)
returns void as $$
begin
  update posts 
  set like_count = (
    select count(*) 
    from likes 
    where post_id = post_uuid
  )
  where id = post_uuid;
end;
$$ language plpgsql security definer;

-- 광고 테이블
create table if not exists advertisements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  type text not null check (type in ('carousel', 'banner')),
  image_url text not null,
  link_url text not null,
  display_order integer not null default 1,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  is_active boolean default true,
  click_count integer default 0 not null,
  view_count integer default 0 not null,
  advertiser_name text not null,
  advertiser_email text,
  advertiser_phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 광고 설정 테이블
create table if not exists ad_settings (
  id uuid default gen_random_uuid() primary key,
  show_top_carousel boolean default true,
  show_bottom_banner boolean default true,
  carousel_auto_play boolean default true,
  carousel_interval integer default 5000,
  banner_position text default 'static' check (banner_position in ('fixed', 'static')),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 광고 테이블 RLS 설정
alter table advertisements enable row level security;
alter table ad_settings enable row level security;

-- 광고 정책 (모든 사용자가 볼 수 있지만 관리자만 수정 가능)
create policy "Advertisements are viewable by everyone" on advertisements
  for select using (true);

create policy "Only authenticated users can manage advertisements" on advertisements
  for all using (auth.uid() is not null);

-- 광고 설정 정책 (모든 사용자가 볼 수 있지만 관리자만 수정 가능)
create policy "Ad settings are viewable by everyone" on ad_settings
  for select using (true);

create policy "Only authenticated users can manage ad settings" on ad_settings
  for all using (auth.uid() is not null);

-- 광고 클릭/조회수 업데이트 함수
create or replace function increment_ad_clicks(ad_uuid uuid)
returns void as $$
begin
  update advertisements set click_count = click_count + 1 where id = ad_uuid;
end;
$$ language plpgsql security definer;

create or replace function increment_ad_views(ad_uuid uuid)
returns void as $$
begin
  update advertisements set view_count = view_count + 1 where id = ad_uuid;
end;
$$ language plpgsql security definer;

-- 기본 광고 설정 데이터 삽입
insert into ad_settings (show_top_carousel, show_bottom_banner, carousel_auto_play, carousel_interval, banner_position)
values (true, true, true, 5000, 'static')
on conflict do nothing;

