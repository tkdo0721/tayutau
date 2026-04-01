import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/admin/stats — 統計サマリー（アナリティクス付き）
export async function GET() {
  const supabase = getSupabase();

  const [
    postsRes,
    commentsRes,
    todayPostsRes,
    todayCommentsRes,
    postDevicesRes,
    commentDevicesRes,
    postsReachRes,
    postsViewRes,
    viewLogsRes,
  ] = await Promise.all([
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
    supabase.from("posts").select("device_id").not("device_id", "is", null),
    supabase.from("comments").select("device_id").not("device_id", "is", null),
    // 全投稿の reach_count 合計
    supabase.from("posts").select("reach_count"),
    // 全投稿の view_count 合計
    supabase.from("posts").select("view_count"),
    // 直近7日間の view_logs（時間帯別グラフ用）
    supabase
      .from("view_logs")
      .select("viewed_at, distance_type")
      .gte("viewed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  // ユニークdevice_idを集計
  const deviceSet = new Set<string>();
  postDevicesRes.data?.forEach((r: { device_id: string }) => deviceSet.add(r.device_id));
  commentDevicesRes.data?.forEach((r: { device_id: string }) => deviceSet.add(r.device_id));

  // reach / view の合計
  const totalReach = (postsReachRes.data || []).reduce(
    (sum: number, r: { reach_count: number }) => sum + (r.reach_count || 0),
    0
  );
  const totalView = (postsViewRes.data || []).reduce(
    (sum: number, r: { view_count: number }) => sum + (r.view_count || 0),
    0
  );

  // 時間帯別集計（直近7日間のview_logs）
  const byHour = new Array(24).fill(0);
  const byDay = new Array(7).fill(0);
  const now = Date.now();
  for (const log of viewLogsRes.data || []) {
    const d = new Date(log.viewed_at);
    byHour[d.getHours()]++;
    const daysAgo = Math.floor((now - d.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo >= 0 && daysAgo < 7) {
      byDay[6 - daysAgo]++;
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

  return NextResponse.json({
    totalPosts: postsRes.count ?? 0,
    totalComments: commentsRes.count ?? 0,
    todayPosts: todayPostsRes.count ?? 0,
    todayComments: todayCommentsRes.count ?? 0,
    totalUsers: deviceSet.size,
    totalReach,
    totalView,
    byHour,
    byDay,
    peakHour,
  });
}
