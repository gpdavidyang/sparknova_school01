/**
 * Toss Payments 서버사이드 유틸리티
 */

export const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY!;
export const TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

/**
 * Toss 결제 승인 요청
 */
export async function confirmTossPayment({
  paymentKey,
  orderId,
  amount,
}: {
  paymentKey: string;
  orderId: string;
  amount: number;
}) {
  const basicToken = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");

  const res = await fetch(TOSS_CONFIRM_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message ?? "결제 승인에 실패했습니다.");
  }

  return data as {
    paymentKey: string;
    orderId: string;
    orderName: string;
    status: string;
    approvedAt: string;
    method: string;
    totalAmount: number;
    currency: string;
  };
}

/**
 * orderId 생성: {prefix}_{timestamp}_{random}
 */
export function generateOrderId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
