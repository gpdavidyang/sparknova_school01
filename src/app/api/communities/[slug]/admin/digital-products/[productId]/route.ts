import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ slug: string; productId: string }> };

async function getOwnerCommunity(rawSlug: string, userId: string) {
  const slug = decodeURIComponent(rawSlug);
  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });
  if (!community || community.ownerId !== userId) return null;
  return community;
}

// PATCH: 발행/수정
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, productId } = await params;
  const community = await getOwnerCommunity(slug, session.user.id);
  if (!community) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { isPublished, title, description, thumbnailUrl, price } = body;

  const updateData: Record<string, unknown> = {};
  if (typeof isPublished === "boolean") updateData.isPublished = isPublished;
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description || null;
  if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl || null;
  if (price !== undefined) updateData.price = price;

  const product = await db.digitalProduct.update({
    where: { id: productId, communityId: community.id },
    data: updateData,
  });

  return NextResponse.json(product);
}

// DELETE
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, productId } = await params;
  const community = await getOwnerCommunity(slug, session.user.id);
  if (!community) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.digitalProduct.delete({ where: { id: productId, communityId: community.id } });
  return NextResponse.json({ ok: true });
}
