"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Heart, MessageCircle, Pin, Bookmark, MoreHorizontal, Pencil, Trash2, Flag } from "lucide-react";
import { ReportModal } from "@/components/community/report-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RichEditor } from "@/components/ui/rich-editor";

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
  const { data: session } = useSession();
  const router = useRouter();
  const isAuthor = session?.user?.id === post.author.id;

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [bookmarked, setBookmarked] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [displayContent, setDisplayContent] = useState(post.content);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

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

  async function handleSaveEdit() {
    if (!editContent.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    setSaving(false);
    if (!res.ok) { toast.error("수정에 실패했습니다."); return; }
    const data = await res.json();
    setDisplayContent(data.content);
    setEditing(false);
    toast.success("게시글이 수정되었습니다.");
  }

  async function handleDelete() {
    if (!confirm("게시글을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("삭제에 실패했습니다."); return; }
    setDeleted(true);
    toast.success("게시글이 삭제되었습니다.");
    router.refresh();
  }

  if (deleted) return null;

  return (
    <>
    <Card className={cn(post.isPinned && "border-blue-200 bg-blue-50/30")}>
      <CardContent className="p-4">
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
                  <Pin className="h-3 w-3" />고정
                </span>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })}
              </span>

              {/* 메뉴 */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-6 z-10 bg-popover border rounded-lg shadow-md py-1 min-w-[100px]">
                    {isAuthor ? (
                      <>
                        <button
                          onClick={() => { setEditing(true); setEditContent(displayContent); setMenuOpen(false); }}
                          className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />수정
                        </button>
                        <button
                          onClick={() => { setMenuOpen(false); handleDelete(); }}
                          className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-destructive hover:bg-muted transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />삭제
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setMenuOpen(false); setReportOpen(true); }}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-destructive hover:bg-muted transition-colors"
                      >
                        <Flag className="h-3.5 w-3.5" />신고
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 본문 또는 편집 */}
            {editing ? (
              <div className="mt-2 space-y-2">
                <RichEditor
                  value={editContent}
                  onChange={setEditContent}
                  placeholder="내용을 입력하세요..."
                  minHeight="100px"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving || !editContent.trim()}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 transition-colors"
                  >
                    {saving ? "저장 중..." : "저장"}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-muted transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <Link href={`/community/${communitySlug}/posts/${post.id}`}>
                <div
                  className="text-sm mt-2 rich-content hover:text-foreground/80 transition-colors"
                  dangerouslySetInnerHTML={{ __html: displayContent }}
                />
              </Link>
            )}

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
    {reportOpen && (
      <ReportModal targetType="POST" targetId={post.id} onClose={() => setReportOpen(false)} />
    )}
    </>
  );
}
