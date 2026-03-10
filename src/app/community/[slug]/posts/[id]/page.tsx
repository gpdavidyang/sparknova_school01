import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { ArrowLeft, Heart, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommentSection } from "@/components/community/comment-section";

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export default async function PostDetailPage({ params }: Props) {
  const { slug: rawSlug, id } = await params;
  const slug = decodeURIComponent(rawSlug);
  const session = await auth();

  const post = await db.post.findUnique({
    where: { id, deletedAt: null },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      category: { select: { name: true, color: true } },
      _count: { select: { comments: true, likes: true } },
    },
  });

  if (!post) notFound();

  const liked = session?.user?.id
    ? !!(await db.like.findUnique({
        where: { userId_postId: { userId: session.user.id, postId: id } },
      }))
    : false;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      {/* 뒤로가기 */}
      <Link
        href={`/community/${slug}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        커뮤니티로 돌아가기
      </Link>

      {/* 게시글 본문 */}
      <div className="border rounded-xl p-5 bg-card space-y-4">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author.avatarUrl ?? ""} />
            <AvatarFallback>{post.author.name?.[0] ?? "U"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{post.author.name ?? "익명"}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })}
            </p>
          </div>
          {post.category && (
            <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-muted font-medium">
              {post.category.name}
            </span>
          )}
        </div>

        {/* 본문 */}
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>

        {/* 액션 */}
        <div className="flex items-center gap-3 pt-2 border-t">
          <span className={`inline-flex items-center gap-1.5 text-sm ${liked ? "text-red-500" : "text-muted-foreground"}`}>
            <Heart className={`h-4 w-4 ${liked ? "fill-red-500" : ""}`} />
            {post._count.likes}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            {post._count.comments}
          </span>
        </div>
      </div>

      {/* 댓글 섹션 */}
      <div className="border rounded-xl p-5 bg-card">
        <h2 className="font-semibold text-sm mb-4">댓글 {post._count.comments > 0 ? `(${post._count.comments})` : ""}</h2>
        <CommentSection postId={id} initialCount={post._count.comments} />
      </div>
    </div>
  );
}
