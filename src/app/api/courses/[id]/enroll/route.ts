import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id: courseId } = await params;
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course || !course.isPublished) {
    return NextResponse.json({ error: "강좌를 찾을 수 없습니다." }, { status: 404 });
  }
  if (!course.isFree) {
    return NextResponse.json({ error: "유료 강좌는 결제 후 수강할 수 있습니다." }, { status: 402 });
  }

  const existing = await db.enrollment.findUnique({
    where: { courseId_userId: { courseId, userId: session.user.id } },
  });
  if (existing) {
    return NextResponse.json({ enrolled: true, alreadyEnrolled: true });
  }

  await db.enrollment.create({
    data: { courseId, userId: session.user.id, progress: 0 },
  });
  await db.course.update({
    where: { id: courseId },
    data: { enrollCount: { increment: 1 } },
  });

  return NextResponse.json({ enrolled: true }, { status: 201 });
}
