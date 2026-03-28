"use client";

import { useState, useEffect, useCallback } from "react";

// --- 型定義 ---
interface Stats {
  totalPosts: number;
  totalComments: number;
  todayPosts: number;
  todayComments: number;
  totalUsers: number;
}

interface AdminUser {
  deviceId: string;
  postCount: number;
  commentCount: number;
  lastActive: string;
}

interface MapPin {
  id: string;
  text: string;
  lat: number;
  lng: number;
  created_at: string;
  comment_count: number;
}

interface AdminPost {
  id: string;
  text: string;
  lat: number;
  lng: number;
  created_at: string;
  device_id: string | null;
  comment_count: number;
}

// --- 時間表示 ---
function timeAgo(dateStr: string) {
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

// --- タブ切り替え ---
type Tab = "map" | "posts" | "users";

export default function AdminPage() {
  // 認証
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // sessionStorage にトークンがあれば認証済み
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("tayutau_admin")) {
      setAuthed(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        sessionStorage.setItem("tayutau_admin", "1");
        setAuthed(true);
      } else {
        setAuthError("パスワードが違います");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<Tab>("map");

  // 地図
  const [pins, setPins] = useState<MapPin[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);

  // 投稿一覧
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsOffset, setPostsOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // ユーザー一覧
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);

  // 統計取得
  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  // 地図データ取得
  const fetchMap = useCallback(async () => {
    const res = await fetch("/api/admin/map");
    if (res.ok) setPins(await res.json());
  }, []);

  // ユーザー一覧取得
  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setUsersTotal(data.total);
    }
  }, []);

  // 投稿一覧取得
  const fetchPosts = useCallback(async () => {
    const params = new URLSearchParams({
      offset: postsOffset.toString(),
      limit: "50",
    });
    if (searchQuery) params.set("q", searchQuery);
    const res = await fetch(`/api/admin/posts?${params}`);
    if (res.ok) {
      const data = await res.json();
      setPosts(data.posts);
      setPostsTotal(data.total);
    }
  }, [postsOffset, searchQuery]);

  useEffect(() => {
    if (authed) fetchStats();
  }, [authed, fetchStats]);

  useEffect(() => {
    if (authed && tab === "map") fetchMap();
  }, [authed, tab, fetchMap]);

  useEffect(() => {
    if (authed && tab === "posts") fetchPosts();
  }, [authed, tab, fetchPosts]);

  useEffect(() => {
    if (authed && tab === "users") fetchUsers();
  }, [authed, tab, fetchUsers]);

  // 管理者削除
  const deletePost = async (id: string) => {
    if (!confirm("この投稿を削除しますか？（コメントもすべて削除されます）")) return;
    const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchStats();
      if (tab === "map") fetchMap();
      if (tab === "posts") fetchPosts();
      if (selectedPin?.id === id) setSelectedPin(null);
    }
  };

  // Leaflet + MarkerCluster 動的読み込み（SSR回避）
  useEffect(() => {
    if (!authed || tab !== "map" || mapLoaded) return;

    const loadCSS = (id: string, href: string) => {
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
      }
    };

    // Leaflet CSS + MarkerCluster CSS
    loadCSS("leaflet-css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
    loadCSS("leaflet-mc-css", "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css");
    loadCSS("leaflet-mc-default-css", "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css");

    const loadScript = (src: string): Promise<void> =>
      new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve();
        document.head.appendChild(script);
      });

    const win = window as unknown as Record<string, unknown>;

    const init = async () => {
      // Leaflet 本体
      if (!win.L) {
        await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
      }
      // MarkerCluster プラグイン
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(win.L as any).MarkerClusterGroup) {
        await loadScript("https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js");
      }
      setMapLoaded(true);
    };
    init();
  }, [authed, tab, mapLoaded]);

  // 地図描画（MarkerCluster使用）
  useEffect(() => {
    if (!authed || !mapLoaded || tab !== "map") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    const container = document.getElementById("admin-map");
    if (!container || !L) return;

    // 既存の地図を破棄
    if ((container as any)._leaflet_id) {
      (container as any)._leaflet_id = undefined;
      container.innerHTML = "";
    }

    // 日本全体が見えるデフォルトビュー
    const map = L.map("admin-map").setView([36.5, 137.5], 6);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    }).addTo(map);

    // MarkerCluster グループ
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster: { getChildCount: () => number }) => {
        const count = cluster.getChildCount();
        const size = count < 10 ? 36 : count < 50 ? 44 : 52;
        return L.divIcon({
          html: `<div style="width:${size}px;height:${size}px;background:#6366f1;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:${size < 44 ? 13 : 15}px;font-weight:bold;">${count}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          className: "",
        });
      },
    });

    pins.forEach((pin: MapPin) => {
      const size = Math.min(12 + pin.comment_count * 3, 30);
      const color = pin.comment_count === 0 ? "#818cf8" : pin.comment_count < 3 ? "#6366f1" : "#4338ca";

      const icon = L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold;">${pin.comment_count || ""}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        className: "",
      });

      const marker = L.marker([pin.lat, pin.lng], { icon })
        .on("click", () => setSelectedPin(pin));
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    return () => {
      map.remove();
    };
  }, [mapLoaded, tab, pins]);

  // パスワード画面
  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
          <h1 className="text-lg font-semibold text-gray-800 mb-1">Tayutau Admin</h1>
          <p className="text-xs text-gray-400 mb-6">管理者パスワードを入力してください</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-100 mb-3"
            autoFocus
          />
          {authError && (
            <p className="text-xs text-red-500 mb-3">{authError}</p>
          )}
          <button
            type="submit"
            disabled={!password || authLoading}
            className="w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-40 transition"
          >
            {authLoading ? "確認中…" : "ログイン"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Tayutau Admin</h1>
            <p className="text-xs text-gray-400 mt-0.5">管理者ダッシュボード</p>
          </div>
          <a href="/" className="text-sm text-indigo-500 hover:text-indigo-600 transition">
            ← アプリに戻る
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* 統計サマリー */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[
              { label: "総投稿数", value: stats.totalPosts },
              { label: "総コメント数", value: stats.totalComments },
              { label: "ユーザー数", value: stats.totalUsers },
              { label: "今日の投稿", value: stats.todayPosts },
              { label: "今日のコメント", value: stats.todayComments },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className="text-2xl font-semibold text-gray-800 mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* タブ */}
        <div className="flex gap-1 mb-4">
          {(["map", "posts", "users"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t
                  ? "bg-indigo-500 text-white"
                  : "bg-white text-gray-500 hover:bg-gray-100"
              }`}
            >
              {t === "map" ? "地図" : t === "posts" ? "投稿一覧" : "ユーザー"}
            </button>
          ))}
        </div>

        {/* 地図タブ */}
        {tab === "map" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div id="admin-map" className="w-full" style={{ height: "500px" }} />
            {selectedPin && (
              <div className="p-4 border-t border-gray-100">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedPin.text}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>{timeAgo(selectedPin.created_at)}</span>
                  <span>コメント {selectedPin.comment_count}件</span>
                  <span>{selectedPin.lat.toFixed(5)}, {selectedPin.lng.toFixed(5)}</span>
                </div>
                <button
                  onClick={() => deletePost(selectedPin.id)}
                  className="mt-2 text-xs text-red-400 hover:text-red-600 transition"
                >
                  この投稿を削除
                </button>
              </div>
            )}
          </div>
        )}

        {/* 投稿一覧タブ */}
        {tab === "posts" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* 検索バー */}
            <div className="p-4 border-b border-gray-100">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSearchQuery(searchInput);
                  setPostsOffset(0);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="テキストで検索…"
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition"
                >
                  検索
                </button>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setSearchQuery("");
                      setPostsOffset(0);
                    }}
                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-500 hover:bg-gray-200 transition"
                  >
                    クリア
                  </button>
                )}
              </form>
              <p className="text-xs text-gray-400 mt-2">
                {postsTotal}件{searchQuery && `（「${searchQuery}」で検索中）`}
              </p>
            </div>

            {/* リスト */}
            <div className="divide-y divide-gray-50">
              {posts.map((p) => (
                <div key={p.id} className="px-5 py-4 hover:bg-gray-50 transition">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{p.text}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{timeAgo(p.created_at)}</span>
                    <span>コメント {p.comment_count}件</span>
                    <span>{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</span>
                    {p.device_id && (
                      <span className="text-gray-300" title={p.device_id}>
                        端末: {p.device_id.slice(0, 8)}…
                      </span>
                    )}
                    <button
                      onClick={() => deletePost(p.id)}
                      className="text-red-400 hover:text-red-600 transition ml-auto"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
              {posts.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">
                  投稿がありません
                </p>
              )}
            </div>

            {/* ページネーション */}
            {postsTotal > 50 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <button
                  onClick={() => setPostsOffset(Math.max(0, postsOffset - 50))}
                  disabled={postsOffset === 0}
                  className="text-sm text-indigo-500 disabled:text-gray-300 transition"
                >
                  ← 前へ
                </button>
                <span className="text-xs text-gray-400">
                  {postsOffset + 1}–{Math.min(postsOffset + 50, postsTotal)} / {postsTotal}
                </span>
                <button
                  onClick={() => setPostsOffset(postsOffset + 50)}
                  disabled={postsOffset + 50 >= postsTotal}
                  className="text-sm text-indigo-500 disabled:text-gray-300 transition"
                >
                  次へ →
                </button>
              </div>
            )}
          </div>
        )}
        {/* ユーザータブ */}
        {tab === "users" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <p className="text-xs text-gray-400">
                ユニークユーザー数: {usersTotal}
              </p>
            </div>
            <div className="divide-y divide-gray-50">
              {users.map((u) => (
                <div key={u.deviceId} className="px-5 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-gray-800">
                      {u.deviceId.slice(0, 8)}…
                    </span>
                    <span className="text-xs text-gray-400" title={u.deviceId}>
                      {u.deviceId}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                    <span>投稿 {u.postCount}件</span>
                    <span>コメント {u.commentCount}件</span>
                    <span>最終アクティブ: {timeAgo(u.lastActive)}</span>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">
                  ユーザーデータがありません
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
