"use client";

import { useState } from "react";
import { Star, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Review {
  id: string;
  rating: number;
  content: string | null;
  createdAt: string;
  user: { id: string; name: string | null; avatarUrl: string | null };
}

interface Props {
  courseId: string;
  initialReviews: Review[];
  initialAvg: number | null;
  initialTotal: number;
  isEnrolled: boolean;
  currentUserId: string | null;
  myReview: Review | null;
}

function StarRating({ value, onChange, readonly }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          className="focus:outline-none disabled:cursor-default"
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              s <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function CourseReviews({ courseId, initialReviews, initialAvg, initialTotal, isEnrolled, currentUserId, myReview: initialMyReview }: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [avg, setAvg] = useState(initialAvg);
  const [total, setTotal] = useState(initialTotal);
  const [myReview, setMyReview] = useState(initialMyReview);

  const [rating, setRating] = useState(myReview?.rating ?? 0);
  const [content, setContent] = useState(myReview?.content ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  function recalcAvg(updatedReviews: Review[]) {
    const t = updatedReviews.length;
    const a = t > 0 ? updatedReviews.reduce((s, r) => s + r.rating, 0) / t : null;
    setAvg(a);
    setTotal(t);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) { toast.error("별점을 선택해주세요."); return; }
    setSubmitting(true);
    const res = await fetch(`/api/courses/${courseId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, content }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "리뷰 저장에 실패했습니다.");
      return;
    }
    const saved: Review = await res.json();
    setMyReview(saved);

    const updated = myReview
      ? reviews.map((r) => (r.user.id === currentUserId ? saved : r))
      : [saved, ...reviews];
    setReviews(updated);
    recalcAvg(updated);
    setShowForm(false);
    toast.success(myReview ? "리뷰가 수정되었습니다." : "리뷰가 등록되었습니다.");
  }

  async function handleDelete() {
    if (!confirm("리뷰를 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/courses/${courseId}/reviews`, { method: "DELETE" });
    if (!res.ok) { toast.error("삭제에 실패했습니다."); return; }
    const updated = reviews.filter((r) => r.user.id !== currentUserId);
    setReviews(updated);
    recalcAvg(updated);
    setMyReview(null);
    setRating(0);
    setContent("");
    toast.success("리뷰가 삭제되었습니다.");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">수강 후기</h2>
        {avg !== null && (
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-bold">{avg.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({total}개)</span>
          </div>
        )}
      </div>

      {/* 내 리뷰 / 작성 폼 */}
      {isEnrolled && currentUserId && (
        <div className="border rounded-xl p-4 bg-muted/20 space-y-3">
          {myReview && !showForm ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">내 리뷰</p>
                <div className="flex gap-2">
                  <button onClick={() => { setRating(myReview.rating); setContent(myReview.content ?? ""); setShowForm(true); }} className="text-xs text-blue-500 hover:underline">수정</button>
                  <button onClick={handleDelete} className="text-xs text-destructive hover:underline flex items-center gap-0.5"><Trash2 className="h-3 w-3" />삭제</button>
                </div>
              </div>
              <StarRating value={myReview.rating} readonly />
              {myReview.content && <p className="text-sm">{myReview.content}</p>}
            </div>
          ) : showForm || !myReview ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="text-sm font-medium">{myReview ? "리뷰 수정" : "리뷰 작성"}</p>
              <StarRating value={rating} onChange={setRating} />
              <Textarea
                placeholder="이 강좌에 대한 솔직한 후기를 남겨주세요. (선택)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className="text-sm resize-none"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={submitting} className="bg-blue-500 hover:bg-blue-600">
                  {submitting && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                  {myReview ? "수정하기" : "등록하기"}
                </Button>
                {showForm && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>취소</Button>
                )}
              </div>
            </form>
          ) : null}
        </div>
      )}

      {/* 리뷰 목록 */}
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">아직 후기가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={r.user.avatarUrl ?? undefined} />
                <AvatarFallback className="text-xs">{r.user.name?.[0] ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{r.user.name ?? "익명"}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "short", day: "numeric" }).format(new Date(r.createdAt))}
                  </span>
                </div>
                <StarRating value={r.rating} readonly />
                {r.content && <p className="text-sm mt-1 text-muted-foreground">{r.content}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
