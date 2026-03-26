import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/admin/posts?q=...&offset=0&limit=50 — 全投稿一覧（検索・ページネーション付き）
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const offset = parseInt(searchParams.get("offset") || "0");
  const limit = parseInt(searchParams.get("limit") || "50");

  const supabase = getSupabase();

  let query = supabase
    .from("posts")
    .select("id, text, lat, lng, created_at, device_id", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    query = query.ilike("text", `%${q}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 各投稿のコメント数を取得
  const postIds = (data || []).map((p) => p.id);
  let commentCounts: Record<string, number> = {};

  if (postIds.length > 0) {
    const { data: comments } = await supabase
      .from("comments")
      .select("post_id")
      .in("post_id", postIds);

    if (comments) {
      for (const c of comments) {
        commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
      }
    }
  }

  const posts = (data || []).map((p) => ({
    ...p,
    comment_count: commentCounts[p.id] || 0,
  }));

  return NextResponse.json({ posts, total: count ?? 0 });
}
