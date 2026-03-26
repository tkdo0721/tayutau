import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/admin/stats — 統計サマリー
export async function GET() {
  const supabase = getSupabase();

  const [postsRes, commentsRes, todayPostsRes, todayCommentsRes] =
    await Promise.all([
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("comments").select("id", { count: "exact", head: true }),
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date().toISOString().slice(0, 10)),
      supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date().toISOString().slice(0, 10)),
    ]);

  return NextResponse.json({
    totalPosts: postsRes.count ?? 0,
    totalComments: commentsRes.count ?? 0,
    todayPosts: todayPostsRes.count ?? 0,
    todayComments: todayCommentsRes.count ?? 0,
  });
}
