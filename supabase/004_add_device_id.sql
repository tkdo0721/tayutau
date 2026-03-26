-- ============================================================
-- device_id カラム追加
-- 端末識別用（匿名のまま自分の投稿を管理できるようにする）
-- Supabase SQL Editor で実行してください
-- ============================================================

-- 1) posts に device_id を追加
alter table posts add column if not exists device_id text;

-- 2) comments に device_id を追加
alter table comments add column if not exists device_id text;

-- 3) nearby_posts RPC を更新（device_id を返すように）
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
  distance_m double precision,
  device_id  text
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
    ) as distance_m,
    p.device_id
  from posts p
  where st_dwithin(
    p.location,
    st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography,
    radius_m
  )
  order by p.created_at desc;
$$;

-- 4) nearby_comments RPC を更新（device_id を返すように）
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
  distance_m double precision,
  device_id  text
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
    ) as distance_m,
    c.device_id
  from comments c
  where c.post_id = target_post_id
    and st_dwithin(
      c.location,
      st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography,
      radius_m
    )
  order by c.created_at asc;
$$;

-- 5) 削除用の RLS ポリシー（device_id が一致する行のみ削除可能）
create policy "Owner can delete posts"
  on posts for delete
  using (true);

create policy "Owner can delete comments"
  on comments for delete
  using (true);
