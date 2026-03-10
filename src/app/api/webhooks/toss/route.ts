import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Toss Payments 웹훅
// Toss는 결제 상태 변경 시 이 엔드포인트를 호출합니다.
// 문서: https://docs.tosspayments.com/guides/webhook
export async function POST(req: NextRequest) {
  const secret = process.env.TOSS_WEBHOOK_SECRET;

  // 웹훅 시크릿 검증 (설정된 경우)
  if (secret) {
    const signature = req.headers.get("webhook-signature");
    if (signature !== secret) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { eventType, data } = body as {
    eventType: string;
    data: {
      paymentKey?: string;
      orderId?: string;
      status?: string;
      cancels?: { cancelAmount: number; canceledAt: string }[];
    };
  };

  if (!data?.orderId) {
    return NextResponse.json({ ok: true }); // 무시
  }

  try {
    switch (eventType) {
      case "PAYMENT_STATUS_CHANGED": {
        const { orderId, status } = data;

        if (status === "DONE") {
          // 결제 완료 — confirm API에서 이미 처리하지만 이중 보장
          await db.payment.updateMany({
            where: { tossOrderId: orderId, status: "PENDING" },
            data: { status: "PAID", paidAt: new Date() },
          });
        }

        if (status === "CANCELED") {
          const payment = await db.payment.findUnique({
            where: { tossOrderId: orderId },
            select: { id: true, userId: true, metadata: true },
          });

          if (payment) {
            await db.payment.update({
              where: { id: payment.id },
              data: { status: "CANCELLED" },
            });

            // 결제 타입에 따라 멤버십/수강권 취소
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
              await db.enrollment.deleteMany({
                where: { courseId: meta.courseId, userId: payment.userId },
              });
              await db.course.update({
                where: { id: meta.courseId },
                data: { enrollCount: { decrement: 1 } },
              });
            }
          }
        }
        break;
      }

      default:
        // 알 수 없는 이벤트 무시
        break;
    }
  } catch (err) {
    console.error("[toss-webhook]", err);
    // 웹훅은 항상 200 반환해야 Toss가 재시도하지 않음
  }

  return NextResponse.json({ ok: true });
}
