import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/admin/users — ユニークdevice_idごとの投稿数・コメント数・最終アクティブ
export async function GET() {
  const supabase = getSupabase();

  const [postsRes, commentsRes] = await Promise.all([
    supabase
      .from("posts")
      .select("device_id, created_at")
      .not("device_id", "is", null),
    supabase
      .from("comments")
      .select("device_id, created_at")
      .not("device_id", "is", null),
  ]);

  // device_idごとに集計
  const map = new Map<
    string,
    { postCount: number; commentCount: number; lastActive: string }
  >();

  postsRes.data?.forEach((r: { device_id: string; created_at: string }) => {
    const entry = map.get(r.device_id) ?? {
      postCount: 0,
      commentCount: 0,
      lastActive: r.created_at,
    };
    entry.postCount++;
    if (r.created_at > entry.lastActive) entry.lastActive = r.created_at;
    map.set(r.device_id, entry);
  });

  commentsRes.data?.forEach((r: { device_id: string; created_at: string }) => {
    const entry = map.get(r.device_id) ?? {
      postCount: 0,
      commentCount: 0,
      lastActive: r.created_at,
    };
    entry.commentCount++;
    if (r.created_at > entry.lastActive) entry.lastActive = r.created_at;
    map.set(r.device_id, entry);
  });

  // 最終アクティブ順でソート
  const users = Array.from(map.entries())
    .map(([deviceId, data]) => ({
      deviceId,
      ...data,
    }))
    .sort((a, b) => (a.lastActive > b.lastActive ? -1 : 1));

  return NextResponse.json({ users, total: users.length });
}
