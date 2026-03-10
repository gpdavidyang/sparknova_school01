import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST: 쿠폰 코드 검증 + 할인 금액 계산
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, communityId, amount } = await req.json();
  if (!code || !communityId || amount == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });

  if (!coupon || coupon.communityId !== communityId) {
    return NextResponse.json({ error: "유효하지 않은 쿠폰 코드입니다." }, { status: 404 });
  }
  if (!coupon.isActive) {
    return NextResponse.json({ error: "비활성화된 쿠폰입니다." }, { status: 400 });
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: "만료된 쿠폰입니다." }, { status: 400 });
  }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: "소진된 쿠폰입니다." }, { status: 400 });
  }
  if (coupon.minAmount && amount < coupon.minAmount) {
    return NextResponse.json({
      error: `최소 결제 금액은 ${coupon.minAmount.toLocaleString()}원입니다.`,
    }, { status: 400 });
  }

  // 이미 사용한 쿠폰인지 확인
  const alreadyUsed = await db.couponUsage.findUnique({
    where: { couponId_userId: { couponId: coupon.id, userId: session.user.id } },
  });
  if (alreadyUsed) {
    return NextResponse.json({ error: "이미 사용한 쿠폰입니다." }, { status: 400 });
  }

  // 할인 금액 계산
  let discount: number;
  if (coupon.discountType === "PERCENTAGE") {
    discount = Math.floor(amount * (coupon.discountValue / 100));
  } else {
    discount = Math.min(coupon.discountValue, amount);
  }

  return NextResponse.json({
    valid: true,
    couponId: coupon.id,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discount,
    finalAmount: amount - discount,
    description: coupon.description,
  });
}
