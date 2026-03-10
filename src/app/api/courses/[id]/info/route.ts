import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const course = await db.course.findUnique({
    where: { id },
    include: { community: { select: { slug: true, name: true } } },
  });

  if (!course) {
    return NextResponse.json({ error: "강좌를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({
    id: course.id,
    title: course.title,
    price: course.price ?? 0,
    communityId: course.communityId,
    communitySlug: course.community.slug,
    communityName: course.community.name,
  });
}
