"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Flag, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const REASONS = [
  "스팸 또는 광고",
  "욕설 또는 혐오 표현",
  "허위 정보",
  "개인정보 침해",
  "성적으로 부적절한 내용",
  "기타",
];

interface Props {
  targetType: "POST" | "COMMENT";
  targetId: string;
  onClose: () => void;
}

export function ReportModal({ targetType, targetId, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) { toast.error("신고 사유를 선택해주세요."); return; }
    setSubmitting(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, reason, detail }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "신고 접수에 실패했습니다.");
      return;
    }
    toast.success("신고가 접수되었습니다. 검토 후 조치하겠습니다.");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-background rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-red-500" />
            <h2 className="font-semibold">{targetType === "POST" ? "게시글" : "댓글"} 신고</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">신고 사유 *</p>
            {REASONS.map((r) => (
              <label key={r} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="accent-blue-500"
                />
                <span className="text-sm">{r}</span>
              </label>
            ))}
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">상세 내용 (선택)</p>
            <Textarea
              placeholder="추가 내용을 입력해주세요..."
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>취소</Button>
            <Button type="submit" disabled={submitting} className="flex-1 bg-red-500 hover:bg-red-600">
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              신고하기
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
