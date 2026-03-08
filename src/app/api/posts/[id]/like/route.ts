import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { grantPoints } from "@/lib/gamification";

// POST /api/posts/[id]/like — 좋아요 토글
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id: postId } = await params;
  const userId = session.user.id;

  const post = await db.post.findUnique({ where: { id: postId } });
  if (!post) return NextResponse.json({ error: "게시물을 찾을 수 없습니다." }, { status: 404 });

  const existing = await db.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    // 좋아요 취소
    await db.like.delete({ where: { userId_postId: { userId, postId } } });
    await db.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } });
    return NextResponse.json({ liked: false });
  } else {
    // 좋아요 추가
    await db.like.create({ data: { userId, postId } });
    await db.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } });

    // 게시물 작성자에게 포인트 지급 (자기 자신 제외)
    if (post.authorId !== userId) {
      await grantPoints({
        userId: post.authorId,
        communityId: post.communityId,
        type: "POST_LIKED",
        referenceId: postId,
      });
    }

    return NextResponse.json({ liked: true });
  }
}
