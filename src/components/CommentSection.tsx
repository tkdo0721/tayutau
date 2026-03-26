"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Comment, GeoLocation } from "@/lib/types";
import { getDeviceId } from "@/lib/deviceId";

const COMMENT_RADIUS_M = 50;

interface Props {
  postId: string;
  postLat: number;
  postLng: number;
  location: GeoLocation;
  fullScreen?: boolean;
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
  fullScreen = false,
}: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    fetchComments();
  }, [fetchComments]);

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
          device_id: getDeviceId(),
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

  if (fullScreen) {
    return (
      <div className="flex flex-col h-full">
        {/* コメント一覧 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {comments.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">
              まだコメントはありません
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="group">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {c.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">
                      {timeAgo(c.created_at)}
                    </span>
                    {c.device_id === getDeviceId() && (
                      <button
                        onClick={async () => {
                          if (!confirm("このコメントを削除しますか？")) return;
                          const res = await fetch(
                            `/api/posts/${postId}/comments/${c.id}`,
                            {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ device_id: getDeviceId() }),
                            }
                          );
                          if (res.ok) fetchComments();
                        }}
                        className="text-xs text-gray-400 hover:text-red-400 transition"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* コメント入力（画面下部に固定） */}
        <div className="border-t border-gray-100 px-4 py-3 bg-white">
          {canComment ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="コメントを書く…"
                maxLength={140}
                className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-100"
              />
              <button
                type="submit"
                disabled={!text.trim() || submitting}
                className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-600 disabled:opacity-40"
              >
                {submitting ? "…" : "送信"}
              </button>
            </form>
          ) : (
            <p className="text-xs text-gray-400 text-center py-1">
              投稿地点から{Math.round(distToPost)}m — あと
              {Math.round(distToPost - COMMENT_RADIUS_M)}m近づくとコメントできます
            </p>
          )}
        </div>
      </div>
    );
  }

  // コンパクトモード（旧来の表示、現在は使わない）
  return (
    <div className="mt-2">
      <div className="space-y-3 pl-4 border-l-2 border-gray-100">
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
              maxLength={140}
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
            投稿地点から{Math.round(distToPost)}m — あと
            {Math.round(distToPost - COMMENT_RADIUS_M)}m近づくとコメントできます
          </p>
        )}
      </div>
    </div>
  );
}
