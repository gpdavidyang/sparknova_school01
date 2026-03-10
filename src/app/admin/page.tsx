import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Users, BookOpen, Building2, CreditCard, TrendingUp, Flag, Package } from "lucide-react";

export default async function SuperAdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (me?.role !== "SUPER_ADMIN") redirect("/");

  const [
    totalUsers,
    totalCommunities,
    totalCourses,
    totalEnrollments,
    totalPayments,
    totalReports,
    totalDigitalProducts,
    recentUsers,
    recentPayments,
  ] = await Promise.all([
    db.user.count(),
    db.community.count(),
    db.course.count(),
    db.enrollment.count(),
    db.payment.aggregate({ _sum: { amount: true }, _count: true, where: { status: "PAID" } }),
    db.report.count({ where: { status: "PENDING" } }),
    db.digitalProduct.count(),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, email: true, createdAt: true, role: true },
    }),
    db.payment.findMany({
      where: { status: "PAID" },
      orderBy: { paidAt: "desc" },
      take: 10,
      select: { id: true, amount: true, orderName: true, paidAt: true, user: { select: { name: true, email: true } } },
    }),
  ]);

  const revenue = totalPayments._sum.amount ?? 0;
  const paymentCount = totalPayments._count;

  const stats = [
    { label: "전체 회원", value: totalUsers.toLocaleString(), icon: Users, color: "bg-blue-50 text-blue-500" },
    { label: "전체 커뮤니티", value: totalCommunities.toLocaleString(), icon: Building2, color: "bg-purple-50 text-purple-500" },
    { label: "전체 강좌", value: totalCourses.toLocaleString(), icon: BookOpen, color: "bg-green-50 text-green-500" },
    { label: "수강 등록", value: totalEnrollments.toLocaleString(), icon: TrendingUp, color: "bg-yellow-50 text-yellow-500" },
    { label: "총 결제 금액", value: `₩${revenue.toLocaleString()}`, icon: CreditCard, color: "bg-emerald-50 text-emerald-500" },
    { label: "결제 건수", value: paymentCount.toLocaleString(), icon: CreditCard, color: "bg-teal-50 text-teal-500" },
    { label: "처리 대기 신고", value: totalReports.toLocaleString(), icon: Flag, color: "bg-red-50 text-red-500" },
    { label: "디지털 상품", value: totalDigitalProducts.toLocaleString(), icon: Package, color: "bg-orange-50 text-orange-500" },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">슈퍼 어드민 대시보드</h1>
        <p className="text-muted-foreground text-sm mt-1">플랫폼 전체 현황을 한눈에 확인하세요.</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="border rounded-xl p-4 bg-card space-y-3">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 최근 가입 회원 */}
        <div className="border rounded-xl bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h2 className="font-semibold text-sm">최근 가입 회원</h2>
          </div>
          <div className="divide-y">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                  {(u.name ?? u.email)[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.name ?? "이름 없음"}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <div className="text-right shrink-0">
                  {u.role === "SUPER_ADMIN" && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">SA</span>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 결제 */}
        <div className="border rounded-xl bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h2 className="font-semibold text-sm">최근 결제</h2>
          </div>
          <div className="divide-y">
            {recentPayments.length === 0 ? (
              <p className="px-4 py-8 text-sm text-muted-foreground text-center">결제 내역이 없습니다.</p>
            ) : (
              recentPayments.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <CreditCard className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.orderName}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.user.name ?? p.user.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-green-600">₩{p.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString("ko-KR") : "-"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
