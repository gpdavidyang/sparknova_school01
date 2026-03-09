"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CornerDownRight, Loader2 } from "lucide-react";

interface CommentAuthor {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

interface Reply {
  id: string;
  content: string;
  createdAt: string;
  author: CommentAuthor;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: CommentAuthor;
  replies: Reply[];
}

interface Props {
  postId: string;
  initialCount: number;
}

export function CommentSection({ postId, initialCount }: Props) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [replyText, setReplyText] = useState("");

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/posts/${postId}/comments`);
    if (res.ok) setComments(await res.json());
    setLoading(false);
  }, [postId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const submit = async (content: string, parentId?: string) => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId }),
      });
      if (res.ok) {
        setText("");
        setReplyText("");
        setReplyTo(null);
        await fetchComments();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 댓글 목록 */}
      {comments.length > 0 && (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="space-y-2">
              {/* 댓글 */}
              <div className="flex gap-2.5">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={c.author.avatarUrl ?? ""} />
                  <AvatarFallback className="text-xs">{c.author.name?.[0] ?? "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="bg-muted/50 rounded-xl px-3 py-2">
                    <p className="text-xs font-semibold">{c.author.name ?? "익명"}</p>
                    <p className="text-sm mt-0.5 whitespace-pre-wrap">{c.content}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 px-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: ko })}
                    </span>
                    {session && (
                      <button
                        onClick={() => setReplyTo(replyTo?.id === c.id ? null : { id: c.id, name: c.author.name ?? "익명" })}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        답글
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 대댓글 */}
              {c.replies.length > 0 && (
                <div className="ml-9 space-y-2">
                  {c.replies.map((r) => (
                    <div key={r.id} className="flex gap-2.5">
                      <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1.5" />
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarImage src={r.author.avatarUrl ?? ""} />
                        <AvatarFallback className="text-xs">{r.author.name?.[0] ?? "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="bg-muted/50 rounded-xl px-3 py-2">
                          <p className="text-xs font-semibold">{r.author.name ?? "익명"}</p>
                          <p className="text-sm mt-0.5 whitespace-pre-wrap">{r.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 px-1">
                          {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: ko })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 대댓글 입력창 */}
              {replyTo?.id === c.id && session && (
                <div className="ml-9 flex gap-2">
                  <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-2.5" />
                  <div className="flex-1 flex gap-2">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`@${replyTo.name} 에게 답글...`}
                      className="flex-1 text-sm border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-orange-400"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          submit(replyText, c.id);
                        }
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => submit(replyText, c.id)}
                      disabled={submitting || !replyText.trim()}
                      className="px-3 py-2 text-xs font-medium bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors"
                    >
                      {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "전송"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 댓글 입력창 */}
      {session ? (
        <div className="flex gap-2.5">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={session.user?.image ?? ""} />
            <AvatarFallback className="text-xs">{session.user?.name?.[0] ?? "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="댓글을 입력하세요..."
              rows={1}
              className="flex-1 text-sm border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-orange-400 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(text);
                }
              }}
            />
            <button
              onClick={() => submit(text)}
              disabled={submitting || !text.trim()}
              className="px-3 py-2 text-xs font-medium bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors shrink-0"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "등록"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          댓글을 작성하려면 <a href="/login" className="text-orange-500 hover:underline">로그인</a>이 필요합니다.
        </p>
      )}
    </div>
  );
}
