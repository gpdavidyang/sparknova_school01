import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

interface Props {
  params: Promise<{ slug: string; courseId: string }>;
}

export default async function CourseStudentsPage({ params }: Props) {
  const { slug: rawSlug, courseId } = await params;
  const slug = decodeURIComponent(rawSlug);

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true, name: true },
  });
  if (!community || community.ownerId !== session.user.id) notFound();

  const course = await db.course.findUnique({
    where: { id: courseId, communityId: community.id },
    include: {
      modules: { include: { lessons: { select: { id: true } } } },
    },
  });
  if (!course) notFound();

  const totalLessons = course.modules.flatMap((m) => m.lessons).length;

  const enrollments = await db.enrollment.findMany({
    where: { courseId },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const students = await Promise.all(
    enrollments.map(async (e) => {
      const completedCount = await db.lessonProgress.count({
        where: { userId: e.userId, isCompleted: true, lesson: { module: { courseId } } },
      });
      const hasCert = await db.certificate.findUnique({
        where: { courseId_userId: { courseId, userId: e.userId } },
        select: { id: true },
      });
      return {
        ...e,
        completedLessons: completedCount,
        totalLessons,
        progress: totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0,
        hasCertificate: !!hasCert,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/community/${slug}/admin?tab=courses`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />강좌 관리로 돌아가기
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center">
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <h1 className="font-bold">수강생 명단</h1>
            <p className="text-xs text-muted-foreground">{course.title} · 총 {students.length}명</p>
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="border rounded-xl p-8 text-center text-muted-foreground bg-card">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p>아직 수강생이 없습니다.</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">수강생</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">수강 신청일</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">진도</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">수료증</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0 overflow-hidden">
                        {s.user.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (s.user.name ?? s.user.email)[0]?.toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{s.user.name ?? "이름 없음"}</p>
                        <p className="text-xs text-muted-foreground">{s.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                    {new Date(s.enrolledAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {s.completedLessons}/{s.totalLessons} 레슨
                      </span>
                      <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${s.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{s.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {s.hasCertificate ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">수료</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
