import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/admin/auth — パスワード検証
export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const correct = process.env.ADMIN_PASSWORD;

  if (!correct) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD が設定されていません" },
      { status: 500 }
    );
  }

  if (password !== correct) {
    return NextResponse.json(
      { error: "パスワードが違います" },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
