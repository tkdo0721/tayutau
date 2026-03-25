"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Post, GeoLocation } from "@/lib/types";
import CommentSection from "./CommentSection";

interface Props {
  location: GeoLocation;
  refreshKey: number;
}

const MAX_RADIUS = 500;
const TAP_RADIUS = 50;

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

// シード付き疑似乱数
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

// タップ可能カード同士の重なりを解消
function resolveOverlaps(
  items: { x: number; y: number; canTap: boolean; id: string }[]
): Map<string, { x: number; y: number }> {
  const tappable = items.filter((i) => i.canTap);
  const result = new Map<string, { x: number; y: number }>();
  const minDist = 18;

  const positions = tappable.map((t) => ({ id: t.id, x: t.x, y: t.y }));

  for (let iter = 0; iter < 10; iter++) {
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDist && d > 0) {
          const push = (minDist - d) / 2;
          const nx = dx / d;
          const ny = dy / d;
          positions[i].x -= nx * push;
          positions[i].y -= ny * push;
          positions[j].x += nx * push;
          positions[j].y += ny * push;
          positions[i].x = Math.min(85, Math.max(15, positions[i].x));
          positions[i].y = Math.min(85, Math.max(15, positions[i].y));
          positions[j].x = Math.min(85, Math.max(15, positions[j].x));
          positions[j].y = Math.min(85, Math.max(15, positions[j].y));
        }
      }
    }
  }

  for (const p of positions) {
    result.set(p.id, { x: p.x, y: p.y });
  }
  return result;
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

  // ドラッグで移動したカードの位置を保持 { [postId]: { x%, y% } }
  const [draggedPositions, setDraggedPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  // ドラッグ状態
  const dragState = useRef<{
    postId: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

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
    const initial = posts.map((post) => {
      const dist = post.distance_m ?? 0;
      const angle = bearing(location.lat, location.lng, post.lat, post.lng);
      const rng = seededRandom(post.id);

      const distRatio = dist / MAX_RADIUS;
      const angleRad = ((angle - 90) * Math.PI) / 180;

      let x: number, y: number;
      if (dist <= TAP_RADIUS) {
        const r = (dist / TAP_RADIUS) * 20;
        const jitterX = (rng() - 0.5) * 12;
        const jitterY = (rng() - 0.5) * 12;
        x = 50 + r * Math.cos(angleRad) + jitterX;
        y = 50 + r * Math.sin(angleRad) + jitterY;
        x = Math.min(80, Math.max(20, x));
        y = Math.min(80, Math.max(20, y));
      } else {
        const r = 25 + distRatio * 35;
        const jitterX = (rng() - 0.5) * 20;
        const jitterY = (rng() - 0.5) * 20;
        x = 50 + r * Math.cos(angleRad) + jitterX;
        y = 50 + r * Math.sin(angleRad) + jitterY;
        x = Math.min(110, Math.max(-10, x));
        y = Math.min(110, Math.max(-10, y));
      }

      const canTap = dist <= TAP_RADIUS;
      const scale = canTap ? 1 : Math.max(0.4, 1 - distRatio * 0.7);
      const blur =
        dist <= 30 ? 0 : dist <= TAP_RADIUS ? 0.5 : Math.min(4, distRatio * 5);
      const opacity = canTap
        ? Math.max(0.8, 1 - (dist / TAP_RADIUS) * 0.2)
        : Math.max(0.15, 1 - distRatio * 0.9);

      const animDelay = rng() * -20;
      const animDuration = canTap ? 8 + rng() * 6 : 5 + rng() * 7;
      const driftX = canTap ? 2 + rng() * 4 : 6 + rng() * 12;
      const driftY = canTap ? 2 + rng() * 4 : 6 + rng() * 12;

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
      } as PositionedPost;
    });

    const adjustments = resolveOverlaps(initial);
    return initial.map((p) => {
      const adj = adjustments.get(p.id);
      if (adj) {
        return { ...p, x: adj.x, y: adj.y };
      }
      return p;
    });
  }, [posts, location]);

  // --- ドラッグハンドラ ---

  const getPointerPos = (
    e: React.TouchEvent | React.MouseEvent | TouchEvent | MouseEvent
  ) => {
    if ("touches" in e) {
      const t = e.touches[0] || e.changedTouches[0];
      return { px: t.clientX, py: t.clientY };
    }
    return { px: (e as MouseEvent).clientX, py: (e as MouseEvent).clientY };
  };

  const handleDragStart = useCallback(
    (postId: string, currentX: number, currentY: number) =>
      (e: React.TouchEvent | React.MouseEvent) => {
        // 遠いカードはドラッグ不可
        const post = positioned.find((p) => p.id === postId);
        if (!post?.canTap) return;

        const { px, py } = getPointerPos(e);
        dragState.current = {
          postId,
          startX: px,
          startY: py,
          originX: currentX,
          originY: currentY,
          moved: false,
        };
      },
    [positioned]
  );

  // グローバルmove/endリスナー
  useEffect(() => {
    const handleMove = (e: TouchEvent | MouseEvent) => {
      if (!dragState.current || !containerRef.current) return;
      const { px, py } = getPointerPos(e);
      const dx = px - dragState.current.startX;
      const dy = py - dragState.current.startY;

      // 5px以上動いたらドラッグ確定
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        dragState.current.moved = true;
      }
      if (!dragState.current.moved) return;

      // ブラウザスクロール防止
      e.preventDefault();

      const rect = containerRef.current.getBoundingClientRect();
      const newX = dragState.current.originX + (dx / rect.width) * 100;
      const newY = dragState.current.originY + (dy / rect.height) * 100;

      setDraggedPositions((prev) => ({
        ...prev,
        [dragState.current!.postId]: {
          x: Math.min(95, Math.max(5, newX)),
          y: Math.min(95, Math.max(5, newY)),
        },
      }));
    };

    const handleEnd = () => {
      if (dragState.current && !dragState.current.moved) {
        // 動いていなければタップとして扱う
        const postId = dragState.current.postId;
        setSelectedPost((prev) => (prev === postId ? null : postId));
      }
      dragState.current = null;
    };

    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchend", handleEnd);
    window.addEventListener("mouseup", handleEnd);

    return () => {
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("mouseup", handleEnd);
    };
  }, []);

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
        className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 select-none"
        style={{
          height: "75vh",
          minHeight: "400px",
          maxHeight: "600px",
          touchAction: "none",
        }}
      >
        {/* 中心マーカー（自分） */}
        <div
          className="absolute z-20 flex items-center justify-center pointer-events-none"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="h-2 w-2 rounded-full bg-indigo-400" />
          <div className="absolute h-8 w-8 animate-ping rounded-full bg-indigo-200 opacity-20" />
        </div>

        {/* 浮遊カード */}
        {positioned.map((post) => {
          const isSelected = selectedPost === post.id;
          const isDragged = post.id in draggedPositions;
          const isBeingDragged =
            dragState.current?.postId === post.id &&
            dragState.current?.moved;
          const preview = visibleText(post.text, post.dist);
          const isNearby = post.canTap;

          // ドラッグ済みの位置があればそちらを使う
          const currentX = draggedPositions[post.id]?.x ?? post.x;
          const currentY = draggedPositions[post.id]?.y ?? post.y;

          // ドラッグ中 or 選択中 or ドラッグ済みはアニメーション停止
          const stopAnim = isSelected || isBeingDragged || isDragged;

          return (
            <div
              key={post.id}
              className={`absolute ${
                isBeingDragged
                  ? "z-40"
                  : isSelected
                  ? "z-30"
                  : isNearby
                  ? "z-15"
                  : "z-10"
              }`}
              style={{
                left: `${currentX}%`,
                top: `${currentY}%`,
                transform: `translate(-50%, -50%) scale(${
                  isBeingDragged ? 1.1 : isSelected ? 1.05 : post.scale
                })`,
                transition: isBeingDragged
                  ? "none"
                  : "all 0.5s ease",
                animation: stopAnim
                  ? "none"
                  : `float-${post.id.slice(0, 8)} ${post.animDuration}s ease-in-out ${post.animDelay}s infinite`,
              }}
              // ドラッグ開始 (タップ可能カードのみ)
              onTouchStart={
                isNearby
                  ? handleDragStart(post.id, currentX, currentY)
                  : undefined
              }
              onMouseDown={
                isNearby
                  ? handleDragStart(post.id, currentX, currentY)
                  : undefined
              }
            >
              {!stopAnim && (
                <style>{`
                  @keyframes float-${post.id.slice(0, 8)} {
                    0%, 100% { transform: translate(-50%, -50%) scale(${post.scale}) translate(0px, 0px); }
                    33% { transform: translate(-50%, -50%) scale(${post.scale}) translate(${post.driftX}px, -${post.driftY}px); }
                    66% { transform: translate(-50%, -50%) scale(${post.scale}) translate(-${post.driftX * 0.5}px, ${post.driftY * 0.7}px); }
                  }
                `}</style>
              )}

              <div
                className={`block rounded-xl px-3 py-2 text-left transition-shadow duration-300 ${
                  isSelected
                    ? "max-w-[200px] bg-white shadow-lg ring-2 ring-indigo-200"
                    : isBeingDragged
                    ? "max-w-[180px] bg-white shadow-xl ring-2 ring-indigo-300"
                    : isNearby
                    ? "max-w-[160px] bg-white/90 shadow-md cursor-grab active:cursor-grabbing"
                    : "max-w-[120px] bg-white/40 shadow-none"
                }`}
                style={{
                  filter:
                    isSelected || isBeingDragged
                      ? "none"
                      : `blur(${post.blur}px)`,
                  opacity:
                    isSelected || isBeingDragged ? 1 : post.opacity,
                }}
              >
                <p
                  className={`leading-relaxed text-gray-700 ${
                    isNearby
                      ? "text-xs line-clamp-4"
                      : "text-[10px] line-clamp-2"
                  }`}
                >
                  {preview}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 選択した投稿の詳細 */}
      {selectedData && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
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
