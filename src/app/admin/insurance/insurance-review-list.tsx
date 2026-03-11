"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Shield, ShieldCheck, ShieldAlert, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Insurance {
  id: string;
  amount: number;
  insurerName: string;
  policyNumber: string;
  fileUrl: string;
  issuedAt: string;
  expiresAt: string;
  status: string;
  reviewNote: string | null;
  createdAt: string;
  community: {
    name: string;
    slug: string;
    owner: { name: string | null; email: string };
  };
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  PENDING:  { label: "심사 대기", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  APPROVED: { label: "승인", color: "bg-green-100 text-green-700", icon: ShieldCheck },
  REJECTED: { label: "반려", color: "bg-red-100 text-red-700", icon: ShieldAlert },
  EXPIRED:  { label: "만료", color: "bg-muted text-muted-foreground", icon: AlertTriangle },
};

export function InsuranceReviewList({ insurances: initial }: { insurances: Insurance[] }) {
  const [insurances, setInsurances] = useState(initial);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReview(id: string, status: "APPROVED" | "REJECTED") {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/insurance/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: reviewNote || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error);
        return;
      }
      const updated = await res.json();
      setInsurances((prev) =>
        prev.map((ins) => (ins.id === id ? { ...ins, ...updated } : ins)),
      );
      toast.success(status === "APPROVED" ? "승인되었습니다." : "반려되었습니다.");
      setReviewingId(null);
      setReviewNote("");
    } catch {
      toast.error("처리에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (insurances.length === 0) {
    return (
      <div className="border rounded-xl p-8 text-center text-muted-foreground bg-card">
        <Shield className="h-10 w-10 mx-auto mb-3 opacity-20" />
        <p>제출된 보증보험이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insurances.map((ins) => {
        const st = STATUS_MAP[ins.status] ?? STATUS_MAP.PENDING;
        const isExpired = ins.status === "APPROVED" && new Date(ins.expiresAt) < new Date();
        return (
          <div key={ins.id} className="border rounded-xl p-4 bg-card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-sm">{ins.community.name}</p>
                <p className="text-xs text-muted-foreground">
                  운영자: {ins.community.owner.name ?? ins.community.owner.email}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isExpired ? "bg-muted text-muted-foreground" : st.color}`}>
                {isExpired ? "만료" : st.label}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
              <span>보험사: {ins.insurerName}</span>
              <span>증권: #{ins.policyNumber}</span>
              <span>보증금: {Number(ins.amount).toLocaleString()}원</span>
              <span>
                {new Date(ins.issuedAt).toLocaleDateString("ko-KR")} ~{" "}
                {new Date(ins.expiresAt).toLocaleDateString("ko-KR")}
              </span>
            </div>

            <a
              href={ins.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline"
            >
              증권 파일 보기 →
            </a>

            {ins.reviewNote && (
              <p className="text-xs text-red-500">심사 메모: {ins.reviewNote}</p>
            )}

            {ins.status === "PENDING" && (
              <>
                {reviewingId === ins.id ? (
                  <div className="space-y-2 pt-2 border-t">
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="심사 메모 (선택사항)"
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReview(ins.id, "APPROVED")}
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReview(ins.id, "REJECTED")}
                        disabled={loading}
                      >
                        반려
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setReviewingId(null); setReviewNote(""); }}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReviewingId(ins.id)}
                  >
                    심사하기
                  </Button>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
