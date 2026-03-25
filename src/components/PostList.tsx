"use client";

import { useState, useEffect, useCallback } from "react";
import type { Post, GeoLocation } from "@/lib/types";
import CommentSection from "./CommentSection";

interface Props {
  location: GeoLocation;
  refreshKey: number;
}

// 距離に応じて表示する文字数を計算
// 0m → 全文表示, 500m → 最初の6文字のみ
function visibleLength(text: string, distanceM: number | undefined): number {
  if (distanceM === undefined || distanceM <= 0) return text.length;
  const ratio = Math.max(0, 1 - distanceM / 500);
  // 最低6文字は見せる
  return Math.max(6, Math.round(text.length * ratio));
}

// 距離に応じた不透明度
// 0m → 1.0, 500m → 0.35
function opacityFromDistance(distanceM: number | undefined): number {
  if (distanceM === undefined || distanceM <= 0) return 1;
  return Math.max(0.35, 1 - distanceM / 700);
}

export default function PostList({ location, refreshKey }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

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

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "たった今";
    if (mins < 60) return `${mins}分前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}時間前`;
    return `${Math.floor(hours / 24)}日前`;
  };

  const formatDistance = (m?: number) => {
    if (m === undefined) return "";
    if (m < 50) return "すぐそば";
    if (m < 100) return "すぐ近く";
    return `${Math.round(m)}m先`;
  };

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
      {posts.map((post) => {
        const vLen = visibleLength(post.text, post.distance_m);
        const isTruncated = vLen < post.text.length;
        const displayText = isTruncated
          ? post.text.slice(0, vLen) + "…"
          : post.text;
        const opacity = opacityFromDistance(post.distance_m);

        return (
          <article
            key={post.id}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-opacity"
            style={{ opacity }}
          >
            <p className="text-gray-800 text-sm whitespace-pre-wrap">
              {displayText}
            </p>
            {isTruncated && (
              <p className="mt-1 text-xs text-gray-300">
                ― 近づくと続きが見えます
              </p>
            )}
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
              <span>{timeAgo(post.created_at)}</span>
              {post.distance_m !== undefined && (
                <span>{formatDistance(post.distance_m)}</span>
              )}
            </div>
            <CommentSection
              postId={post.id}
              postLat={post.lat}
              postLng={post.lng}
              location={location}
            />
          </article>
        );
      })}
    </div>
  );
}
