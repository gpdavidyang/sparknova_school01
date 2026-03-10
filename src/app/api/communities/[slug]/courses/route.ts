import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { slug: _rawSlug } = await params;
  const slug = decodeURIComponent(_rawSlug);
  const community = await db.community.findUnique({ where: { slug } });
  if (!community) return NextResponse.json({ error: "커뮤니티를 찾을 수 없습니다." }, { status: 404 });
  if (community.ownerId !== session.user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { title, description, thumbnailUrl, isFree, price, modules } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "강좌 제목을 입력해주세요." }, { status: 400 });

  const lastCourse = await db.course.findFirst({
    where: { communityId: community.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const course = await db.course.create({
    data: {
      communityId: community.id,
      title: title.trim(),
      description: description?.trim() || null,
      thumbnailUrl: thumbnailUrl || null,
      isFree: isFree ?? true,
      price: isFree ? null : price,
      order: (lastCourse?.order ?? 0) + 1,
      isPublished: true,
      modules: {
        create: (modules ?? []).map((mod: { title: string; lessons: { title: string; type: string; content?: string; videoUrl?: string; isFree?: boolean }[] }, mi: number) => ({
          title: mod.title,
          order: mi,
          isPublished: true,
          lessons: {
            create: (mod.lessons ?? []).map((lesson, li) => ({
              title: lesson.title,
              type: lesson.type ?? "TEXT",
              content: lesson.content || null,
              videoUrl: lesson.videoUrl || null,
              order: li,
              isPublished: true,
              isFree: lesson.isFree ?? false,
            })),
          },
        })),
      },
    },
  });

  return NextResponse.json({ id: course.id }, { status: 201 });
}
