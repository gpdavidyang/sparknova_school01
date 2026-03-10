import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string; commentId: string }> };

// PATCH: 댓글 수정 (작성자만)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { commentId } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });

  const comment = await db.comment.findUnique({
    where: { id: commentId, deletedAt: null },
    select: { authorId: true },
  });
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (comment.authorId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await db.comment.update({
    where: { id: commentId },
    data: { content: content.trim() },
    select: { id: true, content: true },
  });
  return NextResponse.json(updated);
}

// DELETE: 댓글 삭제 (soft delete, 작성자만)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: postId, commentId } = await params;
  const comment = await db.comment.findUnique({
    where: { id: commentId, deletedAt: null },
    select: { authorId: true },
  });
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (comment.authorId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } });
  await db.post.update({ where: { id: postId }, data: { commentCount: { decrement: 1 } } });

  return NextResponse.json({ ok: true });
}
