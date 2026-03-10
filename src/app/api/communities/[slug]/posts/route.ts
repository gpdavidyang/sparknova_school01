import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { grantPoints } from "@/lib/gamification";

const postSchema = z.object({
  content: z.string().min(1).max(10000),
  categoryId: z.string().optional(),
  title: z.string().optional(),
});

// GET /api/communities/[slug]/posts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: _rawSlug } = await params;
  const slug = decodeURIComponent(_rawSlug);
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = 20;

  const community = await db.community.findUnique({ where: { slug } });
  if (!community) return NextResponse.json({ error: "커뮤니티를 찾을 수 없습니다." }, { status: 404 });

  const posts = await db.post.findMany({
    where: { communityId: community.id, deletedAt: null },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true, username: true } },
      category: { select: { name: true, color: true } },
      _count: { select: { comments: true, likes: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = posts.length > limit;
  const data = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return NextResponse.json({ posts: data, nextCursor });
}

// POST /api/communities/[slug]/posts
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { slug: _rawSlug } = await params;
  const slug = decodeURIComponent(_rawSlug);
  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const community = await db.community.findUnique({ where: { slug } });
  if (!community) return NextResponse.json({ error: "커뮤니티를 찾을 수 없습니다." }, { status: 404 });

  // 멤버 확인
  const membership = await db.communityMember.findUnique({
    where: { communityId_userId: { communityId: community.id, userId: session.user.id } },
  });
  if (!membership?.isActive) {
    return NextResponse.json({ error: "커뮤니티 멤버만 게시물을 작성할 수 있습니다." }, { status: 403 });
  }

  const post = await db.post.create({
    data: {
      communityId: community.id,
      authorId: session.user.id,
      content: parsed.data.content,
      categoryId: parsed.data.categoryId,
      title: parsed.data.title,
    },
  });

  // 게시물 작성 포인트 지급
  await grantPoints({
    userId: session.user.id,
    communityId: community.id,
    type: "POST_CREATED",
    referenceId: post.id,
  });

  // 커뮤니티 게시물 수 증가
  await db.community.update({
    where: { id: community.id },
    data: { postCount: { increment: 1 } },
  });

  return NextResponse.json(post, { status: 201 });
}
