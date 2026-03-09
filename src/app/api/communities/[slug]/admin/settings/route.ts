import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ slug: string }> };

async function getOwnerCommunity(slug: string, userId: string) {
  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });
  if (!community || community.ownerId !== userId) return null;
  return community;
}

// PATCH: update community settings
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const community = await getOwnerCommunity(slug, session.user.id);
  if (!community) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, description, isPublic, joinType, price, showClassroom, showCalendar } = await req.json();

  const updated = await db.community.update({
    where: { id: community.id },
    data: {
      ...(name ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(isPublic !== undefined ? { isPublic } : {}),
      ...(joinType ? { joinType } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(showClassroom !== undefined ? { showClassroom } : {}),
      ...(showCalendar !== undefined ? { showCalendar } : {}),
    },
    select: { id: true, name: true, slug: true },
  });

  return NextResponse.json(updated);
}
