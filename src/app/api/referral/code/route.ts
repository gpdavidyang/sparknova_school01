import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";

// GET /api/referral/code — 내 추천 코드 조회 (없으면 생성)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let code = await db.referralCode.findFirst({
    where: { userId: session.user.id, communityId: null, isActive: true },
    include: {
      records: {
        where: { status: "CONVERTED" },
        select: { id: true },
      },
    },
  });

  if (!code) {
    code = await db.referralCode.create({
      data: {
        code: nanoid(8).toUpperCase(),
        userId: session.user.id,
      },
      include: { records: { where: { status: "CONVERTED" }, select: { id: true } } },
    });
  }

  const stats = await db.referralRecord.groupBy({
    by: ["status"],
    where: { codeId: code.id },
    _count: true,
  });

  return NextResponse.json({
    code: code.code,
    shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}?ref=${code.code}`,
    clickCount: code.clickCount,
    useCount: code.useCount,
    convertedCount: code.records.length,
    stats,
  });
}
