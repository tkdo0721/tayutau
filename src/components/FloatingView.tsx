"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Post, GeoLocation } from "@/lib/types";
import { getDeviceId } from "@/lib/deviceId";
import CommentSection from "./CommentSection";
import TypewriterText from "./TypewriterText";

interface Props {
  location: GeoLocation;
  refreshKey: number;
  onPosted: () => void;
  onRefreshLocation: () => void;
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

export default function FloatingView({ location, refreshKey, onPosted, onRefreshLocation }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // ドラッグ完了後の確定位置
  const [settledPositions, setSettledPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  // ドラッグ中のカードID
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // ミニマップの展開状態
  const [mapExpanded, setMapExpanded] = useState(false);

  // 全画面コメント表示中の投稿
  const [commentPost, setCommentPost] = useState<PositionedPost | null>(null);

  // 投稿モーダル
  const [showPostForm, setShowPostForm] = useState(false);
  const [postText, setPostText] = useState("");
  const [postSubmitting, setPostSubmitting] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // ドラッグ中の生データ (ref)
  const dragRef = useRef<{
    postId: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
    el: HTMLElement | null;
  } | null>(null);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // カード順次表示: 表示済みカードIDのセット
  const [visibleCardIds, setVisibleCardIds] = useState<Set<string>>(new Set());
  // 前回のリフレッシュキーを追跡（再読み込み時にリセット）
  const prevRefreshKeyRef = useRef(refreshKey);

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
    // リフレッシュ時に表示済みカードをリセット
    if (prevRefreshKeyRef.current !== refreshKey) {
      setVisibleCardIds(new Set());
      prevRefreshKeyRef.current = refreshKey;
    }
    fetchPosts();
  }, [fetchPosts, refreshKey]);

