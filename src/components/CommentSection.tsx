"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Comment, GeoLocation } from "@/lib/types";

const COMMENT_RADIUS_M = 50;

interface Props {
  postId: string;
  postLat: number;
  postLng: number;
  location: GeoLocation;
}

// 2点間の距離をメートルで計算 (Haversine)
function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CommentSection({
  postId,
  postLat,
  postLng,
  location,
}: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  // 投稿地点と自分の距離
  const distToPost = useMemo(
    () => distanceMeters(postLat, postLng, location.lat, location.lng),
    [postLat, postLng, location]
  );
  const canComment = distToPost <= COMMENT_RADIUS_M;

  const fetchComments = useCallback(async () => {
    const res = await fetch(
      `/api/posts/${postId}/comments?lat=${location.lat}&lng=${location.lng}`
    );
    if (res.ok) {
      setComments(await res.json());
    }
  }, [postId, location]);

  useEffect(() => {
    if (open) fetchComments();
  }, [open, fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting || !canComment) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          lat: location.lat,
          lng: location.lng,
        }),
      });
      if (res.ok) {
        setText("");
        fetchComments();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "たった今";
    if (mins < 60) return `${mins}分前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}時間前`;
    return `${Math.floor(hours / 24)}日前`;
  };

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-gray-500 hover:text-indigo-500 transition"
      >
        {open
          ? "コメントを閉じる"
          : `コメント${comments.length > 0 ? ` (${comments.length})` : ""}`}
      </button>

      {open && (
        <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-100">
          {comments.map((c) => (
            <div key={c.id} className="text-sm">
              <p className="text-gray-700">{c.text}</p>
              <span className="text-xs text-gray-400">
                {timeAgo(c.created_at)}
              </span>
            </div>
          ))}

          {comments.length === 0 && (
            <p className="text-xs text-gray-400">まだコメントはありません</p>
          )}

          {canComment ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="コメントを書く…"
                maxLength={300}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-100"
              />
              <button
                type="submit"
                disabled={!text.trim() || submitting}
                className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-600 disabled:opacity-40"
              >
                送信
              </button>
            </form>
          ) : (
            <p className="text-xs text-gray-400">
              📍 投稿地点から{Math.round(distToPost)}m — あと
              {Math.round(distToPost - COMMENT_RADIUS_M)}m近づくとコメントできます
            </p>
          )}
        </div>
      )}
    </div>
  );
}
