import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST: 신고 접수
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { targetType, targetId, reason, detail } = await req.json();

  if (!targetType || !targetId || !reason) {
    return NextResponse.json({ error: "신고 사유를 선택해주세요." }, { status: 400 });
  }

  if (!["POST", "COMMENT"].includes(targetType)) {
    return NextResponse.json({ error: "잘못된 신고 대상입니다." }, { status: 400 });
  }

  // 중복 신고 방지
  const existing = await db.report.findFirst({
    where: { reporterId: session.user.id, targetType, targetId },
  });
  if (existing) {
    return NextResponse.json({ error: "이미 신고한 게시물입니다." }, { status: 409 });
  }

  await db.report.create({
    data: {
      reporterId: session.user.id,
      targetType,
      targetId,
      reason,
      detail: detail?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true });
}
