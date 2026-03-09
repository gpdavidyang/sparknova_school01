import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { grantPoints } from "@/lib/gamification";
import { checkAndGrantReferralBadges } from "@/lib/badges";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password || password.length < 6) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "이미 사용 중인 이메일입니다." }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      name,
      email,
      accounts: {
        create: {
          type: "credentials",
          provider: "credentials",
          providerAccountId: email,
          access_token: hashed,
        },
      },
    },
  });

  // 추천 코드 처리 (쿠키에서 읽기)
  const refCode = req.cookies.get("ref_code")?.value;
  if (refCode) {
    const referralCode = await db.referralCode.findUnique({
      where: { code: refCode, isActive: true },
      select: { id: true, userId: true, communityId: true },
    });

    if (referralCode && referralCode.userId !== user.id) {
      // 추천 기록 생성
      const record = await db.referralRecord.create({
        data: {
          codeId: referralCode.id,
          referrerId: referralCode.userId,
          referredId: user.id,
          status: "CONVERTED",
          convertedAt: new Date(),
        },
      });

      // 코드 사용 횟수 증가
      await db.referralCode.update({
        where: { id: referralCode.id },
        data: { useCount: { increment: 1 } },
      });

      // 추천인 포인트 지급 (커뮤니티가 있으면 해당 커뮤니티, 없으면 첫 커뮤니티)
      const communityId =
        referralCode.communityId ??
        (
          await db.communityMember.findFirst({
            where: { userId: referralCode.userId },
            select: { communityId: true },
            orderBy: { joinedAt: "asc" },
          })
        )?.communityId;

      if (communityId) {
        await grantPoints({
          userId: referralCode.userId,
          communityId,
          type: "REFERRAL_SUCCESS",
          referenceId: record.id,
        });
        void checkAndGrantReferralBadges({ userId: referralCode.userId, communityId });
      }
    }
  }

  return NextResponse.json({ id: user.id }, { status: 201 });
}
