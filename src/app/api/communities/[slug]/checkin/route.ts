import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { grantPoints } from "@/lib/gamification";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { slug: _rawSlug } = await params;
  const slug = decodeURIComponent(_rawSlug);
  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!community) {
    return NextResponse.json({ error: "커뮤니티를 찾을 수 없습니다." }, { status: 404 });
  }

  // 오늘 이미 체크인했는지 확인
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const existing = await db.pointTransaction.findFirst({
    where: {
      userId: session.user.id,
      communityId: community.id,
      type: "DAILY_CHECKIN",
      createdAt: { gte: todayStart },
    },
  });

  if (existing) {
    return NextResponse.json({ alreadyCheckedIn: true });
  }

  const result = await grantPoints({
    userId: session.user.id,
    communityId: community.id,
    type: "DAILY_CHECKIN",
  });

  return NextResponse.json({
    alreadyCheckedIn: false,
    points: result?.points ?? 1,
    leveledUp: result?.leveledUp ?? false,
    newLevel: result?.newLevel,
  });
}
