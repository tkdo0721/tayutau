"use client";

import { useState, useEffect, useCallback } from "react";
import { getDeviceId } from "@/lib/deviceId";
import type { Post, PostAnalytics } from "@/lib/types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  return `${Math.floor(days / 30)}ヶ月前`;
}

function BarChart({ data, label }: { data: number[]; label: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="mt-3">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <div className="flex items-end gap-px h-16">
        {data.map((v, i) => (
          <div
            key={i}
            className="flex-1 bg-indigo-300 rounded-t-sm transition-all"
            style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 2 : 0 }}
            title={`${i}時: ${v}`}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-300 mt-0.5">
        <span>0</span>
        <span>6</span>
        <span>12</span>
        <span>18</span>
        <span>23</span>
      </div>
    </div>
  );
}

function AnalyticsDetail({
  analytics,
  onClose,
}: {
  analytics: PostAnalytics;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="bg-gray-900 w-full max-w-md rounded-t-2xl p-5 pb-8 animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-white">アナリティクス</h3>
          <button onClick={onClose} className="text-gray-400 text-lg">
            &times;
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">
              リーチ
            </p>
            <p className="text-xl font-light text-white">
              {analytics.reach.unique}
            </p>
            <p className="text-[10px] text-gray-500">
              総計 {analytics.reach.total}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">
              エンゲージ
            </p>
            <p className="text-xl font-light text-white">
              {analytics.view.unique}
            </p>
            <p className="text-[10px] text-gray-500">
              総計 {analytics.view.total}
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-3 mb-3">
          <div className="flex justify-between items-center">
            <p className="text-[10px] text-gray-400">コンバージョン率</p>
            <p className="text-sm text-indigo-300">
              {Math.round(analytics.conversion_rate * 100)}%
            </p>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            リーチ → エンゲージの転換率
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <p className="text-[10px] text-gray-400">ピーク時間帯</p>
            <p className="text-sm text-indigo-300">{analytics.peak_hour}時台</p>
          </div>
          <BarChart data={analytics.by_hour} label="時間帯別エンゲージ" />
        </div>
      </div>
    </div>
  );
}

export default function MyPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalytics, setSelectedAnalytics] =
    useState<PostAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState<string | null>(null);

  const fetchMyPosts = useCallback(async () => {
    const deviceId = getDeviceId();
    if (!deviceId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/mypage/posts?device_id=${encodeURIComponent(deviceId)}`
      );
      if (res.ok) {
        setPosts(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyPosts();
  }, [fetchMyPosts]);

  const openAnalytics = async (postId: string) => {
    const deviceId = getDeviceId();
    setAnalyticsLoading(postId);
    try {
      const res = await fetch(
        `/api/analytics/posts/${postId}?device_id=${encodeURIComponent(deviceId)}`
      );
      if (res.ok) {
        setSelectedAnalytics(await res.json());
      }
    } finally {
      setAnalyticsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ヘッダー */}
      <header className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <a
            href="/"
            className="text-gray-400 text-sm hover:text-white transition"
          >
            &larr; 戻る
          </a>
          <h1 className="text-sm font-medium">マイページ</h1>
          <div className="w-12" />
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-md mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">まだ投稿がありません</p>
            <a
              href="/"
              className="inline-block mt-3 text-indigo-400 text-sm hover:text-indigo-300"
            >
              投稿してみる &rarr;
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              {posts.length}件の投稿
            </p>
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => openAnalytics(post.id)}
                className="w-full text-left bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition"
              >
                <p className="text-sm text-gray-200 leading-relaxed line-clamp-3">
                  {post.text}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-gray-500">
                    {timeAgo(post.created_at)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500">
                      リーチ{" "}
                      <span className="text-gray-300">
                        {post.reach_count ?? 0}
                      </span>
                    </span>
                    <span className="text-[10px] text-gray-500">
                      閲覧{" "}
                      <span className="text-gray-300">
                        {post.view_count ?? 0}
                      </span>
                    </span>
                    {analyticsLoading === post.id && (
                      <span className="h-3 w-3 animate-spin rounded-full border border-indigo-400 border-t-transparent" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* アナリティクス詳細モーダル */}
      {selectedAnalytics && (
        <AnalyticsDetail
          analytics={selectedAnalytics}
          onClose={() => setSelectedAnalytics(null)}
        />
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
