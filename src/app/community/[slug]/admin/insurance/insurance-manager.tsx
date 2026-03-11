"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Shield, ShieldCheck, ShieldAlert, Clock, Upload, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

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
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  PENDING:  { label: "심사 중", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  APPROVED: { label: "승인", color: "bg-green-100 text-green-700", icon: ShieldCheck },
  REJECTED: { label: "반려", color: "bg-red-100 text-red-700", icon: ShieldAlert },
  EXPIRED:  { label: "만료", color: "bg-muted text-muted-foreground", icon: AlertTriangle },
};

export function InsuranceManager({
  slug,
  insurances: initialInsurances,
  hasValid,
}: {
  slug: string;
  insurances: Insurance[];
  hasValid: boolean;
}) {
  const [insurances, setInsurances] = useState(initialInsurances);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    insurerName: "",
    policyNumber: "",
    fileUrl: "",
    issuedAt: "",
    expiresAt: "",
    amount: "10000000",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.insurerName || !form.policyNumber || !form.fileUrl || !form.issuedAt || !form.expiresAt) {
      toast.error("필수 항목을 모두 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/communities/${slug}/admin/insurance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("보증보험 증권이 제출되었습니다.");
      setInsurances((prev) => [data, ...prev]);
      setShowForm(false);
      setForm({ insurerName: "", policyNumber: "", fileUrl: "", issuedAt: "", expiresAt: "", amount: "10000000" });
    } catch {
      toast.error("제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center">
            <Shield className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <h1 className="font-bold">보증보험 관리</h1>
            <p className="text-xs text-muted-foreground">강좌 개설을 위해 보증보험증권을 제출하세요</p>
          </div>
        </div>
        <Link href={`/community/${slug}/admin`} className="text-sm text-blue-500 hover:underline">
          관리 홈 →
        </Link>
      </div>

      {/* 상태 배너 */}
      {hasValid ? (
        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-green-200 bg-green-50">
          <ShieldCheck className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-700">보증보험 유효</p>
            <p className="text-xs text-green-600">현재 유효한 보증보험이 승인되어 있습니다.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-700">보증보험 필요</p>
            <p className="text-xs text-yellow-600">유료 강좌를 개설하려면 보증보험증권을 제출해야 합니다.</p>
          </div>
        </div>
      )}

      {/* 제출 버튼 */}
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="bg-blue-500 hover:bg-blue-600">
          <Upload className="h-4 w-4 mr-2" />
          보증보험 제출
        </Button>
      )}

      {/* 제출 폼 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-xl p-5 space-y-4 bg-card">
          <h3 className="font-semibold text-sm">보증보험증권 제출</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>보험사명 *</Label>
              <Input
                value={form.insurerName}
                onChange={(e) => setForm((p) => ({ ...p, insurerName: e.target.value }))}
                placeholder="서울보증보험"
              />
            </div>
            <div className="space-y-1.5">
              <Label>증권번호 *</Label>
              <Input
                value={form.policyNumber}
                onChange={(e) => setForm((p) => ({ ...p, policyNumber: e.target.value }))}
                placeholder="12-34-567890"
              />
            </div>
            <div className="space-y-1.5">
              <Label>보증금액 (원)</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                min={1000000}
              />
            </div>
            <div className="space-y-1.5">
              <Label>증권 파일 URL *</Label>
              <Input
                value={form.fileUrl}
                onChange={(e) => setForm((p) => ({ ...p, fileUrl: e.target.value }))}
                placeholder="https://storage.example.com/insurance.pdf"
              />
            </div>
            <div className="space-y-1.5">
              <Label>발급일 *</Label>
              <Input
                type="date"
                value={form.issuedAt}
                onChange={(e) => setForm((p) => ({ ...p, issuedAt: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>만료일 *</Label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            보증보험증권(1,000만 원 이상)을 제출하면 관리자 심사 후 승인됩니다.
            승인 후 유료 강좌를 개설할 수 있습니다.
          </p>
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting} className="bg-blue-500 hover:bg-blue-600">
              {submitting ? "제출 중..." : "제출"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              취소
            </Button>
          </div>
        </form>
      )}

      {/* 제출 내역 */}
      {insurances.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            제출 내역
          </h2>
          <div className="space-y-2">
            {insurances.map((ins) => {
              const st = STATUS_MAP[ins.status] ?? STATUS_MAP.PENDING;
              const Icon = st.icon;
              const isExpired = ins.status === "APPROVED" && new Date(ins.expiresAt) < new Date();
              return (
                <div key={ins.id} className="border rounded-xl p-4 bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-semibold text-sm">{ins.insurerName}</span>
                      <span className="text-xs text-muted-foreground">#{ins.policyNumber}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isExpired ? "bg-muted text-muted-foreground" : st.color}`}>
                      {isExpired ? "만료" : st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>보증금: {Number(ins.amount).toLocaleString()}원</span>
                    <span>발급: {new Date(ins.issuedAt).toLocaleDateString("ko-KR")}</span>
                    <span>만료: {new Date(ins.expiresAt).toLocaleDateString("ko-KR")}</span>
                  </div>
                  {ins.reviewNote && (
                    <p className="text-xs text-red-500">심사 메모: {ins.reviewNote}</p>
                  )}
                  <a
                    href={ins.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline"
                  >
                    증권 파일 보기 →
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
