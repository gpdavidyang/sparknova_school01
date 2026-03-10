"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CornerDownRight, Loader2, Pencil, Trash2, Flag } from "lucide-react";
import { toast } from "sonner";
import { ReportModal } from "@/components/community/report-modal";

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

export function CommentSection({ postId, initialCount: _ }: Props) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);

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

  async function handleEditSave(commentId: string) {
    if (!editText.trim()) return;
    const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editText }),
    });
    if (!res.ok) { toast.error("수정에 실패했습니다."); return; }
    const data = await res.json();
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) return { ...c, content: data.content };
        return {
          ...c,
          replies: c.replies.map((r) => r.id === commentId ? { ...r, content: data.content } : r),
        };
      })
    );
    setEditingId(null);
    toast.success("댓글이 수정되었습니다.");
  }

  async function handleDelete(commentId: string, isReply = false, parentId?: string) {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
    if (!res.ok) { toast.error("삭제에 실패했습니다."); return; }
    if (isReply && parentId) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId ? { ...c, replies: c.replies.filter((r) => r.id !== commentId) } : c
        )
      );
    } else {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
    toast.success("댓글이 삭제되었습니다.");
  }

  function startEdit(id: string, content: string) {
    setEditingId(id);
    setEditText(content);
    setReplyTo(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const CommentItem = ({
    c,
    isReply = false,
    parentId,
  }: {
    c: Comment | Reply;
    isReply?: boolean;
    parentId?: string;
  }) => {
    const isAuthor = session?.user?.id === c.author.id;
    const isEditing = editingId === c.id;

    return (
      <div className="flex gap-2.5">
        {isReply && <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1.5" />}
        <Avatar className={isReply ? "h-6 w-6 shrink-0" : "h-7 w-7 shrink-0"}>
          <AvatarImage src={c.author.avatarUrl ?? ""} />
          <AvatarFallback className="text-xs">{c.author.name?.[0] ?? "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-1.5">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full text-sm border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                rows={2}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditSave(c.id)}
                  className="px-2.5 py-1 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  저장
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="px-2.5 py-1 text-xs border rounded-lg hover:bg-muted transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-muted/50 rounded-xl px-3 py-2">
              <p className="text-xs font-semibold">{c.author.name ?? "익명"}</p>
              <p className="text-sm mt-0.5 whitespace-pre-wrap">{c.content}</p>
            </div>
          )}
          <div className="flex items-center gap-3 mt-1 px-1">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: ko })}
            </span>
            {session && !isReply && (
              <button
                onClick={() => setReplyTo(
                  replyTo?.id === c.id ? null : { id: c.id, name: c.author.name ?? "익명" }
                )}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                답글
              </button>
            )}
            {!isEditing && (
              isAuthor ? (
                <>
                  <button
                    onClick={() => startEdit(c.id, c.content)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <Pencil className="h-3 w-3" />수정
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, isReply, parentId)}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />삭제
                  </button>
                </>
              ) : session ? (
                <button
                  onClick={() => setReportingCommentId(c.id)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                >
                  <Flag className="h-3 w-3" />신고
                </button>
              ) : null
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {comments.length > 0 && (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="space-y-2">
              <CommentItem c={c} />

              {/* 대댓글 */}
              {c.replies.length > 0 && (
                <div className="ml-9 space-y-2">
                  {c.replies.map((r) => (
                    <CommentItem key={r.id} c={r} isReply parentId={c.id} />
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
                      className="flex-1 text-sm border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-blue-400"
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
                      className="px-3 py-2 text-xs font-medium bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-40 transition-colors"
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
              className="flex-1 text-sm border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
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
              className="px-3 py-2 text-xs font-medium bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-40 transition-colors shrink-0"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "등록"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          댓글을 작성하려면 <a href="/login" className="text-blue-500 hover:underline">로그인</a>이 필요합니다.
        </p>
      )}

      {reportingCommentId && (
        <ReportModal
          targetType="COMMENT"
          targetId={reportingCommentId}
          onClose={() => setReportingCommentId(null)}
        />
      )}
    </div>
  );
}
