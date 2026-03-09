import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { grantPoints } from "@/lib/gamification";
import { checkAndGrantLessonBadges, checkAndGrantCourseBadges } from "@/lib/badges";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id: lessonId } = await params;
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  });
  if (!lesson) return NextResponse.json({ error: "레슨을 찾을 수 없습니다." }, { status: 404 });

  const courseId = lesson.module.courseId;
  const communityId = lesson.module.course.communityId;

  // 수강 등록 확인
  const enrollment = await db.enrollment.findUnique({
    where: { courseId_userId: { courseId, userId: session.user.id } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "수강 신청이 필요합니다." }, { status: 403 });
  }

  // 레슨 완료 처리 (upsert)
  await db.lessonProgress.upsert({
    where: { lessonId_userId: { lessonId, userId: session.user.id } },
    create: { lessonId, userId: session.user.id, isCompleted: true, completedAt: new Date() },
    update: { isCompleted: true, completedAt: new Date() },
  });

  // 전체 진도 계산
  const [totalLessons, completedLessons] = await Promise.all([
    db.lesson.count({ where: { module: { courseId }, isPublished: true } }),
    db.lessonProgress.count({
      where: { userId: session.user.id, isCompleted: true, lesson: { module: { courseId } } },
    }),
  ]);

  const progressPct = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  await db.enrollment.update({
    where: { courseId_userId: { courseId, userId: session.user.id } },
    data: {
      progress: progressPct,
      completedAt: progressPct === 100 ? new Date() : null,
    },
  });

  // 포인트 지급
  await grantPoints({ userId: session.user.id, communityId, type: "LESSON_COMPLETED" });

  // 배지 체크 (전체 완료 레슨 수로 계산)
  const totalCompleted = await db.lessonProgress.count({
    where: { userId: session.user.id, isCompleted: true },
  });
  void checkAndGrantLessonBadges({ userId: session.user.id, communityId, completedCount: totalCompleted });

  // 강좌 완료 시 수료증 발급 + 포인트 + 배지
  if (progressPct === 100) {
    await db.certificate.upsert({
      where: { courseId_userId: { courseId, userId: session.user.id } },
      create: { courseId, userId: session.user.id },
      update: {},
    });
    await grantPoints({ userId: session.user.id, communityId, type: "COURSE_COMPLETED" });
    void checkAndGrantCourseBadges({ userId: session.user.id, communityId });
  }

  return NextResponse.json({ completed: true, progress: progressPct, courseCompleted: progressPct === 100 });
}
