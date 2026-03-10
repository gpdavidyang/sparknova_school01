import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/referral/payout — 출금 요청
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, bankName, accountNo, holderName } = await req.json();

  if (!amount || amount < 10000) {
    return NextResponse.json({ error: "최소 출금 금액은 10,000원입니다." }, { status: 400 });
  }
  if (!bankName || !accountNo || !holderName) {
    return NextResponse.json({ error: "계좌 정보를 입력해주세요." }, { status: 400 });
  }

  // 출금 가능 잔액 계산
  const cashRewards = await db.referralReward.findMany({
    where: { userId: session.user.id, type: "CASH", status: "GRANTED" },
  });
  const grantedAmount = cashRewards.reduce((sum, r) => sum + r.value, 0);

  const payouts = await db.referralPayout.findMany({
    where: { userId: session.user.id, status: { in: ["PENDING", "PROCESSING", "COMPLETED"] } },
  });
  const usedAmount = payouts.reduce((sum, p) => sum + p.amount, 0);
  const availableBalance = grantedAmount - usedAmount;

  if (amount > availableBalance) {
    return NextResponse.json({ error: "잔액이 부족합니다." }, { status: 400 });
  }

  // 이미 대기 중인 출금 요청이 있는지 확인
  const pendingPayout = await db.referralPayout.findFirst({
    where: { userId: session.user.id, status: "PENDING" },
  });
  if (pendingPayout) {
    return NextResponse.json({ error: "이미 대기 중인 출금 요청이 있습니다." }, { status: 400 });
  }

  const payout = await db.referralPayout.create({
    data: {
      userId: session.user.id,
      amount,
      bankName,
      accountNo,
      holderName,
    },
  });

  return NextResponse.json(payout, { status: 201 });
}
