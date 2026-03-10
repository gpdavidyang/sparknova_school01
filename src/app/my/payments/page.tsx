import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Receipt, CreditCard } from "lucide-react";
import { PaymentList } from "./payment-list";

export default async function MyPaymentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const payments = await db.payment.findMany({
    where: { userId: session.user.id, status: { in: ["PAID", "CANCELLED"] } },
    orderBy: { paidAt: "desc" },
    take: 50,
    select: {
      id: true,
      amount: true,
      status: true,
      method: true,
      paidAt: true,
      metadata: true,
    },
  });

  const REFUND_WINDOW_DAYS = 7;
  const now = Date.now();

  const enriched = payments.map((p) => ({
    ...p,
    paidAt: p.paidAt?.toISOString() ?? null,
    canRefund:
      p.status === "PAID" &&
      !!p.paidAt &&
      now - p.paidAt.getTime() < REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  }));

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
          <Receipt className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold">결제 내역</h1>
          <p className="text-sm text-muted-foreground">총 {payments.length}건</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>결제 내역이 없습니다.</p>
        </div>
      ) : (
        <PaymentList payments={enriched} />
      )}
    </div>
  );
}

