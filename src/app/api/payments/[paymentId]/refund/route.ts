import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TOSS_SECRET_KEY } from "@/lib/toss";

type Params = { params: Promise<{ paymentId: string }> };

const REFUND_WINDOW_DAYS = 7; // 결제 후 7일 이내 환불 가능

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { paymentId } = await params;
  const { cancelReason = "고객 변심" } = await req.json().catch(() => ({}));

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      userId: true,
      status: true,
      amount: true,
      paidAt: true,
      tossPaymentKey: true,
      metadata: true,
    },
  });

  if (!payment) return NextResponse.json({ error: "결제를 찾을 수 없습니다." }, { status: 404 });
  if (payment.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (payment.status !== "PAID") return NextResponse.json({ error: "환불 가능한 결제가 아닙니다." }, { status: 400 });

  // 환불 기간 확인
  if (payment.paidAt) {
    const daysSincePaid = (Date.now() - payment.paidAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePaid > REFUND_WINDOW_DAYS) {
      return NextResponse.json(
        { error: `결제 후 ${REFUND_WINDOW_DAYS}일 이내에만 환불이 가능합니다.` },
        { status: 400 }
      );
    }
  }

  if (!payment.tossPaymentKey) {
    return NextResponse.json({ error: "결제 키 정보가 없습니다." }, { status: 400 });
  }

  // 1. Toss 환불 요청
  const basicToken = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");
  const tossRes = await fetch(
    `https://api.tosspayments.com/v1/payments/${payment.tossPaymentKey}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cancelReason }),
    }
  );

  if (!tossRes.ok) {
    const err = await tossRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: (err as { message?: string }).message ?? "환불 요청에 실패했습니다." },
      { status: 400 }
    );
  }

  // 2. DB 상태 업데이트
  await db.payment.update({
    where: { id: payment.id },
    data: { status: "CANCELLED" },
  });

  // 3. 멤버십 / 수강권 롤백
  const meta = payment.metadata as Record<string, string> | null;

  if (meta?.type === "community" && meta.communitySlug) {
    const community = await db.community.findUnique({
      where: { slug: meta.communitySlug },
      select: { id: true },
    });
    if (community) {
      await db.communityMember.updateMany({
        where: { communityId: community.id, userId: payment.userId },
        data: { isActive: false },
      });
      await db.community.update({
        where: { id: community.id },
        data: { memberCount: { decrement: 1 } },
      });
    }
  }

  if (meta?.type === "course" && meta.courseId) {
    const deleted = await db.enrollment.deleteMany({
      where: { courseId: meta.courseId, userId: payment.userId },
    });
    if (deleted.count > 0) {
      await db.course.update({
        where: { id: meta.courseId },
        data: { enrollCount: { decrement: 1 } },
      });
    }
  }

  // 4. 환불 알림
  await db.notification.create({
    data: {
      userId: payment.userId,
      type: "SYSTEM",
      title: "환불이 완료되었습니다",
      body: `${payment.amount.toLocaleString()}원이 환불 처리되었습니다.`,
    },
  });

  return NextResponse.json({ ok: true });
}
