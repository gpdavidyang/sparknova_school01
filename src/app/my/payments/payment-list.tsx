"use client";

import { useState } from "react";
import { BookOpen, Users } from "lucide-react";
import { RefundButton } from "@/components/payments/refund-button";

interface Payment {
  id: string;
  amount: number;
  status: string;
  method: string | null;
  paidAt: string | null;
  metadata: unknown;
  canRefund: boolean;
}

const statusLabel: Record<string, { text: string; color: string }> = {
  PAID:      { text: "결제 완료", color: "text-green-600" },
  PENDING:   { text: "처리 중",   color: "text-yellow-600" },
  FAILED:    { text: "실패",      color: "text-red-500" },
  REFUNDED:  { text: "환불",      color: "text-muted-foreground" },
  CANCELLED: { text: "취소/환불", color: "text-muted-foreground" },
};

const methodLabel: Record<string, string> = {
  카드: "카드", 가상계좌: "가상계좌", 간편결제: "간편결제", 휴대폰: "휴대폰",
};

export function PaymentList({ payments: initial }: { payments: Payment[] }) {
  const [payments, setPayments] = useState(initial);

  function markRefunded(id: string) {
    setPayments((prev) =>
      prev.map((p) => p.id === id ? { ...p, status: "CANCELLED", canRefund: false } : p)
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((p) => {
        const meta = p.metadata as Record<string, string> | null;
        const type = meta?.type ?? "";
        const orderName = meta?.orderName ?? "주문";
        const s = statusLabel[p.status] ?? { text: p.status, color: "text-muted-foreground" };

        return (
          <div key={p.id} className="border rounded-xl p-4 bg-card flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              {type === "course"
                ? <BookOpen className="h-5 w-5 text-blue-500" />
                : <Users className="h-5 w-5 text-blue-500" />
              }
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{orderName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {p.paidAt
                    ? new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "short", day: "numeric" }).format(new Date(p.paidAt))
                    : "—"}
                </span>
                {p.method && (
                  <span className="text-xs text-muted-foreground">· {methodLabel[p.method] ?? p.method}</span>
                )}
              </div>
            </div>

            <div className="text-right shrink-0 space-y-1">
              <p className="font-bold text-sm">{p.amount.toLocaleString()}원</p>
              <span className={`text-xs font-medium ${s.color}`}>{s.text}</span>
              {p.canRefund && (
                <div className="flex justify-end">
                  <RefundButton
                    paymentId={p.id}
                    amount={p.amount}
                    onRefunded={() => markRefunded(p.id)}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
