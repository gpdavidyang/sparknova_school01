import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ slug: string }> };

// DELETE: 커뮤니티 삭제 (오너 전용)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });

  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (community.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.community.delete({ where: { id: community.id } });

  return NextResponse.json({ ok: true });
}
