import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/posts/[id]/comments?lat=...&lng=...&radius=500
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");
  const radius = parseFloat(searchParams.get("radius") || "500");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "lat と lng は必須です" },
      { status: 400 }
    );
  }

  const { data, error } = await getSupabase().rpc("nearby_comments", {
    target_post_id: id,
    user_lat: lat,
    user_lng: lng,
    radius_m: radius,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/posts/[id]/comments  body: { text, lat, lng }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { text, lat, lng } = body;

  if (!text || typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json(
      { error: "text, lat, lng は必須です" },
      { status: 400 }
    );
  }

  if (text.length > 300) {
    return NextResponse.json(
      { error: "コメントは300文字以内にしてください" },
      { status: 400 }
    );
  }

  const { data, error } = await getSupabase()
    .from("comments")
    .insert({ post_id: id, text, lat, lng })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
