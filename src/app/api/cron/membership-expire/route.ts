import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Vercel Cron: 매일 자정 실행 (vercel.json 참고)
// 수동 테스트: GET /api/cron/membership-expire?secret=CRON_SECRET
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // 만료 기한이 지났으나 아직 isActive인 멤버십 조회
  const expired = await db.communityMember.findMany({
    where: {
      isActive: true,
      expiresAt: { lt: now },
      role: { not: "OWNER" }, // 오너는 만료 처리 안 함
    },
    select: { id: true, userId: true, communityId: true, community: { select: { name: true } } },
  });

  if (expired.length === 0) {
    return NextResponse.json({ ok: true, expired: 0 });
  }

  // 일괄 만료 처리
  await db.communityMember.updateMany({
    where: { id: { in: expired.map((m) => m.id) } },
    data: { isActive: false },
  });

  // 커뮤니티별 memberCount 감소
  const communityGrouped = expired.reduce<Record<string, number>>((acc, m) => {
    acc[m.communityId] = (acc[m.communityId] ?? 0) + 1;
    return acc;
  }, {});

  await Promise.all(
    Object.entries(communityGrouped).map(([communityId, count]) =>
      db.community.update({
        where: { id: communityId },
        data: { memberCount: { decrement: count } },
      })
    )
  );

  // 만료 알림 발송
  await db.notification.createMany({
    data: expired.map((m) => ({
      userId: m.userId,
      type: "SYSTEM" as const,
      title: "멤버십이 만료되었습니다",
      body: `${m.community.name} 멤버십이 만료되었습니다. 계속 이용하려면 멤버십을 갱신해주세요.`,
      referenceId: m.communityId,
      referenceType: "community",
    })),
    skipDuplicates: true,
  });

  console.log(`[cron/membership-expire] ${expired.length}건 만료 처리`);
  return NextResponse.json({ ok: true, expired: expired.length });
}
