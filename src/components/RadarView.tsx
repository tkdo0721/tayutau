"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Post, GeoLocation } from "@/lib/types";
import CommentSection from "./CommentSection";

interface Props {
  location: GeoLocation;
  refreshKey: number;
}

const MAX_RADIUS = 500; // meters
const RINGS = [100, 200, 300, 400, 500];

// 2点間の方位角 (degrees, 0=北, 時計回り)
function bearing(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// 距離に応じた表示文字数
function visibleText(text: string, distanceM: number): string {
  const ratio = Math.max(0, 1 - distanceM / MAX_RADIUS);
  const len = Math.max(4, Math.round(text.length * ratio));
  if (len >= text.length) return text;
  return text.slice(0, len) + "…";
}

// 距離に応じたぼかし (px)
function blurAmount(distanceM: number): number {
  if (distanceM <= 30) return 0;
  return Math.min(4, (distanceM / MAX_RADIUS) * 4);
}

// 距離に応じた不透明度
function opacity(distanceM: number): number {
  return Math.max(0.3, 1 - distanceM / (MAX_RADIUS * 1.2));
}

export default function RadarView({ location, refreshKey }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/posts?lat=${location.lat}&lng=${location.lng}`
      );
      if (res.ok) {
        setPosts(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, refreshKey]);

  // 各投稿の位置を計算
  const positionedPosts = useMemo(() => {
    return posts.map((post) => {
      const dist = post.distance_m ?? 0;
      const angle = bearing(location.lat, location.lng, post.lat, post.lng);
      // 距離を 0-45% の範囲にマッピング（中心から端まで）
      const radiusPercent = (dist / MAX_RADIUS) * 45;
      // 角度をラジアンに（CSSは上が0度）
      const angleRad = ((angle - 90) * Math.PI) / 180;
      const x = 50 + radiusPercent * Math.cos(angleRad);
      const y = 50 + radiusPercent * Math.sin(angleRad);
      return { ...post, dist, angle, x, y };
    });
  }, [posts, location]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "たった今";
    if (mins < 60) return `${mins}分前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}時間前`;
    return `${Math.floor(hours / 24)}日前`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* レーダー表示 */}
      <div className="relative mx-auto aspect-square w-full max-w-md">
        {/* 同心円 */}
        {RINGS.map((r) => {
          const size = (r / MAX_RADIUS) * 90;
          return (
            <div
              key={r}
              className="absolute rounded-full border border-gray-200"
              style={{
                width: `${size}%`,
                height: `${size}%`,
                left: `${50 - size / 2}%`,
                top: `${50 - size / 2}%`,
              }}
            >
              <span
                className="absolute text-gray-300 select-none"
                style={{
                  fontSize: "10px",
                  top: "-6px",
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                {r}m
              </span>
            </div>
          );
        })}

        {/* 中心点（自分） */}
        <div
          className="absolute z-20 h-3 w-3 rounded-full bg-indigo-500 shadow-md shadow-indigo-200"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* 投稿ドット */}
        {positionedPosts.map((post) => {
          const isSelected = selectedPost === post.id;
          const b = blurAmount(post.dist);
          const o = opacity(post.dist);

          return (
            <button
              key={post.id}
              onClick={() =>
                setSelectedPost(isSelected ? null : post.id)
              }
              className={`absolute z-10 transition-all duration-300 ${
                isSelected
                  ? "z-30"
                  : ""
              }`}
              style={{
                left: `${post.x}%`,
                top: `${post.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className={`rounded-full transition-all duration-300 ${
                  isSelected
                    ? "h-4 w-4 bg-indigo-500 ring-4 ring-indigo-100"
                    : "h-2.5 w-2.5 bg-gray-500 hover:bg-indigo-400"
                }`}
                style={{ opacity: o }}
              />
            </button>
          );
        })}
      </div>

      {/* 選択中の投稿の詳細 */}
      {selectedPost && (() => {
        const post = positionedPosts.find((p) => p.id === selectedPost);
        if (!post) return null;
        const dist = post.dist;
        const b = blurAmount(dist);
        const o = opacity(dist);
        const text = visibleText(post.text, dist);
        const isTruncated = text !== post.text;

        return (
          <div
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all"
            style={{ opacity: o }}
          >
            <p
              className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed"
              style={{ filter: `blur(${b}px)` }}
            >
              {text}
            </p>
            {isTruncated && (
              <p className="mt-2 text-xs text-gray-300">
                ― 近づくと続きが見えます
              </p>
            )}
            <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
              <span>{timeAgo(post.created_at)}</span>
              <span>
                {dist < 50
                  ? "すぐそば"
                  : dist < 100
                  ? "すぐ近く"
                  : `${Math.round(dist)}m先`}
              </span>
            </div>
            <CommentSection
              postId={post.id}
              postLat={post.lat}
              postLng={post.lng}
              location={location}
            />
            <button
              onClick={() => setSelectedPost(null)}
              className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition"
            >
              閉じる
            </button>
          </div>
        );
      })()}

      {posts.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-gray-400 text-sm">
            半径500m以内にまだ投稿がありません
          </p>
          <p className="text-gray-400 text-xs mt-1">最初の投稿をしてみましょう</p>
        </div>
      )}
    </div>
  );
}
