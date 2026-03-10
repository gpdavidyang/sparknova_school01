import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ slug: string; courseId: string }> };

async function getOwnerCommunity(rawSlug: string, userId: string) {
  const slug = decodeURIComponent(rawSlug);
  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });
  if (!community || community.ownerId !== userId) return null;
  return community;
}

// GET: 강좌 상세 (편집용 - 미발행 포함)
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, courseId } = await params;
  const community = await getOwnerCommunity(slug, session.user.id);
  if (!community) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const course = await db.course.findUnique({
    where: { id: courseId, communityId: community.id },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(course);
}

// PATCH: toggle isPublished
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, courseId } = await params;
  const community = await getOwnerCommunity(slug, session.user.id);
  if (!community) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { isPublished } = await req.json();

  const course = await db.course.update({
    where: { id: courseId, communityId: community.id },
    data: { isPublished },
    select: { id: true, isPublished: true },
  });

  return NextResponse.json(course);
}

// PUT: 강좌 전체 업데이트
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, courseId } = await params;
  const community = await getOwnerCommunity(slug, session.user.id);
  if (!community) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, description, thumbnailUrl, isFree, price, modules } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "강좌 제목을 입력해주세요." }, { status: 400 });

  type LessonInput = { title: string; type: string; content?: string; videoUrl?: string; isFree?: boolean; duration?: number | null };
  type ModuleInput = { title: string; drip?: number | null; lessons: LessonInput[] };

  // 기존 모듈/레슨 삭제 후 재생성 (Lesson은 Module cascade로 자동 삭제)
  await db.module.deleteMany({ where: { courseId } });

  const course = await db.course.update({
    where: { id: courseId, communityId: community.id },
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      thumbnailUrl: thumbnailUrl || null,
      isFree: isFree ?? true,
      price: isFree ? null : price,
      modules: {
        create: (modules ?? []).map((mod: ModuleInput, mi: number) => ({
          title: mod.title,
          order: mi,
          isPublished: true,
          drip: mod.drip ?? null,
          lessons: {
            create: (mod.lessons ?? []).map((lesson: LessonInput, li: number) => ({
              title: lesson.title,
              type: lesson.type ?? "TEXT",
              content: lesson.content || null,
              videoUrl: lesson.videoUrl || null,
              order: li,
              isPublished: true,
              isFree: lesson.isFree ?? false,
              duration: lesson.duration ?? null,
            })),
          },
        })),
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: course.id });
}

// DELETE: 강좌 삭제
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, courseId } = await params;
  const community = await getOwnerCommunity(slug, session.user.id);
  if (!community) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.course.delete({ where: { id: courseId, communityId: community.id } });

  return NextResponse.json({ ok: true });
}
