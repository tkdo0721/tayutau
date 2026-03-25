-- ============================================================
-- Tayutau: Supabase初期セットアップ
-- Supabase SQL Editor で実行してください
-- ============================================================

-- 1) PostGIS 拡張を有効化
create extension if not exists postgis;

-- 2) posts テーブル
create table if not exists posts (
  id         uuid primary key default gen_random_uuid(),
  text       text not null,
  lat        double precision not null,
  lng        double precision not null,
  location   geography(Point, 4326) generated always as (
               st_setsrid(st_makepoint(lng, lat), 4326)::geography
             ) stored,
  created_at timestamptz not null default now()
);

-- 3) comments テーブル
create table if not exists comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts(id) on delete cascade,
  text       text not null,
  lat        double precision not null,
  lng        double precision not null,
  location   geography(Point, 4326) generated always as (
               st_setsrid(st_makepoint(lng, lat), 4326)::geography
             ) stored,
  created_at timestamptz not null default now()
);

-- 4) 空間インデックス
create index if not exists idx_posts_location    on posts    using gist(location);
create index if not exists idx_comments_location on comments using gist(location);

-- 5) RPC: 半径内の投稿を取得 (距離: メートル)
create or replace function nearby_posts(
  user_lat double precision,
  user_lng double precision,
  radius_m double precision default 500
)
returns table (
  id         uuid,
  text       text,
  lat        double precision,
  lng        double precision,
  created_at timestamptz,
  distance_m double precision
)
language sql stable
as $$
  select
    p.id,
    p.text,
    p.lat,
    p.lng,
    p.created_at,
    st_distance(
      p.location,
      st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography
    ) as distance_m
  from posts p
  where st_dwithin(
    p.location,
    st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography,
    radius_m
  )
  order by p.created_at desc;
$$;

-- 6) RPC: 特定投稿の半径内コメントを取得
create or replace function nearby_comments(
  target_post_id uuid,
  user_lat double precision,
  user_lng double precision,
  radius_m double precision default 500
)
returns table (
  id         uuid,
  post_id    uuid,
  text       text,
  lat        double precision,
  lng        double precision,
  created_at timestamptz,
  distance_m double precision
)
language sql stable
as $$
  select
    c.id,
    c.post_id,
    c.text,
    c.lat,
    c.lng,
    c.created_at,
    st_distance(
      c.location,
      st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography
    ) as distance_m
  from comments c
  where c.post_id = target_post_id
    and st_dwithin(
      c.location,
      st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography,
      radius_m
    )
  order by c.created_at asc;
$$;

-- 7) Row Level Security (匿名アクセス許可)
alter table posts    enable row level security;
alter table comments enable row level security;

create policy "Anyone can read posts"    on posts    for select using (true);
create policy "Anyone can insert posts"  on posts    for insert with check (true);

create policy "Anyone can read comments"   on comments for select using (true);
create policy "Anyone can insert comments" on comments for insert with check (true);
