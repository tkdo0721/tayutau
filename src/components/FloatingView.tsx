"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Post, GeoLocation } from "@/lib/types";
import CommentSection from "./CommentSection";

interface Props {
  location: GeoLocation;
  refreshKey: number;
}

const MAX_RADIUS = 500;
const TAP_RADIUS = 50; // 50m以内だけタップ可能

// 方位角
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

// シード付き疑似乱数 (位置の安定化用)
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967296;
  };
}

// 距離に応じた表示テキスト
function visibleText(text: string, distanceM: number): string {
  const ratio = Math.max(0, 1 - distanceM / MAX_RADIUS);
  const len = Math.max(3, Math.round(text.length * ratio));
  if (len >= text.length) return text;
  return text.slice(0, len) + "…";
}

interface PositionedPost extends Post {
  dist: number;
  x: number;
  y: number;
  scale: number;
  blur: number;
  opacity: number;
  canTap: boolean;
  animDelay: number;
  animDuration: number;
  driftX: number;
  driftY: number;
}

export default function FloatingView({ location, refreshKey }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/posts?lat=${location.lat}&lng=${location.lng}`
      );
      if (res.ok) setPosts(await res.json());
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, refreshKey]);

  const positioned = useMemo(() => {
    return posts.map((post): PositionedPost => {
      const dist = post.distance_m ?? 0;
      const angle = bearing(location.lat, location.lng, post.lat, post.lng);
      const rng = seededRandom(post.id);

      // 距離に基づく位置 (中心からの距離%)
      const radiusPct = (dist / MAX_RADIUS) * 42;
      const angleRad = ((angle - 90) * Math.PI) / 180;

      // ランダムなオフセットを加える（重なり回避）
      const offsetX = (rng() - 0.5) * 10;
      const offsetY = (rng() - 0.5) * 10;
      const x = Math.min(88, Math.max(12, 50 + radiusPct * Math.cos(angleRad) + offsetX));
      const y = Math.min(88, Math.max(12, 50 + radiusPct * Math.sin(angleRad) + offsetY));

      // 距離による見た目
      const distRatio = dist / MAX_RADIUS;
      const scale = Math.max(0.5, 1 - distRatio * 0.6);
      const blur = dist <= 30 ? 0 : Math.min(3.5, distRatio * 4);
      const opacity = Math.max(0.25, 1 - distRatio * 0.8);
      const canTap = dist <= TAP_RADIUS;

      // ふわふわアニメーション用
      const animDelay = rng() * -20;
      const animDuration = 6 + rng() * 8;
      const driftX = 4 + rng() * 8;
      const driftY = 4 + rng() * 8;

      return {
        ...post,
        dist,
        x,
        y,
        scale,
        blur,
        opacity,
        canTap,
        animDelay,
        animDuration,
        driftX,
        driftY,
      };
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

  const selectedData = useMemo(
    () => positioned.find((p) => p.id === selectedPost),
    [positioned, selectedPost]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-400 text-sm">
          半径500m以内にまだ投稿がありません
        </p>
        <p className="text-gray-400 text-xs mt-1">最初の投稿をしてみましょう</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 浮遊空間 */}
      <div
        ref={containerRef}
        className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100"
      >
        {/* 中心マーカー（自分） */}
        <div
          className="absolute z-20 flex items-center justify-center"
          style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
        >
          <div className="h-2 w-2 rounded-full bg-indigo-400" />
          <div className="absolute h-6 w-6 animate-ping rounded-full bg-indigo-200 opacity-30" />
        </div>

        {/* 浮遊カード */}
        {positioned.map((post) => {
          const isSelected = selectedPost === post.id;
          const preview = visibleText(post.text, post.dist);
          const isNearby = post.canTap;

          return (
            <div
              key={post.id}
              className={`absolute transition-all duration-500 ${
                isSelected ? "z-30" : "z-10"
              }`}
              style={{
                left: `${post.x}%`,
                top: `${post.y}%`,
                transform: `translate(-50%, -50%) scale(${isSelected ? 1.05 : post.scale})`,
                animation: isSelected
                  ? "none"
                  : `float-${post.id.slice(0, 8)} ${post.animDuration}s ease-in-out ${post.animDelay}s infinite`,
              }}
            >
              <style>{`
                @keyframes float-${post.id.slice(0, 8)} {
                  0%, 100% { transform: translate(-50%, -50%) scale(${post.scale}) translate(0px, 0px); }
                  33% { transform: translate(-50%, -50%) scale(${post.scale}) translate(${post.driftX}px, -${post.driftY}px); }
                  66% { transform: translate(-50%, -50%) scale(${post.scale}) translate(-${post.driftX * 0.5}px, ${post.driftY * 0.7}px); }
                }
              `}</style>

              <button
                onClick={() => {
                  if (!isNearby) return;
                  setSelectedPost(isSelected ? null : post.id);
                }}
                disabled={!isNearby}
                className={`block max-w-[140px] rounded-xl px-3 py-2 text-left transition-all duration-300 ${
                  isSelected
                    ? "bg-white shadow-lg ring-2 ring-indigo-200"
                    : isNearby
                    ? "bg-white/90 shadow-md hover:shadow-lg cursor-pointer"
                    : "bg-white/60 shadow-sm cursor-default"
                }`}
                style={{
                  filter: isSelected ? "none" : `blur(${post.blur}px)`,
                  opacity: isSelected ? 1 : post.opacity,
                }}
              >
                <p className="text-xs leading-relaxed text-gray-700 line-clamp-3">
                  {preview}
                </p>
                {isNearby && !isSelected && (
                  <p className="mt-1 text-xs text-indigo-400">
                    ●
                  </p>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* 選択した投稿の詳細 */}
      {selectedData && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm animate-in fade-in duration-300">
          <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
            {selectedData.text}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
            <span>{timeAgo(selectedData.created_at)}</span>
            <span>
              {selectedData.dist < 10
                ? "ここ"
                : selectedData.dist < 50
                ? "すぐそば"
                : `${Math.round(selectedData.dist)}m先`}
            </span>
          </div>
          <CommentSection
            postId={selectedData.id}
            postLat={selectedData.lat}
            postLng={selectedData.lng}
            location={location}
          />
          <button
            onClick={() => setSelectedPost(null)}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition"
          >
            手放す
          </button>
        </div>
      )}
    </div>
  );
}
