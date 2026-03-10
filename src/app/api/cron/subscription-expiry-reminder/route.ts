import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendSubscriptionExpiryEmail } from "@/lib/email";

// Vercel Cron: 매일 오전 9시 (0 9 * * *)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const d3Start = new Date(now);
  d3Start.setDate(d3Start.getDate() + 3);
  d3Start.setHours(0, 0, 0, 0);

  const d3End = new Date(d3Start);
  d3End.setHours(23, 59, 59, 999);

  // 3일 뒤 만료되는 활성 멤버십 조회
  const expiringMembers = await db.communityMember.findMany({
    where: {
      isActive: true,
      membershipExpiresAt: { gte: d3Start, lte: d3End },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      community: { select: { id: true, name: true, slug: true } },
    },
  });

  let sent = 0;

  for (const member of expiringMembers) {
    if (!member.user.email) continue;

    // 중복 알림 방지: 오늘 이미 보낸 경우 스킵
    const alreadySent = await db.notification.findFirst({
      where: {
        userId: member.user.id,
        type: "SYSTEM",
        referenceId: `sub_expiry_d3_${member.id}`,
      },
    });
    if (alreadySent) continue;

    // 알림 기록 생성
    await db.notification.create({
      data: {
        userId: member.user.id,
        communityId: member.community.id,
        type: "SYSTEM",
        title: "멤버십 만료 예정",
        body: `${member.community.name} 멤버십이 3일 후 만료됩니다.`,
        referenceId: `sub_expiry_d3_${member.id}`,
      },
    });

    // 이메일 발송
    const renewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/community/${member.community.slug}`;
    void sendSubscriptionExpiryEmail({
      to: member.user.email,
      name: member.user.name ?? "회원",
      communityName: member.community.name,
      expiresAt: member.membershipExpiresAt!,
      renewUrl,
    });

    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
