"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wallet, Clock, CheckCircle2, ArrowUpRight, Users, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Conversion {
  id: string;
  referredName: string | null;
  referredEmail: string;
  convertedAt: string | null;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  bankName: string | null;
  requestedAt: string;
  processedAt: string | null;
  note: string | null;
}

interface EarningsData {
  totalEarned: number;
  grantedAmount: number;
  pendingAmount: number;
  paidOutAmount: number;
  availableBalance: number;
  convertedCount: number;
  recentConversions: Conversion[];
  payouts: Payout[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "대기", color: "bg-yellow-100 text-yellow-700" },
  PROCESSING: { label: "처리 중", color: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "완료", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "반려", color: "bg-red-100 text-red-700" },
};

export default function ReferralEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ amount: "", bankName: "", accountNo: "", holderName: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/referral/earnings")
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast.error("정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  async function submitPayout() {
    if (!payoutForm.amount || !payoutForm.bankName || !payoutForm.accountNo || !payoutForm.holderName) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/referral/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payoutForm, amount: Number(payoutForm.amount) }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("출금 요청이 접수되었습니다.");
      setShowPayoutForm(false);
      setPayoutForm({ amount: "", bankName: "", accountNo: "", holderName: "" });
      const refreshed = await fetch("/api/referral/earnings").then((r) => r.json());
      setData(refreshed);
    } catch {
      toast.error("출금 요청에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center text-muted-foreground">
        로그인이 필요합니다.
      </div>
    );
  }

  const stats = [
    { label: "총 수익", value: data.totalEarned, icon: Wallet, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "지급 대기", value: data.pendingAmount, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50" },
    { label: "출금 가능", value: data.availableBalance, icon: Banknote, color: "text-green-500", bg: "bg-green-50" },
    { label: "출금 완료", value: data.paidOutAmount, icon: CheckCircle2, color: "text-purple-500", bg: "bg-purple-50" },
  ];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">추천 수익</h1>
          <p className="text-sm text-muted-foreground">추천 전환 {data.convertedCount}건</p>
        </div>
        <Link href="/referral" className="text-sm text-blue-500 hover:underline">
          추천인 센터 →
        </Link>
      </div>

      {/* 수익 카드 */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="border rounded-xl p-4 bg-card space-y-1">
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full ${bg} flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <p className="text-lg font-bold">{value.toLocaleString()}원</p>
          </div>
        ))}
      </div>

      {/* 출금 버튼 */}
      {data.availableBalance >= 10000 && !showPayoutForm && (
        <Button
          className="w-full bg-green-500 hover:bg-green-600"
          onClick={() => {
            setPayoutForm((p) => ({ ...p, amount: String(data.availableBalance) }));
            setShowPayoutForm(true);
          }}
        >
          <ArrowUpRight className="h-4 w-4 mr-2" />
          출금 요청하기
        </Button>
      )}

      {data.availableBalance < 10000 && data.availableBalance > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          최소 출금 금액: 10,000원 (현재 잔액: {data.availableBalance.toLocaleString()}원)
        </p>
      )}

      {/* 출금 요청 폼 */}
      {showPayoutForm && (
        <div className="border rounded-xl p-5 space-y-4 bg-card">
          <h3 className="font-semibold text-sm">출금 요청</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">출금 금액 (원)</label>
              <input
                type="number"
                value={payoutForm.amount}
                onChange={(e) => setPayoutForm((p) => ({ ...p, amount: e.target.value }))}
                max={data.availableBalance}
                min={10000}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">은행명</label>
              <input
                value={payoutForm.bankName}
                onChange={(e) => setPayoutForm((p) => ({ ...p, bankName: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                placeholder="국민은행"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">계좌번호</label>
              <input
                value={payoutForm.accountNo}
                onChange={(e) => setPayoutForm((p) => ({ ...p, accountNo: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                placeholder="123-456-789012"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">예금주</label>
              <input
                value={payoutForm.holderName}
                onChange={(e) => setPayoutForm((p) => ({ ...p, holderName: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                placeholder="홍길동"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={submitPayout} disabled={submitting} className="bg-green-500 hover:bg-green-600">
              {submitting ? "요청 중..." : "출금 요청"}
            </Button>
            <Button variant="ghost" onClick={() => setShowPayoutForm(false)}>
              취소
            </Button>
          </div>
        </div>
      )}

      {/* 전환 내역 */}
      {data.recentConversions.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            최근 전환 내역
          </h2>
          <div className="border rounded-xl overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">추천 가입자</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">전환일</th>
                </tr>
              </thead>
              <tbody>
                {data.recentConversions.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{c.referredName ?? "사용자"}</p>
                      <p className="text-xs text-muted-foreground">{c.referredEmail}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                      {c.convertedAt ? new Date(c.convertedAt).toLocaleDateString("ko-KR") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 출금 내역 */}
      {data.payouts.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Banknote className="h-4 w-4 text-green-500" />
            출금 내역
          </h2>
          <div className="space-y-2">
            {data.payouts.map((p) => {
              const st = STATUS_LABELS[p.status] ?? { label: p.status, color: "bg-muted text-muted-foreground" };
              return (
                <div key={p.id} className="border rounded-xl p-4 bg-card flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{p.amount.toLocaleString()}원</p>
                    <p className="text-xs text-muted-foreground">
                      {p.bankName} · {new Date(p.requestedAt).toLocaleDateString("ko-KR")}
                    </p>
                    {p.note && <p className="text-xs text-red-500 mt-0.5">{p.note}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
