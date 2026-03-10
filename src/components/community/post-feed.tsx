import { db } from "@/lib/db";
import { PostCard } from "./post-card";
import { LoadMorePosts } from "./load-more-posts";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageSquare } from "lucide-react";

const LIMIT = 20;

interface Props {
  communityId: string;
  communitySlug: string;
}

export async function PostFeed({ communityId, communitySlug }: Props) {
  const raw = await db.post.findMany({
    where: { communityId, deletedAt: null },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true, username: true } },
      category: { select: { name: true, color: true } },
      _count: { select: { comments: true, likes: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: LIMIT + 1,
  });

  const hasMore = raw.length > LIMIT;
  const posts = hasMore ? raw.slice(0, LIMIT) : raw;
  const nextCursor = hasMore ? posts[posts.length - 1].id : null;

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="아직 게시물이 없습니다"
        description="첫 번째 게시물을 작성해보세요!"
      />
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} communitySlug={communitySlug} />
      ))}
      <LoadMorePosts communitySlug={communitySlug} initialCursor={nextCursor} />
    </div>
  );
}
