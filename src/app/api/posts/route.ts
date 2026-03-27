import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { moderateText } from "@/lib/moderation";

export const dynamic = "force-dynamic";

// GET /api/posts?lat=...&lng=...&radius=500
export async function GET(request: NextRequest) {
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

  const { data, error } = await getSupabase().rpc("nearby_posts", {
    user_lat: lat,
    user_lng: lng,
    radius_m: radius,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/posts  body: { text, lat, lng }
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { text, lat, lng, device_id } = body;

  if (!text || typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json(
      { error: "text, lat, lng は必須です" },
      { status: 400 }
    );
  }

  const moderation = moderateText(text);
  if (!moderation.ok) {
    return NextResponse.json(
      { error: moderation.reason },
      { status: 400 }
    );
  }

  if (text.length > 200) {
    return NextResponse.json(
      { error: "投稿は200文字以内にしてください" },
      { status: 400 }
    );
  }

  const { data, error } = await getSupabase()
    .from("posts")
    .insert({ text, lat, lng, device_id: device_id || null })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
