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

function visibleText(text: string, distanceM: number): string {
  const ratio = Math.max(0, 1 - distanceM / MAX_RADIUS);
  const len = Math.max(3, Math.round(text.length * ratio));
  if (len >= text.length) return text;
  return text.slice(0, len) + "…";
}

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

  // ドラッグ完了後の確定位置 (state)
  const [settledPositions, setSettledPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  // ドラッグ中のカードID (state — UIの見た目切替用)
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // ミニマップの展開状態
  const [mapExpanded, setMapExpanded] = useState(false);

  // ドラッグ中の生データ (ref — DOM直接操作用、再レンダリングしない)
  const dragRef = useRef<{
    postId: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
    el: HTMLElement | null;
  } | null>(null);

  // カード要素への参照
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
        ...post, dist, x, y, scale, blur, opacity, canTap,
        animDelay, animDuration, driftX, driftY,
      } as PositionedPost;
    });

    const adjustments = resolveOverlaps(initial);
    return initial.map((p) => {
      const adj = adjustments.get(p.id);
      return adj ? { ...p, x: adj.x, y: adj.y } : p;
    });
  }, [posts, location]);

  // --- ドラッグ: DOM直接操作 ---

  const getPointerPos = (e: TouchEvent | MouseEvent) => {
    if ("touches" in e) {
      const t = e.touches[0] || e.changedTouches[0];
      return { px: t.clientX, py: t.clientY };
    }
    return { px: e.clientX, py: e.clientY };
  };

  const handlePointerDown = useCallback(
    (postId: string, currentX: number, currentY: number) =>
      (e: React.TouchEvent | React.MouseEvent) => {
        const nativeE = e.nativeEvent;
        const { px, py } = getPointerPos(nativeE as TouchEvent | MouseEvent);
        const el = cardRefs.current[postId];
        dragRef.current = {
          postId,
          startX: px,
          startY: py,
          originX: currentX,
          originY: currentY,
          moved: false,
          el,
        };
      },
    []
  );

  useEffect(() => {
    const handleMove = (e: TouchEvent | MouseEvent) => {
      const drag = dragRef.current;
      if (!drag || !containerRef.current || !drag.el) return;

      const { px, py } = getPointerPos(e);
      const dx = px - drag.startX;
      const dy = py - drag.startY;

      if (!drag.moved && Math.abs(dx) < 8 && Math.abs(dy) < 8) return;

      if (!drag.moved) {
        drag.moved = true;
        setDraggingId(drag.postId);
        // アニメーション即停止 + スタイル切替
        drag.el.style.animation = "none";
        drag.el.style.transition = "none";
        drag.el.style.zIndex = "40";
      }

      e.preventDefault();

      const rect = containerRef.current.getBoundingClientRect();
      const newX = drag.originX + (dx / rect.width) * 100;
      const newY = drag.originY + (dy / rect.height) * 100;
      const clampedX = Math.min(95, Math.max(5, newX));
      const clampedY = Math.min(95, Math.max(5, newY));

      // DOM直接操作 — setState しない
      drag.el.style.left = `${clampedX}%`;
      drag.el.style.top = `${clampedY}%`;
    };

    const handleEnd = () => {
      const drag = dragRef.current;
      if (!drag) return;

      if (drag.moved && drag.el && containerRef.current) {
        // 現在のDOM位置を確定
        const left = parseFloat(drag.el.style.left);
        const top = parseFloat(drag.el.style.top);
        drag.el.style.transition = "";
        drag.el.style.zIndex = "";
        setSettledPositions((prev) => ({
          ...prev,
          [drag.postId]: { x: left, y: top },
        }));
        setDraggingId(null);
      } else {
        // 動いてない → タップ
        setSelectedPost((prev) =>
          prev === drag.postId ? null : drag.postId
        );
        setDraggingId(null);
      }

      dragRef.current = null;
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
        {/* ミニマップ（右下 — タップで拡大） */}
        {mapExpanded && (
          <div
            className="absolute inset-0 z-50 bg-black/20"
            onClick={() => setMapExpanded(false)}
          />
        )}
        <div
          className={`absolute z-50 transition-all duration-300 ease-in-out ${
            mapExpanded ? "inset-4" : ""
          }`}
          style={
            mapExpanded
              ? {}
              : { right: "12px", bottom: "12px", width: "100px", height: "100px" }
          }
          onClick={(e) => {
            e.stopPropagation();
            setMapExpanded(!mapExpanded);
          }}
        >
          <div
            className={`relative w-full h-full rounded-full bg-white/80 backdrop-blur-sm shadow-md overflow-hidden cursor-pointer transition-all duration-300 ${
              mapExpanded ? "shadow-xl" : ""
            }`}
          >
            {/* 同心円 */}
            {[100, 200, 300, 400, 500].map((r) => {
              const size = (r / MAX_RADIUS) * 90;
              return (
                <div
                  key={r}
                  className="absolute rounded-full border border-gray-200/60"
                  style={{
                    width: `${size}%`,
                    height: `${size}%`,
                    left: `${50 - size / 2}%`,
                    top: `${50 - size / 2}%`,
                  }}
                >
                  {mapExpanded && (
                    <span
                      className="absolute text-gray-300"
                      style={{
                        fontSize: "9px",
                        top: "-5px",
                        left: "50%",
                        transform: "translateX(-50%)",
                      }}
                    >
                      {r}m
                    </span>
                  )}
                </div>
              );
            })}
            {/* 北の表示 */}
            <span
              className="absolute text-gray-400 font-medium"
              style={{
                fontSize: mapExpanded ? "11px" : "7px",
                top: mapExpanded ? "6px" : "2px",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            >
              N
            </span>
            {/* 投稿ドット */}
            {(() => {
              // ドット位置を計算してから重なりを解消
              const dots = positioned.map((post) => {
                // 非線形スケール: 近距離を広げて遠距離を圧縮
                const distRatio = post.dist / MAX_RADIUS;
                const scaledR = Math.sqrt(distRatio) * 45;
                const angle = bearing(location.lat, location.lng, post.lat, post.lng);
                const angleRad = ((angle - 90) * Math.PI) / 180;
                return {
                  post,
                  x: 50 + scaledR * Math.cos(angleRad),
                  y: 50 + scaledR * Math.sin(angleRad),
                };
              });

              // 近いドット同士を押し出す
              const minGap = mapExpanded ? 6 : 4;
              for (let iter = 0; iter < 8; iter++) {
                for (let i = 0; i < dots.length; i++) {
                  for (let j = i + 1; j < dots.length; j++) {
                    const dx = dots[j].x - dots[i].x;
                    const dy = dots[j].y - dots[i].y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < minGap && d > 0) {
                      const push = (minGap - d) / 2;
                      const nx = dx / d;
                      const ny = dy / d;
                      dots[i].x -= nx * push;
                      dots[i].y -= ny * push;
                      dots[j].x += nx * push;
                      dots[j].y += ny * push;
                    }
                  }
                }
              }

              return dots.map(({ post, x, y }) => {
                const dotSize = mapExpanded
                  ? post.canTap ? 10 : 6
                  : post.canTap ? 5 : 3;
                return (
                  <div
                    key={post.id}
                    className="absolute rounded-full transition-all duration-300"
                    style={{
                      width: `${dotSize}px`,
                      height: `${dotSize}px`,
                      backgroundColor: post.canTap ? "#6366f1" : "#9ca3af",
                      opacity: post.canTap ? 1 : 0.5,
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    {mapExpanded && (
                      <span
                        className="absolute whitespace-nowrap text-gray-500 pointer-events-none"
                        style={{
                          fontSize: "8px",
                          left: `${dotSize + 3}px`,
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                      >
                        {Math.round(post.dist)}m
                      </span>
                    )}
                  </div>
                );
              });
            })()}
            {/* 自分（中心） */}
            <div
              className="absolute rounded-full bg-indigo-500"
              style={{
                width: mapExpanded ? "8px" : "5px",
                height: mapExpanded ? "8px" : "5px",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
        </div>

        {/* カード — 遠いカードを先にレンダリング（後ろに配置） */}
        {[...positioned].sort((a, b) => {
          // canTap=false を先に描画 → canTap=true が上に来る
          if (a.canTap !== b.canTap) return a.canTap ? 1 : -1;
          // 同グループ内は遠い順
          return (b.dist) - (a.dist);
        }).map((post) => {
          const isSelected = selectedPost === post.id;
          const isBeingDragged = draggingId === post.id;
          const isSettled = post.id in settledPositions;
          const preview = visibleText(post.text, post.dist);
          const isNearby = post.canTap;

          const currentX = settledPositions[post.id]?.x ?? post.x;
          const currentY = settledPositions[post.id]?.y ?? post.y;
          const stopAnim = isSelected || isBeingDragged || isSettled;

          return (
            <div
              key={post.id}
              ref={(el) => { cardRefs.current[post.id] = el; }}
              className={`absolute ${
                isBeingDragged ? "z-40" : isSelected ? "z-30" : isNearby ? "z-20" : "z-10"
              }`}
              style={{
                left: `${currentX}%`,
                top: `${currentY}%`,
                transform: `translate(-50%, -50%) scale(${
                  isBeingDragged ? 1.1 : isSelected ? 1.05 : post.scale
                })`,
                pointerEvents: isNearby ? "auto" : "none",
                transition: isBeingDragged ? "none" : "transform 0.4s ease, opacity 0.4s ease",
                animation: stopAnim
                  ? "none"
                  : `float-${post.id.slice(0, 8)} ${post.animDuration}s ease-in-out ${post.animDelay}s infinite`,
              }}
              onTouchStart={
                isNearby ? handlePointerDown(post.id, currentX, currentY) : undefined
              }
              onMouseDown={
                isNearby ? handlePointerDown(post.id, currentX, currentY) : undefined
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
                className={`block rounded-xl px-3 py-2 text-left ${
                  isSelected
                    ? "max-w-[200px] bg-white shadow-lg ring-2 ring-indigo-200"
                    : isBeingDragged
                    ? "max-w-[180px] bg-white shadow-xl ring-2 ring-indigo-300"
                    : isNearby
                    ? "max-w-[160px] bg-white/90 shadow-md cursor-grab"
                    : "max-w-[120px] bg-white/40 shadow-none"
                }`}
                style={{
                  filter:
                    isSelected || isBeingDragged ? "none" : `blur(${post.blur}px)`,
                  opacity:
                    isSelected || isBeingDragged ? 1 : post.opacity,
                }}
              >
                <p
                  className={`leading-relaxed text-gray-700 ${
                    isNearby ? "text-xs line-clamp-4" : "text-[10px] line-clamp-2"
                  }`}
                >
                  {preview}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 詳細 */}
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
