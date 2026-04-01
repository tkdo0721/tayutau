import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/mypage/posts?device_id=xxx
 *
 * 自分の投稿一覧を取得（reach_count, view_count 付き）。
 * 新しい順にソート。
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("device_id");

  if (!deviceId) {
    return NextResponse.json(
      { error: "device_id は必須です" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("posts")
    .select("id, text, lat, lng, created_at, reach_count, view_count")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
