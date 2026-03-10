import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// GET: 리뷰 목록
export async function GET(_req: NextRequest, { params }: Params) {
  const { id: courseId } = await params;

  const reviews = await db.review.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  return NextResponse.json({ reviews, avgRating, total: reviews.length });
}

// POST: 리뷰 작성
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id: courseId } = await params;
  const { rating, content } = await req.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "별점을 선택해주세요. (1~5)" }, { status: 400 });
  }

  // 수강 등록 여부 확인
  const enrollment = await db.enrollment.findUnique({
    where: { courseId_userId: { courseId, userId: session.user.id } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "수강 중인 강좌만 리뷰를 작성할 수 있습니다." }, { status: 403 });
  }

  const review = await db.review.upsert({
    where: { courseId_userId: { courseId, userId: session.user.id } },
    create: {
      courseId,
      userId: session.user.id,
      rating,
      content: content?.trim() || null,
    },
    update: {
      rating,
      content: content?.trim() || null,
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(review, { status: 201 });
}

// DELETE: 리뷰 삭제
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id: courseId } = await params;

  await db.review.deleteMany({
    where: { courseId, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
