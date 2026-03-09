import { db } from "@/lib/db";
import { PostCard } from "./post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageSquare } from "lucide-react";

interface Props {
  communityId: string;
  communitySlug: string;
}

export async function PostFeed({ communityId, communitySlug }: Props) {
  const posts = await db.post.findMany({
    where: { communityId, deletedAt: null },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true, username: true } },
      category: { select: { name: true, color: true } },
      _count: { select: { comments: true, likes: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 20,
  });

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
    </div>
  );
}
