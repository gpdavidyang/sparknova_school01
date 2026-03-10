import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Bookmark, MessageCircle, Heart } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "북마크" };

export default async function BookmarksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const bookmarks = await db.bookmark.findMany({
    where: { userId: session.user.id },
    include: {
      post: {
        include: {
          author: { select: { name: true, avatarUrl: true } },
          community: { select: { name: true, slug: true } },
          _count: { select: { likes: true, comments: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-blue-500" />
          북마크
        </h1>
        <p className="text-sm text-muted-foreground mt-1">저장한 게시물 {bookmarks.length}개</p>
      </div>

      {bookmarks.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="저장한 게시물이 없습니다"
          description="게시물의 북마크 버튼을 눌러 저장해보세요."
        />
      ) : (
        <div className="space-y-3">
          {bookmarks.map(({ post, createdAt }) => (
            <div key={post.id} className="border rounded-xl p-4 bg-card space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Link href={`/community/${post.community.slug}`} className="hover:text-foreground transition-colors font-medium">
                  {post.community.name}
                </Link>
                <span>·</span>
                <span>{post.author.name ?? "익명"}</span>
                <span>·</span>
                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })}</span>
                <span className="ml-auto text-xs">
                  저장 {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ko })}
                </span>
              </div>
              <Link href={`/community/${post.community.slug}/posts/${post.id}`}>
                <p className="text-sm line-clamp-3 hover:text-foreground/80 transition-colors">
                  {post.content}
                </p>
              </Link>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />{post._count.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />{post._count.comments}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
