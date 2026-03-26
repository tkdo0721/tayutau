import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// DELETE /api/posts/[id]/comments/[commentId]  body: { device_id }
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { commentId } = await params;
  const body = await request.json();
  const { device_id } = body;

  if (!device_id) {
    return NextResponse.json(
      { error: "device_id は必須です" },
      { status: 400 }
    );
  }

  const { data, error } = await getSupabase()
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("device_id", device_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "削除できませんでした" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
