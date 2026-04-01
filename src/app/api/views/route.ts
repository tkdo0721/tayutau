import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/views
 * body: { post_id, device_id, distance_type: "reach" | "view" }
 *
 * フロント側でGPS距離を計算し、reach（500m以内）or view（50m以内）を判定して呼ぶ。
 * 同一device_idが24時間以内に同じpost_id+distance_typeでアクセスした場合は
 * is_revisit=true でログ記録し、カウントはインクリメントしない（ユニーク計測）。
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { post_id, device_id, distance_type } = body;

  if (!post_id || !device_id || !distance_type) {
    return NextResponse.json(
      { error: "post_id, device_id, distance_type は必須です" },
      { status: 400 }
    );
  }

  if (distance_type !== "reach" && distance_type !== "view") {
    return NextResponse.json(
      { error: "distance_type は reach または view のみ" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // 24時間以内の同一デバイス・同一投稿・同一タイプのログをチェック
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: recentView } = await supabase
    .from("view_logs")
    .select("id")
    .eq("post_id", post_id)
    .eq("device_id", device_id)
    .eq("distance_type", distance_type)
    .gte("viewed_at", twentyFourHoursAgo)
    .limit(1)
    .maybeSingle();

  const isRevisit = !!recentView;

  // ユニーク閲覧の場合のみカウントをインクリメント
  if (!isRevisit) {
    const rpcName =
      distance_type === "reach"
        ? "increment_reach_count"
        : "increment_view_count";
    await supabase.rpc(rpcName, { target_post_id: post_id });
  }

  // ログは常に記録
  await supabase.from("view_logs").insert({
    post_id,
    device_id,
    distance_type,
    is_revisit: isRevisit,
  });

  return NextResponse.json({ recorded: true, is_revisit: isRevisit });
}
