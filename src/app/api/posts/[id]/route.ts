import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// PATCH: 게시글 수정 (작성자만)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });

  const post = await db.post.findUnique({ where: { id, deletedAt: null }, select: { authorId: true } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (post.authorId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await db.post.update({
    where: { id },
    data: { content: content.trim() },
    select: { id: true, content: true },
  });
  return NextResponse.json(updated);
}

// DELETE: 게시글 삭제 — 작성자 또는 커뮤니티 오너
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const post = await db.post.findUnique({
    where: { id, deletedAt: null },
    select: { authorId: true, communityId: true },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAuthor = post.authorId === session.user.id;
  if (!isAuthor) {
    const community = await db.community.findUnique({ where: { id: post.communityId }, select: { ownerId: true } });
    if (community?.ownerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.post.update({ where: { id }, data: { deletedAt: new Date() } });
  await db.community.update({ where: { id: post.communityId }, data: { postCount: { decrement: 1 } } });

  return NextResponse.json({ ok: true });
}
