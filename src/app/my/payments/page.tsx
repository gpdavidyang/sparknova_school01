import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Receipt, CreditCard, BookOpen, Users } from "lucide-react";

export default async function MyPaymentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const payments = await db.payment.findMany({
    where: { userId: session.user.id, status: "PAID" },
    orderBy: { paidAt: "desc" },
    take: 50,
  });

  const statusLabel: Record<string, string> = {
    PAID: "결제 완료",
    PENDING: "처리 중",
    FAILED: "실패",
    REFUNDED: "환불",
    CANCELLED: "취소",
  };

  const methodLabel: Record<string, string> = {
    카드: "카드",
    가상계좌: "가상계좌",
    간편결제: "간편결제",
    휴대폰: "휴대폰",
  };

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
        <div className="space-y-3">
          {payments.map((p) => {
            const meta = p.metadata as Record<string, string> | null;
            const type = meta?.type ?? "";
            const orderName = meta?.orderName ?? "주문";

            return (
              <div key={p.id} className="border rounded-xl p-4 bg-card flex items-center gap-4">
                {/* 아이콘 */}
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                  type === "course" ? "bg-blue-50" : "bg-blue-50"
                }`}>
                  {type === "course"
                    ? <BookOpen className="h-5 w-5 text-blue-500" />
                    : <Users className="h-5 w-5 text-blue-500" />
                  }
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{orderName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {p.paidAt
                        ? new Intl.DateTimeFormat("ko-KR", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }).format(p.paidAt)
                        : "-"}
                    </span>
                    {p.method && (
                      <span className="text-xs text-muted-foreground">
                        · {methodLabel[p.method] ?? p.method}
                      </span>
                    )}
                  </div>
                </div>

                {/* 금액 + 상태 */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm">{p.amount.toLocaleString()}원</p>
                  <span className="text-xs text-green-600 font-medium">
                    {statusLabel[p.status] ?? p.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
