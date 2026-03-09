import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  LayoutDashboard, Users, BookOpen, TrendingUp,
  Plus, ArrowRight, DollarSign, Star,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // 내가 운영하는 커뮤니티
  const communities = await db.community.findMany({
    where: { ownerId: session.user.id },
    include: {
      _count: { select: { courses: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const communityIds = communities.map((c) => c.id);

  // 커뮤니티별 통계 한번에 조회
  const [memberStats, courseStats, paymentStats, levelStats] = await Promise.all([
    // 멤버 수 (communityId별)
    db.communityMember.groupBy({
      by: ["communityId"],
      where: { communityId: { in: communityIds }, isActive: true },
      _count: { _all: true },
    }),
    // 강좌별 수강자 수
    db.enrollment.groupBy({
      by: ["courseId"],
      where: { course: { communityId: { in: communityIds } } },
      _count: { _all: true },
    }),
    // 결제 수익 (communityId별)
    db.payment.findMany({
      where: {
        status: "PAID",
        metadata: { path: ["type"], equals: "community" },
      },
      select: { amount: true, metadata: true },
    }),
    // 총 포인트 분배 현황
    db.userLevel.aggregate({
      where: { communityId: { in: communityIds } },
      _sum: { points: true },
      _count: { _all: true },
    }),
  ]);

  // 강좌 목록 (수강자 수 포함)
  const courses = await db.course.findMany({
    where: { communityId: { in: communityIds } },
    include: { _count: { select: { enrollments: true, certificates: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // 커뮤니티별 멤버 수 맵
  const memberMap = new Map(memberStats.map((m) => [m.communityId, m._count._all]));

  // 수익 계산 (커뮤니티 구독)
  const communityRevenue = paymentStats
    .filter((p) => {
      const meta = p.metadata as Record<string, string> | null;
      return communityIds.some((id) => {
        // slug 기반이므로 간단히 amount 합산
        return meta?.type === "community";
      });
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const courseRevenue = await db.payment.aggregate({
    where: {
      status: "PAID",
      metadata: { path: ["type"], equals: "course" },
    },
    _sum: { amount: true },
  });

  const totalRevenue = communityRevenue + (courseRevenue._sum.amount ?? 0);

  // 전체 요약 통계
  const totalMembers = communities.reduce(
    (sum, c) => sum + (memberMap.get(c.id) ?? c.memberCount),
    0
  );
  const totalCourses = courses.length;
  const totalEnrollments = courseStats.reduce((sum, s) => sum + s._count._all, 0);

  const summaryCards = [
    { label: "총 멤버", value: totalMembers.toLocaleString(), icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "강좌", value: totalCourses.toLocaleString(), icon: BookOpen, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "수강 등록", value: totalEnrollments.toLocaleString(), icon: TrendingUp, color: "text-green-500", bg: "bg-green-50" },
    { label: "총 수익", value: `${totalRevenue.toLocaleString()}원`, icon: DollarSign, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">크리에이터 대시보드</h1>
            <p className="text-sm text-muted-foreground">{session.user.name}</p>
          </div>
        </div>
        <Link
          href="/community/new"
          className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
        >
          <Plus className="h-4 w-4 mr-1" />
          커뮤니티 만들기
        </Link>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="border rounded-xl p-4 bg-card space-y-3">
            <div className={`h-9 w-9 rounded-full ${bg} flex items-center justify-center`}>
              <Icon className={`h-4.5 w-4.5 ${color}`} />
            </div>
            <div>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 내 커뮤니티 목록 */}
      <div className="space-y-3">
        <h2 className="font-semibold">내 커뮤니티</h2>
        {communities.length === 0 ? (
          <div className="border rounded-xl p-8 text-center text-muted-foreground bg-card">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>아직 운영 중인 커뮤니티가 없습니다.</p>
            <Link
              href="/community/new"
              className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors mt-4"
            >
              첫 커뮤니티 만들기
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {communities.map((c) => {
              const members = memberMap.get(c.id) ?? c.memberCount;
              return (
                <div key={c.id} className="border rounded-xl p-4 bg-card flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-orange-100 overflow-hidden shrink-0 flex items-center justify-center text-lg font-bold text-orange-600">
                    {c.avatarUrl ? (
                      <img src={c.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      c.name[0]
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{c.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />{members.toLocaleString()}명
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />{c._count.courses}개 강좌
                      </span>
                      <span className={`font-medium ${c.joinType === "PAID" ? "text-orange-500" : "text-green-500"}`}>
                        {c.joinType === "PAID" ? `유료 ${c.price?.toLocaleString()}원` : "무료"}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/community/${c.slug}`}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 강좌 현황 */}
      {courses.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">강좌 현황</h2>
          <div className="border rounded-xl overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">강좌명</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">수강자</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">수료</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">완료율</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => {
                  const completionRate =
                    course._count.enrollments > 0
                      ? Math.round((course._count.certificates / course._count.enrollments) * 100)
                      : 0;
                  return (
                    <tr key={course.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full shrink-0 ${course.isFree ? "bg-green-400" : "bg-orange-400"}`} />
                          <span className="truncate max-w-[200px]">{course.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {course._count.enrollments.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {course._count.certificates.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <span className={`font-medium ${completionRate >= 50 ? "text-green-600" : "text-muted-foreground"}`}>
                          {completionRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 포인트/레벨 현황 */}
      {levelStats._count._all > 0 && (
        <div className="border rounded-xl p-4 bg-card flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
            <Star className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">커뮤니티 포인트 현황</p>
            <p className="text-xs text-muted-foreground">
              {levelStats._count._all}명이 총{" "}
              <span className="text-orange-600 font-semibold">
                {(levelStats._sum.points ?? 0).toLocaleString()}P
              </span>{" "}
              획득
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
