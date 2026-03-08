import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookOpen, CheckCircle2, Circle, Play, FileText, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnrollButton } from "@/components/classroom/enroll-button";

interface Props {
  params: Promise<{ slug: string; courseId: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug, courseId } = await params;
  const session = await auth();

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        where: { isPublished: true },
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course || !course.isPublished) notFound();

  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });
  if (!community) notFound();

  const isOwner = session?.user?.id === community.ownerId;

  const enrollment = session?.user?.id
    ? await db.enrollment.findUnique({
        where: { courseId_userId: { courseId, userId: session.user.id } },
      })
    : null;

  // 완료한 레슨 목록
  const allLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const completedLessons = session?.user?.id && enrollment
    ? await db.lessonProgress.findMany({
        where: { userId: session.user.id, lessonId: { in: allLessonIds }, isCompleted: true },
        select: { lessonId: true },
      })
    : [];
  const completedSet = new Set(completedLessons.map((p) => p.lessonId));

  const totalLessons = allLessonIds.length;
  const completedCount = completedLessons.length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 강좌 헤더 */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{course.title}</h1>
            {course.description && (
              <p className="text-muted-foreground mt-2">{course.description}</p>
            )}
          </div>
          {!course.isFree && course.price && (
            <Badge className="bg-orange-500 text-white border-0 text-base px-3 py-1">
              ₩{course.price.toLocaleString()}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {totalLessons}개 레슨
          </span>
          <span className="flex items-center gap-1">
            {course._count.enrollments.toLocaleString()}명 수강 중
          </span>
          {course.isFree ? (
            <Badge variant="secondary" className="text-green-600 bg-green-50">무료</Badge>
          ) : (
            <Badge variant="secondary">유료</Badge>
          )}
        </div>

        {/* 진도 바 */}
        {enrollment && totalLessons > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>수강 진도</span>
              <span>{completedCount}/{totalLessons} 레슨 완료</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all"
                style={{ width: `${totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* 수강 신청 버튼 */}
        {!isOwner && (
          <EnrollButton courseId={courseId} isFree={course.isFree} enrolled={!!enrollment} />
        )}
      </div>

      {/* 커리큘럼 */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">커리큘럼</h2>
        {course.modules.map((mod, mi) => (
          <div key={mod.id} className="border rounded-xl overflow-hidden">
            <div className="bg-muted/30 px-4 py-3 flex items-center justify-between">
              <h3 className="font-medium text-sm">
                {mi + 1}. {mod.title}
              </h3>
              <span className="text-xs text-muted-foreground">{mod.lessons.length}개 레슨</span>
            </div>
            <div className="divide-y">
              {mod.lessons.map((lesson, li) => {
                const isCompleted = completedSet.has(lesson.id);
                const canAccess = isOwner || !!enrollment || lesson.isFree;
                return (
                  <div key={lesson.id} className="flex items-center gap-3 px-4 py-3">
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm">
                        {canAccess ? (
                          <Link
                            href={`/community/${slug}/classroom/${courseId}/lessons/${lesson.id}`}
                            className="hover:text-orange-500 transition-colors"
                          >
                            {mi + 1}.{li + 1} {lesson.title}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">
                            {mi + 1}.{li + 1} {lesson.title}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {lesson.type === "VIDEO" ? (
                        <Play className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      {lesson.duration && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.floor(lesson.duration / 60)}분
                        </span>
                      )}
                      {lesson.isFree && !enrollment && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">미리보기</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
