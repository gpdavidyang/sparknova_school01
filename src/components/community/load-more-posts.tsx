"use client";

import { useState } from "react";
import { PostCard } from "./post-card";
import { Loader2 } from "lucide-react";

type Post = {
  id: string;
  content: string;
  isPinned: boolean;
  likeCount: number;
  createdAt: Date;
  author: { id: string; name: string | null; avatarUrl: string | null; username: string | null };
  category: { name: string; color: string | null } | null;
  _count: { comments: number; likes: number };
};

interface Props {
  communitySlug: string;
  initialCursor: string | null;
}

export function LoadMorePosts({ communitySlug, initialCursor }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);

  if (!cursor) return null;

  const loadMore = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/communities/${communitySlug}/posts?cursor=${cursor}`);
      const data = await res.json();
      setPosts((prev) => [...prev, ...data.posts]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} communitySlug={communitySlug} />
      ))}
      {cursor && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground border rounded-xl hover:border-blue-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> 불러오는 중...</>
          ) : (
            "더 보기"
          )}
        </button>
      )}
    </>
  );
}
