import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST: 북마크 토글
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: postId } = await params;

  const existing = await db.bookmark.findUnique({
    where: { userId_postId: { userId: session.user.id, postId } },
  });

  if (existing) {
    await db.bookmark.delete({ where: { id: existing.id } });
    return NextResponse.json({ bookmarked: false });
  }

  await db.bookmark.create({ data: { userId: session.user.id, postId } });
  return NextResponse.json({ bookmarked: true });
}

// GET: 북마크 여부 확인
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ bookmarked: false });

  const { id: postId } = await params;
  const existing = await db.bookmark.findUnique({
    where: { userId_postId: { userId: session.user.id, postId } },
  });

  return NextResponse.json({ bookmarked: !!existing });
}
