import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ slug: string; courseId: string }> };

async function getOwnerCommunity(slug: string, userId: string) {
  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });
  if (!community || community.ownerId !== userId) return null;
  return community;
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
