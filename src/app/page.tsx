"use client";

import { useState } from "react";
import { useGeolocation } from "@/lib/hooks";
import PostForm from "@/components/PostForm";
import RadarView from "@/components/RadarView";

export default function Home() {
  const { location, error, loading, refresh } = useGeolocation();
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
          <p className="text-sm text-gray-500">位置情報を取得しています…</p>
        </div>
      </main>
    );
  }

  if (error || !location) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-800">Tayutau</h1>
          <p className="mb-4 text-sm text-gray-500">
            {error || "位置情報を取得できませんでした"}
          </p>
          <button
            onClick={refresh}
            className="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-600"
          >
            もう一度試す
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-6">
        {/* Header */}
        <header className="mb-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">
            Tayutau
          </h1>
          <p className="mt-1 text-xs text-gray-400">
            半径500m — ここにいる、だれかの声
          </p>
        </header>

        {/* Radar View */}
        <RadarView location={location} refreshKey={refreshKey} />

        {/* Post Form */}
        <div className="mt-6">
          <PostForm
            location={location}
            onPosted={() => setRefreshKey((k) => k + 1)}
          />
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-gray-300">
          <p>
            {location.lat.toFixed(4)}, {location.lng.toFixed(4)} ·{" "}
            <button
              onClick={refresh}
              className="text-indigo-400 hover:text-indigo-500 transition"
            >
              位置を更新
            </button>
          </p>
        </footer>
      </div>
    </main>
  );
}
