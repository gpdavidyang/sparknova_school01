import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/referral/earnings — 추천 수익 현황
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // 내 추천 코드 전체
  const codes = await db.referralCode.findMany({
    where: { userId },
    select: { id: true },
  });
  const codeIds = codes.map((c) => c.id);

  // 전환된 추천 건수
  const convertedRecords = await db.referralRecord.findMany({
    where: { codeId: { in: codeIds }, status: "CONVERTED" },
    include: {
      referred: { select: { name: true, email: true, createdAt: true } },
    },
    orderBy: { convertedAt: "desc" },
  });

  // CASH 타입 보상 합계
  const cashRewards = await db.referralReward.findMany({
    where: { userId, type: "CASH" },
  });
  const totalEarned = cashRewards.reduce((sum, r) => sum + r.value, 0);
  const grantedAmount = cashRewards.filter((r) => r.status === "GRANTED").reduce((sum, r) => sum + r.value, 0);
  const pendingAmount = cashRewards.filter((r) => r.status === "PENDING").reduce((sum, r) => sum + r.value, 0);

  // 출금 내역
  const payouts = await db.referralPayout.findMany({
    where: { userId },
    orderBy: { requestedAt: "desc" },
  });
  const paidOutAmount = payouts
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  // 출금 가능 잔액 = 지급된 보상 - 이미 출금한 금액
  const availableBalance = grantedAmount - paidOutAmount;

  return NextResponse.json({
    totalEarned,
    grantedAmount,
    pendingAmount,
    paidOutAmount,
    availableBalance,
    convertedCount: convertedRecords.length,
    recentConversions: convertedRecords.slice(0, 20).map((r) => ({
      id: r.id,
      referredName: r.referred.name,
      referredEmail: r.referred.email,
      convertedAt: r.convertedAt,
    })),
    payouts: payouts.map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      bankName: p.bankName,
      requestedAt: p.requestedAt,
      processedAt: p.processedAt,
      note: p.note,
    })),
  });
}
