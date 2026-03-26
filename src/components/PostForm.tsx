"use client";

import { useState } from "react";
import type { GeoLocation } from "@/lib/types";

interface Props {
  location: GeoLocation;
  onPosted: () => void;
}

export default function PostForm({ location, onPosted }: Props) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), lat: location.lat, lng: location.lng }),
      });
      if (res.ok) {
        setText("");
        onPosted();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="いまここで何を感じていますか？"
        maxLength={200}
        rows={3}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">{text.length}/200</span>
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "送信中…" : "投稿する"}
        </button>
      </div>
    </form>
  );
}
