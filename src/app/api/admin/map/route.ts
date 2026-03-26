import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/admin/map — 地図用: 全投稿の座標 + コメント数
export async function GET() {
  const supabase = getSupabase();

  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id, text, lat, lng, created_at");

  if (postsError) {
    return NextResponse.json({ error: postsError.message }, { status: 500 });
  }

  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select("post_id");

  if (commentsError) {
    return NextResponse.json({ error: commentsError.message }, { status: 500 });
  }

  const commentCounts: Record<string, number> = {};
  if (comments) {
    for (const c of comments) {
      commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
    }
  }

  const pins = (posts || []).map((p) => ({
    id: p.id,
    text: p.text,
    lat: p.lat,
    lng: p.lng,
    created_at: p.created_at,
    comment_count: commentCounts[p.id] || 0,
  }));

  return NextResponse.json(pins);
}
