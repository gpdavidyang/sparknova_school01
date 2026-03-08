import { db } from "@/lib/db";
import { PostCard } from "./post-card";

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
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">아직 게시물이 없습니다.</p>
        <p className="text-sm mt-1">첫 번째 게시물을 작성해보세요!</p>
      </div>
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
