import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookOpen, CheckCircle2, Circle, Play, FileText, Clock, Pencil, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnrollButton } from "@/components/classroom/enroll-button";
import { CourseReviews } from "@/components/classroom/course-reviews";

function getYoutubeThumbnail(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
}

interface Props {
  params: Promise<{ slug: string; courseId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { courseId } = await params;
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { title: true, description: true, thumbnailUrl: true },
  });
  if (!course) return {};
  return {
    title: course.title,
    description: course.description ?? course.title,
    openGraph: {
      title: course.title,
      description: course.description ?? course.title,
      ...(course.thumbnailUrl ? { images: [{ url: course.thumbnailUrl }] } : {}),
    },
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug: rawSlug, courseId } = await params;
  const slug = decodeURIComponent(rawSlug);
  const session = await auth();

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });

  // 오너는 미발행 강좌도 볼 수 있도록 잠시 community ownerId 확인
  const communityForOwner = await db.community.findUnique({ where: { slug }, select: { ownerId: true } });
  const isOwnerCheck = session?.user?.id === communityForOwner?.ownerId;
  if (!course || (!course.isPublished && !isOwnerCheck)) notFound();

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

  // 리뷰 조회
  const reviews = await db.review.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;
  const myReview = session?.user?.id
    ? reviews.find((r) => r.user.id === session.user?.id) ?? null
    : null;

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
          {isOwner && (
            <Link
              href={`/community/${slug}/classroom/${courseId}/edit`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-lg hover:bg-muted transition-colors shrink-0"
            >
              <Pencil className="h-3.5 w-3.5" />수정
            </Link>
          )}
          {!course.isFree && course.price && (
            <Badge className="bg-blue-500 text-white border-0 text-base px-3 py-1">
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
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* 수강 신청 버튼 */}
        {!isOwner && (
          <EnrollButton
            courseId={courseId}
            isFree={course.isFree}
            enrolled={!!enrollment}
            isLoggedIn={!!session?.user?.id}
            courseSlug={`/community/${slug}/classroom/${courseId}`}
          />
        )}
      </div>

      {/* 커리큘럼 */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">커리큘럼</h2>
        {course.modules.map((mod, mi) => {
          // 드립피드: 수강 신청 후 N일 이전이면 잠김
          const isDripLocked = !isOwner && !!enrollment && !!mod.drip && mod.drip > 0 &&
            new Date() < new Date(enrollment.enrolledAt.getTime() + mod.drip * 24 * 60 * 60 * 1000);
          const unlockDate = isDripLocked && enrollment && mod.drip
            ? new Date(enrollment.enrolledAt.getTime() + mod.drip * 24 * 60 * 60 * 1000)
            : null;

          return (
          <div key={mod.id} className="border rounded-xl overflow-hidden">
            <div className="bg-muted/30 px-4 py-3 flex items-center justify-between">
              <h3 className="font-medium text-sm">
                {mi + 1}. {mod.title}
              </h3>
              <div className="flex items-center gap-2">
                {isDripLocked && unlockDate && (
                  <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
                    {new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(unlockDate)} 공개
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{mod.lessons.length}개 레슨</span>
              </div>
            </div>
            <div className="divide-y">
              {mod.lessons.map((lesson, li) => {
                const isCompleted = completedSet.has(lesson.id);
                // 강좌 자체가 무료면 모든 레슨 접근 가능 (수강 신청 없이도)
                const canAccess = !isDripLocked && (isOwner || !!enrollment || lesson.isFree || course.isFree);
                const thumb = lesson.type === "VIDEO" ? getYoutubeThumbnail(lesson.videoUrl) : null;
                const showThumb = canAccess && lesson.type === "VIDEO" && (thumb || lesson.videoUrl);
                const lessonHref = `/community/${slug}/classroom/${courseId}/lessons/${lesson.id}`;

                if (showThumb) {
                  // 썸네일 카드 형태
                  return (
                    <div key={lesson.id} className="p-3">
                      <Link href={lessonHref} className="group flex gap-3 rounded-lg overflow-hidden hover:bg-muted/40 transition-colors p-1 -m-1">
                        {/* 썸네일 */}
                        <div className="relative w-36 shrink-0 aspect-video rounded-lg overflow-hidden bg-muted">
                          {thumb ? (
                            <img src={thumb} alt={lesson.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-950/40 dark:to-blue-950/40 flex items-center justify-center">
                              <Play className="h-6 w-6 text-violet-400 opacity-60" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-8 w-8 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="h-4 w-4 text-white fill-white" />
                            </div>
                          </div>
                          {isCompleted && (
                            <div className="absolute top-1 right-1">
                              <CheckCircle2 className="h-4 w-4 text-green-400 drop-shadow" />
                            </div>
                          )}
                        </div>
                        {/* 텍스트 */}
                        <div className="flex-1 min-w-0 py-0.5 space-y-1">
                          <p className="text-sm font-medium line-clamp-2 leading-snug group-hover:text-blue-500 transition-colors">
                            {mi + 1}.{li + 1} {lesson.title}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {lesson.isFree && !enrollment && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0 text-violet-600 border-violet-300">미리보기</Badge>
                            )}
                            {lesson.duration && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />{Math.floor(lesson.duration / 60)}분
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                }

                // 일반 텍스트 행
                return (
                  <div key={lesson.id} className="flex items-center gap-3 px-4 py-3">
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : canAccess ? (
                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm">
                        {canAccess ? (
                          <Link href={lessonHref} className="hover:text-blue-500 transition-colors">
                            {mi + 1}.{li + 1} {lesson.title}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground/60">
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
          );
        })}
      </div>

      {/* 수강 후기 */}
      <div className="border-t pt-6">
        <CourseReviews
          courseId={courseId}
          initialReviews={reviews.map((r) => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
          }))}
          initialAvg={avgRating}
          initialTotal={reviews.length}
          isEnrolled={!!enrollment}
          currentUserId={session?.user?.id ?? null}
          myReview={myReview ? { ...myReview, createdAt: myReview.createdAt.toISOString() } : null}
        />
      </div>
    </div>
  );
}
