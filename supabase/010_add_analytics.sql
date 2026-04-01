-- ============================================================
-- PHASE A: アナリティクス機能
-- posts/comments に reach_count, view_count を追加
-- view_logs テーブル作成、RPC関数追加
-- Supabase SQL Editor で実行してください
-- ============================================================

-- 0) 既存の nearby_posts 関数をDROP（戻り値の型が変わるため）
DROP FUNCTION IF EXISTS nearby_posts(double precision, double precision, double precision);

-- 1) posts テーブルに閲覧数カラムを追加
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reach_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 2) comments テーブルにも追加
ALTER TABLE comments ADD COLUMN IF NOT EXISTS reach_count INTEGER DEFAULT 0;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 3) 閲覧ログテーブル（時間帯別分析用）
CREATE TABLE IF NOT EXISTS view_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  device_id TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  distance_type TEXT CHECK (distance_type IN ('reach', 'view')),
  is_revisit BOOLEAN DEFAULT FALSE
);

-- 4) インデックス
CREATE INDEX IF NOT EXISTS idx_view_logs_post_id ON view_logs(post_id);
CREATE INDEX IF NOT EXISTS idx_view_logs_viewed_at ON view_logs(viewed_at);
CREATE INDEX IF NOT EXISTS idx_view_logs_distance_type ON view_logs(distance_type);
CREATE INDEX IF NOT EXISTS idx_view_logs_device_id ON view_logs(device_id);

-- 5) RLS: view_logs は誰でも読み書き可能
ALTER TABLE view_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read view_logs" ON view_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert view_logs" ON view_logs FOR INSERT WITH CHECK (true);

-- 6) RPC: reach_count インクリメント
CREATE OR REPLACE FUNCTION increment_reach_count(target_post_id UUID)
RETURNS void AS $$
  UPDATE posts SET reach_count = reach_count + 1 WHERE id = target_post_id;
$$ LANGUAGE SQL;

-- 7) RPC: view_count インクリメント
CREATE OR REPLACE FUNCTION increment_view_count(target_post_id UUID)
RETURNS void AS $$
  UPDATE posts SET view_count = view_count + 1 WHERE id = target_post_id;
$$ LANGUAGE SQL;

-- 8) nearby_posts RPC を更新（reach_count, view_count を返すように）
CREATE OR REPLACE FUNCTION nearby_posts(
  user_lat double precision,
  user_lng double precision,
  radius_m double precision default 500
)
RETURNS TABLE (
  id         uuid,
  text       text,
  lat        double precision,
  lng        double precision,
  created_at timestamptz,
  distance_m double precision,
  device_id  text,
  reach_count integer,
  view_count  integer
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id,
    p.text,
    p.lat,
    p.lng,
    p.created_at,
    st_distance(
      p.location,
      st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography
    ) AS distance_m,
    p.device_id,
    p.reach_count,
    p.view_count
  FROM posts p
  WHERE st_dwithin(
    p.location,
    st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography,
    radius_m
  )
  ORDER BY p.created_at DESC;
$$;
