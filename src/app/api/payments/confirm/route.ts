import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { confirmTossPayment } from "@/lib/toss";
import { notifyPaymentSuccess } from "@/lib/solapi";
import { sendPaymentReceiptEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json();
  const { paymentKey, orderId, amount, type, courseId, communitySlug, couponId } = body;

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.json({ error: "필수 파라미터가 누락되었습니다." }, { status: 400 });
  }

  // 1. Toss 결제 승인
  let tossData;
  try {
    tossData = await confirmTossPayment({ paymentKey, orderId, amount });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "결제 승인 실패";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // 2. DB 저장
  try {
    if (type === "course" && courseId) {
      // 강좌 단건 결제
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { id: true, communityId: true, price: true },
      });
      if (!course) {
        return NextResponse.json({ error: "강좌를 찾을 수 없습니다." }, { status: 404 });
      }

      // Payment 기록
      await db.payment.create({
        data: {
          userId: session.user.id,
          amount,
          status: "PAID",
          method: tossData.method,
          tossOrderId: orderId,
          tossPaymentKey: paymentKey,
          paidAt: new Date(tossData.approvedAt),
          metadata: { type: "course", courseId, orderName: tossData.orderName },
        },
      });

      // 수강 등록
      await db.enrollment.upsert({
        where: { courseId_userId: { courseId, userId: session.user.id } },
        create: { courseId, userId: session.user.id },
        update: {},
      });

      // 수강자 수 증가
      await db.course.update({
        where: { id: courseId },
        data: { enrollCount: { increment: 1 } },
      });

      // 카카오 알림톡 (전화번호 있는 경우)
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, emailNotifPayments: true },
      });
      if (user?.name) {
        void notifyPaymentSuccess({ phone: "", userName: user.name, orderName: tossData.orderName, amount });
      }
      if (user?.email && user.emailNotifPayments) {
        void sendPaymentReceiptEmail({
          to: user.email,
          name: user.name ?? "회원",
          orderName: tossData.orderName,
          amount,
          paidAt: new Date(tossData.approvedAt),
        });
      }

      // 쿠폰 사용 기록
      if (couponId) {
        const coupon = await db.coupon.findUnique({ where: { id: couponId } });
        if (coupon) {
          const originalPrice = course.price ?? 0;
          const discount = originalPrice - amount;
          await db.couponUsage.create({
            data: { couponId, userId: session.user.id, discount: discount > 0 ? discount : 0 },
          });
          await db.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
        }
      }

      return NextResponse.json({ ok: true, type: "course", courseId });
    }

    if (type === "community" && communitySlug) {
      // 커뮤니티 구독 결제
      const community = await db.community.findUnique({
        where: { slug: communitySlug },
        select: { id: true },
      });
      if (!community) {
        return NextResponse.json({ error: "커뮤니티를 찾을 수 없습니다." }, { status: 404 });
      }

      // Payment 기록
      await db.payment.create({
        data: {
          userId: session.user.id,
          amount,
          status: "PAID",
          method: tossData.method,
          tossOrderId: orderId,
          tossPaymentKey: paymentKey,
          paidAt: new Date(tossData.approvedAt),
          metadata: { type: "community", communitySlug, orderName: tossData.orderName },
        },
      });

      // 멤버십 등록 (30일)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await db.communityMember.upsert({
        where: {
          communityId_userId: { communityId: community.id, userId: session.user.id },
        },
        create: {
          communityId: community.id,
          userId: session.user.id,
          role: "MEMBER",
          expiresAt,
        },
        update: { isActive: true, expiresAt },
      });

      // 멤버 수 증가
      await db.community.update({
        where: { id: community.id },
        data: { memberCount: { increment: 1 } },
      });

      // 카카오 알림톡
      const commUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, emailNotifPayments: true },
      });
      if (commUser?.name) {
        void notifyPaymentSuccess({ phone: "", userName: commUser.name, orderName: tossData.orderName, amount });
      }
      if (commUser?.email && commUser.emailNotifPayments) {
        void sendPaymentReceiptEmail({
          to: commUser.email,
          name: commUser.name ?? "회원",
          orderName: tossData.orderName,
          amount,
          paidAt: new Date(tossData.approvedAt),
        });
      }

      // 쿠폰 사용 기록
      if (couponId) {
        const coupon = await db.coupon.findUnique({ where: { id: couponId } });
        if (coupon) {
          const originalPrice = (await db.community.findUnique({ where: { slug: communitySlug }, select: { price: true } }))?.price ?? 0;
          const discount = originalPrice - amount;
          await db.couponUsage.create({
            data: { couponId, userId: session.user.id, discount: discount > 0 ? discount : 0 },
          });
          await db.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
        }
      }

      return NextResponse.json({ ok: true, type: "community", communitySlug });
    }

    if (type === "digital" && body.digitalProductId) {
      const { digitalProductId } = body;

      const product = await db.digitalProduct.findUnique({
        where: { id: digitalProductId, isPublished: true },
        select: { id: true, price: true },
      });
      if (!product) return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });

      const payment = await db.payment.create({
        data: {
          userId: session.user.id,
          amount,
          status: "PAID",
          method: tossData.method,
          tossOrderId: orderId,
          tossPaymentKey: paymentKey,
          paidAt: new Date(tossData.approvedAt),
          metadata: { type: "digital", digitalProductId, orderName: tossData.orderName },
        },
      });

      await db.digitalPurchase.upsert({
        where: { productId_userId: { productId: digitalProductId, userId: session.user.id } },
        create: { productId: digitalProductId, userId: session.user.id, paymentId: payment.id },
        update: {},
      });

      await db.digitalProduct.update({
        where: { id: digitalProductId },
        data: { sellCount: { increment: 1 } },
      });

      const digUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, emailNotifPayments: true },
      });
      if (digUser?.email && digUser.emailNotifPayments) {
        void sendPaymentReceiptEmail({
          to: digUser.email,
          name: digUser.name ?? "회원",
          orderName: tossData.orderName,
          amount,
          paidAt: new Date(tossData.approvedAt),
        });
      }

      return NextResponse.json({ ok: true, type: "digital", digitalProductId });
    }

    return NextResponse.json({ error: "잘못된 결제 타입입니다." }, { status: 400 });
  } catch (err) {
    // 쿠폰 사용 처리는 결제 성공 후 별도로 진행하지 않음 (아래 finally에서 처리하지 않음)
    console.error("Payment confirm error:", err);
    return NextResponse.json({ error: "결제 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
