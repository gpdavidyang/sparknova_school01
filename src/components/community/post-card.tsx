"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Heart, MessageCircle, Pin, Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    isPinned: boolean;
    likeCount: number;
    createdAt: Date;
    author: {
      id: string;
      name: string | null;
      avatarUrl: string | null;
      username: string | null;
    };
    category: { name: string; color: string | null } | null;
    _count: { comments: number; likes: number };
  };
  communitySlug: string;
}

export function PostCard({ post, communitySlug }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [bookmarked, setBookmarked] = useState(false);

  async function handleLike() {
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      if (!res.ok) throw new Error();
      setLiked(!liked);
      setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    } catch {
      toast.error("로그인이 필요합니다.");
    }
  }

  async function handleBookmark() {
    try {
      const res = await fetch(`/api/posts/${post.id}/bookmark`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBookmarked(data.bookmarked);
      toast.success(data.bookmarked ? "북마크에 저장했습니다." : "북마크를 해제했습니다.");
    } catch {
      toast.error("로그인이 필요합니다.");
    }
  }

  return (
    <Card className={cn(post.isPinned && "border-blue-200 bg-blue-50/30")}>
      <CardContent className="p-4">
        {/* 헤더 */}
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={post.author.avatarUrl ?? ""} />
            <AvatarFallback>{post.author.name?.[0] ?? "U"}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{post.author.name ?? "익명"}</span>
              {post.category && (
                <Badge variant="secondary" className="text-xs px-2 py-0">
                  {post.category.name}
                </Badge>
              )}
              {post.isPinned && (
                <span className="flex items-center gap-1 text-xs text-blue-500">
                  <Pin className="h-3 w-3" />
                  고정
                </span>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })}
              </span>
            </div>

            {/* 본문 */}
            <Link href={`/community/${communitySlug}/posts/${post.id}`}>
              <p className="text-sm mt-2 whitespace-pre-wrap hover:text-foreground/80 transition-colors">
                {post.content}
              </p>
            </Link>

            {/* 액션 */}
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 px-2 text-xs gap-1.5", liked && "text-red-500")}
                onClick={handleLike}
              >
                <Heart className={cn("h-3.5 w-3.5", liked && "fill-red-500")} />
                {likeCount}
              </Button>

              <Link
                href={`/community/${communitySlug}/posts/${post.id}`}
                className="inline-flex items-center gap-1.5 h-8 px-2 text-xs rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {post._count.comments}
              </Link>

              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 px-2 ml-auto", bookmarked && "text-blue-500")}
                onClick={handleBookmark}
              >
                <Bookmark className={cn("h-3.5 w-3.5", bookmarked && "fill-blue-500")} />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
