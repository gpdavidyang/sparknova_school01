import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronLeft, ChevronRight, CheckCircle2, List, Lock, Zap, ArrowRight } from "lucide-react";
import { LessonCompleteButton } from "@/components/classroom/lesson-complete-button";

interface Props {
  params: Promise<{ slug: string; courseId: string; lessonId: string }>;
}

function getEmbedUrl(url: string) {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
}

export default async function LessonPage({ params }: Props) {
  const { slug: rawSlug, courseId, lessonId } = await params;
  const slug = decodeURIComponent(rawSlug);
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: {
            include: {
              modules: {
                orderBy: { order: "asc" },
                include: {
                  lessons: {
                    orderBy: { order: "asc" },
                    select: { id: true, title: true, isFree: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!lesson) notFound();

  const community = await db.community.findUnique({
    where: { slug },
    select: { ownerId: true },
  });
  const isOwner = community?.ownerId === session?.user?.id;

  const enrollment = isLoggedIn
    ? await db.enrollment.findUnique({
        where: { courseId_userId: { courseId, userId: session!.user!.id } },
      })
    : null;

  // 접근 제어: 오너 > 수강자 > 무료 레슨 > 무료 강좌 > 차단
  const courseIsFree = lesson.module.course.isFree ?? false;
  if (!isOwner && !enrollment && !lesson.isFree && !courseIsFree) {
    redirect(`/community/${slug}/classroom/${courseId}`);
  }

  // 진도 (로그인+수강 상태만)
  const canTrack = isLoggedIn && (!!enrollment || isOwner);
  const lessonProgress = canTrack
    ? await db.lessonProgress.findUnique({
        where: { lessonId_userId: { lessonId, userId: session!.user!.id } },
      })
    : null;
  const isCompleted = lessonProgress?.isCompleted ?? false;

  // 이전/다음 레슨
  const allLessons = lesson.module.course.modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // 비로그인 상태에서 이전/다음은 free 레슨만 이동 가능
  const prevAccessible = prevLesson && (canTrack || prevLesson.isFree) ? prevLesson : null;
  const nextAccessible = nextLesson && (canTrack || nextLesson.isFree) ? nextLesson : null;

  return (
    <div className="flex gap-6 max-w-6xl mx-auto">
      {/* 레슨 내용 */}
      <div className="flex-1 min-w-0 space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/community/${slug}/classroom/${courseId}`} className="hover:text-foreground transition-colors">
            {lesson.module.course.title}
          </Link>
          <span>/</span>
          <span>{lesson.module.title}</span>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-bold">{lesson.title}</h1>
            {isCompleted && (
              <span className="flex items-center gap-1 text-green-500 text-sm font-medium shrink-0">
                <CheckCircle2 className="h-4 w-4" />완료
              </span>
            )}
          </div>

          {/* 비디오 */}
          {lesson.type === "VIDEO" && lesson.videoUrl && (
            <div className="aspect-video rounded-xl overflow-hidden bg-black">
              <iframe
                src={getEmbedUrl(lesson.videoUrl)}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )}

          {/* 텍스트 내용 */}
          {lesson.content && (
            <div className="prose prose-sm max-w-none bg-muted/30 rounded-xl p-6">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{lesson.content}</div>
            </div>
          )}
        </div>

        {/* 비로그인 사용자 회원가입 CTA */}
        {!isLoggedIn && (
          <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800">
            <div className="bg-gradient-to-r from-blue-500 to-violet-500 px-6 py-4 flex items-center gap-3">
              <Zap className="h-5 w-5 text-white" fill="currentColor" />
              <p className="text-white font-semibold">이 강의가 도움이 되셨나요?</p>
            </div>
            <div className="bg-blue-50/50 dark:bg-blue-950/20 px-6 py-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                회원가입하면 전체 커리큘럼을 수강하고, 학습 진도를 저장하고, 수료증도 받을 수 있어요.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/signup?next=/community/${slug}/classroom/${courseId}/lessons/${lessonId}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors shadow-sm"
                >
                  무료로 가입하기 <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/login?next=/community/${slug}/classroom/${courseId}/lessons/${lessonId}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border rounded-lg hover:bg-muted transition-colors"
                >
                  이미 계정이 있어요
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 완료 버튼 + 네비게이션 */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {prevAccessible ? (
              <Link
                href={`/community/${slug}/classroom/${courseId}/lessons/${prevAccessible.id}`}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                {prevAccessible.title}
              </Link>
            ) : <span />}
          </div>

          {canTrack ? (
            <LessonCompleteButton
              lessonId={lessonId}
              isCompleted={isCompleted}
              nextLessonHref={nextLesson ? `/community/${slug}/classroom/${courseId}/lessons/${nextLesson.id}` : `/community/${slug}/classroom/${courseId}`}
            />
          ) : (
            <span />
          )}

          <div>
            {nextAccessible ? (
              <Link
                href={`/community/${slug}/classroom/${courseId}/lessons/${nextAccessible.id}`}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {nextAccessible.title}
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : <span />}
          </div>
        </div>
      </div>

      {/* 사이드 커리큘럼 */}
      <div className="w-64 shrink-0 hidden lg:block">
        <div className="sticky top-20 border rounded-xl overflow-hidden">
          <div className="bg-muted/30 px-4 py-3 flex items-center gap-2">
            <List className="h-4 w-4" />
            <span className="text-sm font-medium">커리큘럼</span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {lesson.module.course.modules.map((mod) => (
              <div key={mod.id}>
                <div className="px-4 py-2 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {mod.title}
                </div>
                {mod.lessons.map((l) => {
                  const accessible = canTrack || l.isFree || courseIsFree;
                  const isCurrent = l.id === lessonId;
                  return accessible ? (
                    <Link
                      key={l.id}
                      href={`/community/${slug}/classroom/${courseId}/lessons/${l.id}`}
                      className={`flex items-center gap-2 px-4 py-2.5 text-xs transition-colors hover:bg-muted/50 ${isCurrent ? "bg-blue-50 text-blue-600 font-medium" : "text-muted-foreground"}`}
                    >
                      <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${isCurrent ? "bg-blue-500" : "bg-muted-foreground/30"}`} />
                      <span className="flex-1 line-clamp-1">{l.title}</span>
                      {l.isFree && !canTrack && (
                        <span className="text-[10px] text-violet-500 font-medium shrink-0">무료</span>
                      )}
                    </Link>
                  ) : (
                    <div
                      key={l.id}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground/50 cursor-not-allowed"
                    >
                      <Lock className="h-3 w-3 shrink-0" />
                      <span className="flex-1 line-clamp-1">{l.title}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          {/* 비로그인 시 가입 유도 */}
          {!isLoggedIn && (
            <div className="border-t px-4 py-3 bg-muted/10 space-y-2">
              <p className="text-xs text-muted-foreground">전체 강의는 가입 후 수강하세요</p>
              <Link
                href={`/signup?next=/community/${slug}/classroom/${courseId}`}
                className="block w-full text-center text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg py-1.5 transition-colors"
              >
                무료 가입하기
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