  // カードを新しい順に一枚ずつ表示する（300ms間隔）
  const CARD_STAGGER_MS = 300;
  useEffect(() => {
    if (posts.length === 0) return;

    // created_at の新しい順にソート
    const sorted = [...posts].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const timers: ReturnType<typeof setTimeout>[] = [];
    sorted.forEach((post, i) => {
      // 既に表示済みなら即追加（再計算によるちらつき防止）
      if (visibleCardIds.has(post.id)) return;
      const timer = setTimeout(() => {
        setVisibleCardIds((prev) => {
          const next = new Set(prev);
          next.add(post.id);
          return next;
        });
      }, i * CARD_STAGGER_MS);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
    // posts が変わった時のみ再実行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts]);

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

      // DOM直接操作
      drag.el.style.left = `${clampedX}%`;
      drag.el.style.top = `${clampedY}%`;
    };

    const handleEnd = (e: TouchEvent | MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      if (drag.moved && drag.el && containerRef.current) {
        // ドラッグ完了 → 位置確定
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
        // 動いてない → タップ → コメント画面を開く
        const post = positioned.find((p) => p.id === drag.postId);
        if (post) {
          setCommentPost(post);
        }
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
  }, [positioned, settledPositions]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "たった今";
    if (mins < 60) return `${mins}分前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}時間前`;
    return `${Math.floor(hours / 24)}日前`;
  };

  // モーダル開いたらフォーカス
  useEffect(() => {
    if (showPostForm && editorRef.current) {
      setTimeout(() => editorRef.current?.focus(), 100);
    }
  }, [showPostForm]);

  // 投稿送信
  const handlePost = async () => {
    if (!postText.trim() || postSubmitting) return;
    setPostSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: postText.trim(),
          lat: location.lat,
          lng: location.lng,
          device_id: getDeviceId(),
        }),
      });
      if (res.ok) {
        setPostText("");
        if (editorRef.current) editorRef.current.innerText = "";
        setShowPostForm(false);
        onPosted();
      }
    } finally {
      setPostSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* ヘッダー */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="text-center pt-4 pb-2">
          <h1 className="text-lg font-bold tracking-tight text-gray-800/60">
            Tayutau
          </h1>
          <p className="text-[10px] text-gray-400/60">
            場所に残しただれかの声
          </p>
        </div>
      </div>

      {/* メイン浮遊エリア */}
      <div
        ref={containerRef}
        className="absolute inset-0 select-none"
        style={{ touchAction: "none" }}
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
              const dots = positioned.map((post) => {
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
                      backgroundColor: "transparent",
                      border: post.canTap ? "2px solid #6366f1" : "1.5px solid #9ca3af",
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
            {/* 自分（中心）十字 */}
            <div
              className="absolute"
              style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
            >
              <div
                className="absolute bg-orange-400"
                style={{
                  width: mapExpanded ? "12px" : "7px",
                  height: mapExpanded ? "2px" : "1.5px",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
              <div
                className="absolute bg-orange-400"
                style={{
                  width: mapExpanded ? "2px" : "1.5px",
                  height: mapExpanded ? "12px" : "7px",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
            </div>
          </div>
        </div>

        {/* 浮遊カード */}
        {posts.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                半径500m以内にまだ投稿がありません
              </p>
              <p className="text-gray-400 text-xs mt-1">最初の投稿をしてみましょう</p>
            </div>
          </div>
        ) : (
          [...positioned]
            .sort((a, b) => {
              if (a.canTap !== b.canTap) return a.canTap ? 1 : -1;
              return b.dist - a.dist;
            })
            .filter((post) => visibleCardIds.has(post.id))
            .map((post) => {
              const isBeingDragged = draggingId === post.id;
              const isSettled = post.id in settledPositions;
              const preview = visibleText(post.text, post.dist);
              const isNearby = post.canTap;

              const currentX = settledPositions[post.id]?.x ?? post.x;
              const currentY = settledPositions[post.id]?.y ?? post.y;
              const stopAnim = isBeingDragged || isSettled;

              return (
                <div
                  key={post.id}
                  ref={(el) => {
                    cardRefs.current[post.id] = el;
                  }}
                  className={`absolute ${
                    isBeingDragged ? "z-40" : isNearby ? "z-20" : "z-10"
                  }`}
                  style={{
                    left: `${currentX}%`,
                    top: `${currentY}%`,
                    transform: `translate(-50%, -50%) scale(${
                      isBeingDragged ? 1.1 : post.scale
                    })`,
                    pointerEvents: isNearby ? "auto" : "none",
                    transition: isBeingDragged
                      ? "none"
                      : "transform 0.4s ease, opacity 0.4s ease",
                    animation: stopAnim
                      ? "none"
                      : `float-${post.id.slice(0, 8)} ${post.animDuration}s ease-in-out ${post.animDelay}s infinite`,
                  }}
                  onTouchStart={
                    isNearby
                      ? handlePointerDown(post.id, currentX, currentY)
                      : undefined
                  }
                  onMouseDown={
                    isNearby
                      ? handlePointerDown(post.id, currentX, currentY)
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
                    className={`block rounded-xl px-3 py-2 text-left ${
                      isBeingDragged
                        ? "max-w-[180px] bg-white shadow-xl ring-2 ring-indigo-300"
                        : isNearby
                        ? "max-w-[160px] bg-white/90 shadow-md cursor-grab"
                        : "max-w-[120px] bg-white/40 shadow-none"
                    }`}
                    style={{
                      filter: isBeingDragged
                        ? "none"
                        : `blur(${post.blur}px)`,
                      opacity: isBeingDragged ? 1 : post.opacity,
                    }}
                  >
                    <p
                      className={`leading-relaxed text-gray-700 ${
                        isNearby
                          ? "text-xs line-clamp-4"
                          : "text-[10px] line-clamp-2"
                      }`}
                    >
                      <TypewriterText
                        text={preview}
                        speed={50}
                      />
                    </p>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* 投稿ボタン（左下） */}
      <button
        onClick={() => setShowPostForm(true)}
        className="absolute left-4 bottom-4 z-40 w-12 h-12 rounded-full bg-indigo-500 text-white shadow-lg flex items-center justify-center hover:bg-indigo-600 active:scale-95 transition-all"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* 位置更新ボタン（左下、投稿ボタンの上） */}
      <button
        onClick={onRefreshLocation}
        className="absolute left-5 bottom-[76px] z-40 w-8 h-8 rounded-full bg-white/80 text-gray-400 shadow flex items-center justify-center hover:text-indigo-500 transition"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a10 10 0 0 1 10 10h-3l-4-4" />
          <path d="M12 22a10 10 0 0 1-10-10h3l4 4" />
        </svg>
      </button>

      {/* 投稿モーダル */}
      {showPostForm && (
        <div
          className="absolute inset-0 z-[60] bg-black/30 backdrop-blur-sm"
          onClick={() => {
            setShowPostForm(false);
            setPostText("");
            if (editorRef.current) editorRef.current.innerText = "";
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 bg-white rounded-b-2xl p-5 shadow-xl animate-slide-down"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              ref={editorRef}
              contentEditable
              role="textbox"
              aria-placeholder="この場所に言葉を残す…"
              onInput={(e) => {
                const el = e.currentTarget;
                const text = el.innerText || "";
                if (text.length > 200) {
                  el.innerText = text.slice(0, 200);
                  // カーソルを末尾に
                  const sel = window.getSelection();
                  if (sel) {
                    const range = document.createRange();
                    range.selectNodeContents(el);
                    range.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(range);
                  }
                }
                setPostText(el.innerText || "");
              }}
              onFocus={(e) => {
                if (!e.currentTarget.innerText) {
                  e.currentTarget.dataset.empty = "true";
                }
              }}
              onBlur={(e) => {
                delete e.currentTarget.dataset.empty;
              }}
              className="w-full min-h-[80px] max-h-[120px] overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 empty:before:content-[attr(aria-placeholder)] empty:before:text-gray-400"
              suppressContentEditableWarning
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-400">{postText.length}/200</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowPostForm(false);
                    setPostText("");
                    if (editorRef.current) editorRef.current.innerText = "";
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition"
                >
                  やめる
                </button>
                <button
                  onClick={handlePost}
                  disabled={!postText.trim() || postSubmitting}
                  className="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {postSubmitting ? "送信中…" : "投稿する"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 全画面コメント表示 */}
      {commentPost && (
        <div className="absolute inset-0 z-[60] flex flex-col bg-white animate-slide-up">
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{timeAgo(commentPost.created_at)}</span>
              <span>·</span>
              <span>
                {commentPost.dist < 10
                  ? "ここ"
                  : commentPost.dist < 50
                  ? "すぐそば"
                  : `${Math.round(commentPost.dist)}m先`}
              </span>
            </div>
            <button
              onClick={() => setCommentPost(null)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* 投稿本文 */}
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
              {commentPost.text}
            </p>
            {commentPost.device_id === getDeviceId() && (
              <button
                onClick={async () => {
                  if (!confirm("この投稿を削除しますか？")) return;
                  const res = await fetch(`/api/posts/${commentPost.id}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ device_id: getDeviceId() }),
                  });
                  if (res.ok) {
                    setCommentPost(null);
                    onPosted();
                  }
                }}
                className="mt-3 text-xs text-gray-400 hover:text-red-400 transition"
              >
                この投稿を削除
              </button>
            )}
          </div>

          {/* コメント一覧 + 入力 */}
          <div className="flex-1 overflow-y-auto">
            <CommentSection
              postId={commentPost.id}
              postLat={commentPost.lat}
              postLng={commentPost.lng}
              location={location}
              fullScreen
            />
          </div>
        </div>
      )}

      {/* スライドアップアニメーション */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @keyframes slide-down {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
