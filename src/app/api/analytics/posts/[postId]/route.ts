import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/posts/:postId?device_id=xxx
 *
 * 自分の投稿のアナリティクスを取得する。
 * device_id が投稿の device_id と一致しない場合は 403。
 *
 * レスポンス:
 * {
 *   post_id, reach: { total, unique }, view: { total, unique },
 *   conversion_rate, by_hour: number[24], by_day: number[], peak_hour
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("device_id");

  if (!deviceId) {
    return NextResponse.json(
      { error: "device_id は必須です" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // 投稿の所有者確認
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, device_id, reach_count, view_count, created_at")
    .eq("id", postId)
    .single();

  if (postError || !post) {
    return NextResponse.json(
      { error: "投稿が見つかりません" },
      { status: 404 }
    );
  }

  if (post.device_id !== deviceId) {
    return NextResponse.json(
      { error: "この投稿のアナリティクスを見る権限がありません" },
      { status: 403 }
    );
  }

  // view_logs からデータ取得
  const { data: logs } = await supabase
    .from("view_logs")
    .select("viewed_at, distance_type, is_revisit, device_id")
    .eq("post_id", postId)
    .order("viewed_at", { ascending: true });

  const allLogs = logs || [];

  // reach / view の集計
  const reachLogs = allLogs.filter((l) => l.distance_type === "reach");
  const viewLogs = allLogs.filter((l) => l.distance_type === "view");

  const reachTotal = reachLogs.length;
  const reachUnique = reachLogs.filter((l) => !l.is_revisit).length;
  const viewTotal = viewLogs.length;
  const viewUnique = viewLogs.filter((l) => !l.is_revisit).length;

  // 時間帯別集計（24時間）- view のみ
  const byHour = new Array(24).fill(0);
  for (const log of viewLogs) {
    const hour = new Date(log.viewed_at).getHours();
    byHour[hour]++;
  }

  // 日別集計（投稿からの経過日数）- view のみ
  const postDate = new Date(post.created_at);
  const now = new Date();
  const daysSincePost = Math.ceil(
    (now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const maxDays = Math.min(daysSincePost, 30); // 最大30日分
  const byDay = new Array(maxDays).fill(0);

  for (const log of viewLogs) {
    const logDate = new Date(log.viewed_at);
    const dayIndex = Math.floor(
      (logDate.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (dayIndex >= 0 && dayIndex < maxDays) {
      byDay[dayIndex]++;
    }
  }

  // ピーク時間帯
  let peakHour = 0;
  let peakCount = 0;
  byHour.forEach((count, hour) => {
    if (count > peakCount) {
      peakCount = count;
      peakHour = hour;
    }
  });

  // コンバージョン率（reach → view）
  const conversionRate =
    reachUnique > 0 ? Math.round((viewUnique / reachUnique) * 100) / 100 : 0;

  return NextResponse.json({
    post_id: postId,
    reach: { total: reachTotal, unique: reachUnique },
    view: { total: viewTotal, unique: viewUnique },
    conversion_rate: conversionRate,
    by_hour: byHour,
    by_day: byDay,
    peak_hour: peakHour,
  });
}
