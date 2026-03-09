import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { grantPoints } from "@/lib/gamification";

type Params = { params: Promise<{ id: string }> };

// GET: 댓글 목록
export async function GET(_req: NextRequest, { params }: Params) {
  const { id: postId } = await params;

  const comments = await db.comment.findMany({
    where: { postId, parentId: null, deletedAt: null },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      replies: {
        where: { deletedAt: null },
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

// POST: 댓글 작성
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id: postId } = await params;
  const { content, parentId } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "댓글 내용을 입력해주세요." }, { status: 400 });
  }

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, communityId: true, authorId: true },
  });
  if (!post) return NextResponse.json({ error: "게시물을 찾을 수 없습니다." }, { status: 404 });

  const comment = await db.comment.create({
    data: {
      postId,
      authorId: session.user.id,
      content: content.trim(),
      parentId: parentId ?? null,
    },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  // 댓글 수 증가
  await db.post.update({
    where: { id: postId },
    data: { commentCount: { increment: 1 } },
  });

  // 댓글 작성 포인트 지급
  await grantPoints({
    userId: session.user.id,
    communityId: post.communityId,
    type: "COMMENT_CREATED",
    referenceId: comment.id,
  });

  // 게시글 작성자에게 알림 (자기 자신 제외)
  if (post.authorId !== session.user.id && !parentId) {
    await db.notification.create({
      data: {
        userId: post.authorId,
        type: "POST_COMMENTED",
        title: "내 게시글에 댓글이 달렸습니다.",
        body: content.trim().slice(0, 80),
        referenceId: postId,
        referenceType: "post",
      },
    });
  }

  // 대댓글인 경우 원댓글 작성자에게 알림
  if (parentId) {
    const parentComment = await db.comment.findUnique({
      where: { id: parentId },
      select: { authorId: true },
    });
    if (parentComment && parentComment.authorId !== session.user.id) {
      await db.notification.create({
        data: {
          userId: parentComment.authorId,
          type: "COMMENT_REPLIED",
          title: "내 댓글에 답글이 달렸습니다.",
          body: content.trim().slice(0, 80),
          referenceId: postId,
          referenceType: "post",
        },
      });
    }
  }

  return NextResponse.json(comment, { status: 201 });
}
