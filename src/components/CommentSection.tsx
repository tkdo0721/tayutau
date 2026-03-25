"use client";

import { useState, useEffect, useCallback } from "react";
import type { Comment, GeoLocation } from "@/lib/types";

interface Props {
  postId: string;
  location: GeoLocation;
}

export default function CommentSection({ postId, location }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

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
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), lat: location.lat, lng: location.lng }),
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
        {open ? "コメントを閉じる" : `コメント${comments.length > 0 ? ` (${comments.length})` : ""}`}
      </button>

      {open && (
        <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-100">
          {comments.map((c) => (
            <div key={c.id} className="text-sm">
              <p className="text-gray-700">{c.text}</p>
              <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
            </div>
          ))}

          {comments.length === 0 && (
            <p className="text-xs text-gray-400">まだコメントはありません</p>
          )}

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
        </div>
      )}
    </div>
  );
}
