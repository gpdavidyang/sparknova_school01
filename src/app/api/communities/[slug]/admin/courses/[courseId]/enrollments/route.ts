import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ slug: string; courseId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug: rawSlug, courseId } = await params;
  const slug = decodeURIComponent(rawSlug);

  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });
  if (!community || community.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const enrollments = await db.enrollment.findMany({
    where: { courseId, course: { communityId: community.id } },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  // 진도 통계 추가
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      modules: { include: { lessons: { select: { id: true } } } },
    },
  });
  const totalLessons = course?.modules.flatMap((m) => m.lessons).length ?? 0;

  const result = await Promise.all(
    enrollments.map(async (e) => {
      const completedCount = await db.lessonProgress.count({
        where: { userId: e.userId, isCompleted: true, lesson: { module: { courseId } } },
      });
      return {
        id: e.id,
        enrolledAt: e.enrolledAt,
        user: e.user,
        completedLessons: completedCount,
        totalLessons,
        progress: totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0,
      };
    })
  );

  return NextResponse.json(result);
}
