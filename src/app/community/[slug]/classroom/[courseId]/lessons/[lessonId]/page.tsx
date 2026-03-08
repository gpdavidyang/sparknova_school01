import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronLeft, ChevronRight, CheckCircle2, List } from "lucide-react";
import { LessonCompleteButton } from "@/components/classroom/lesson-complete-button";

interface Props {
  params: Promise<{ slug: string; courseId: string; lessonId: string }>;
}

export default async function LessonPage({ params }: Props) {
  const { slug, courseId, lessonId } = await params;
  const session = await auth();

  if (!session?.user?.id) redirect(`/login`);

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: {
            include: {
              modules: {
                where: { isPublished: true },
                orderBy: { order: "asc" },
                include: {
                  lessons: { where: { isPublished: true }, orderBy: { order: "asc" }, select: { id: true, title: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!lesson || !lesson.isPublished) notFound();

  const [enrollment, community] = await Promise.all([
    db.enrollment.findUnique({ where: { courseId_userId: { courseId, userId: session.user.id } } }),
    db.community.findUnique({ where: { slug }, select: { ownerId: true } }),
  ]);
  const isOwner = community?.ownerId === session.user.id;

  if (!enrollment && !isOwner && !lesson.isFree) redirect(`/community/${slug}/classroom/${courseId}`);

  const lessonProgress = await db.lessonProgress.findUnique({
    where: { lessonId_userId: { lessonId, userId: session.user.id } },
  });
  const isCompleted = lessonProgress?.isCompleted ?? false;

  // 이전/다음 레슨 계산
  const allLessons = lesson.module.course.modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // YouTube embed URL 변환
  function getEmbedUrl(url: string) {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return url;
  }

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

        {/* 완료 버튼 + 네비게이션 */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {prevLesson ? (
              <Link
                href={`/community/${slug}/classroom/${courseId}/lessons/${prevLesson.id}`}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                {prevLesson.title}
              </Link>
            ) : <span />}
          </div>

          <LessonCompleteButton
            lessonId={lessonId}
            isCompleted={isCompleted}
            nextLessonHref={nextLesson ? `/community/${slug}/classroom/${courseId}/lessons/${nextLesson.id}` : `/community/${slug}/classroom/${courseId}`}
          />

          <div>
            {nextLesson ? (
              <Link
                href={`/community/${slug}/classroom/${courseId}/lessons/${nextLesson.id}`}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {nextLesson.title}
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
                {mod.lessons.map((l) => (
                  <Link
                    key={l.id}
                    href={`/community/${slug}/classroom/${courseId}/lessons/${l.id}`}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs transition-colors hover:bg-muted/50 ${l.id === lessonId ? "bg-orange-50 text-orange-600 font-medium" : "text-muted-foreground"}`}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${l.id === lessonId ? "bg-orange-500" : "bg-muted-foreground/30"}`} />
                    {l.title}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
