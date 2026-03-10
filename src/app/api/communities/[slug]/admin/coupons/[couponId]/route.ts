import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ slug: string; couponId: string }> };

// PATCH: 쿠폰 수정 (활성/비활성 토글 등)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug: rawSlug, couponId } = await params;
  const slug = decodeURIComponent(rawSlug);

  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });
  if (!community || community.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const coupon = await db.coupon.findFirst({
    where: { id: couponId, communityId: community.id },
  });
  if (!coupon) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await db.coupon.update({
    where: { id: couponId },
    data: {
      ...(body.description !== undefined && { description: body.description }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.maxUses !== undefined && { maxUses: body.maxUses ? Number(body.maxUses) : null }),
      ...(body.expiresAt !== undefined && { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE: 쿠폰 삭제
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug: rawSlug, couponId } = await params;
  const slug = decodeURIComponent(rawSlug);

  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });
  if (!community || community.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.coupon.deleteMany({ where: { id: couponId, communityId: community.id } });

  return NextResponse.json({ ok: true });
}
