"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Copy, ToggleLeft, ToggleRight } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { usages: number };
}

interface Props {
  slug: string;
  coupons: Coupon[];
}

export function CouponManager({ slug, coupons: initial }: Props) {
  const router = useRouter();
  const [coupons, setCoupons] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    discountValue: "",
    minAmount: "",
    maxUses: "",
    expiresAt: "",
  });

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm((p) => ({ ...p, code }));
  };

  const createCoupon = async () => {
    if (!form.code || !form.discountValue) {
      toast.error("코드와 할인 값을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/communities/${slug}/admin/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          discountValue: Number(form.discountValue),
          minAmount: form.minAmount ? Number(form.minAmount) : null,
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          expiresAt: form.expiresAt || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "생성 실패");
        return;
      }
      toast.success("쿠폰이 생성되었습니다.");
      setShowForm(false);
      setForm({ code: "", description: "", discountType: "PERCENTAGE", discountValue: "", minAmount: "", maxUses: "", expiresAt: "" });
      router.refresh();
    } catch {
      toast.error("생성에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    const res = await fetch(`/api/communities/${slug}/admin/coupons/${coupon.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !coupon.isActive }),
    });
    if (res.ok) {
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, isActive: !c.isActive } : c))
      );
      toast.success(coupon.isActive ? "비활성화됨" : "활성화됨");
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/communities/${slug}/admin/coupons/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast.success("삭제되었습니다.");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("코드가 복사되었습니다.");
  };

  return (
    <div className="space-y-4">
      {/* 생성 버튼 */}
      {!showForm && (
        <button
          onClick={() => { setShowForm(true); generateCode(); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          새 쿠폰 만들기
        </button>
      )}

      {/* 생성 폼 */}
      {showForm && (
        <div className="border rounded-xl p-5 space-y-4 bg-card">
          <h3 className="font-semibold text-sm">새 쿠폰</h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">쿠폰 코드</label>
              <div className="flex gap-2">
                <input
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background font-mono"
                  placeholder="SUMMER2026"
                />
                <button onClick={generateCode} className="text-xs text-blue-500 hover:underline whitespace-nowrap">
                  자동 생성
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">설명 (선택)</label>
              <input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                placeholder="여름 특별 할인"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">할인 유형</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value as "PERCENTAGE" | "FIXED" }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
              >
                <option value="PERCENTAGE">비율 (%)</option>
                <option value="FIXED">정액 (원)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                할인 값 {form.discountType === "PERCENTAGE" ? "(%)" : "(원)"}
              </label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                placeholder={form.discountType === "PERCENTAGE" ? "10" : "5000"}
                min={1}
                max={form.discountType === "PERCENTAGE" ? 100 : undefined}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">최소 금액 (선택)</label>
              <input
                type="number"
                value={form.minAmount}
                onChange={(e) => setForm((p) => ({ ...p, minAmount: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                placeholder="10000"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">최대 사용 횟수 (선택)</label>
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                placeholder="무제한"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">만료일 (선택)</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={createCoupon}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-50"
            >
              {saving ? "생성 중..." : "쿠폰 생성"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 쿠폰 목록 */}
      {coupons.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground py-8 text-center">아직 쿠폰이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`border rounded-xl p-4 flex items-center gap-4 ${
                !coupon.isActive ? "opacity-60" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    {coupon.code}
                  </code>
                  <button onClick={() => copyCode(coupon.code)} className="text-muted-foreground hover:text-foreground">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  {!coupon.isActive && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">비활성</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {coupon.discountType === "PERCENTAGE"
                    ? `${coupon.discountValue}% 할인`
                    : `${coupon.discountValue.toLocaleString()}원 할인`}
                  {coupon.minAmount ? ` · 최소 ${coupon.minAmount.toLocaleString()}원` : ""}
                  {coupon.description ? ` · ${coupon.description}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  사용 {coupon._count.usages}회
                  {coupon.maxUses ? ` / ${coupon.maxUses}회` : ""}
                  {coupon.expiresAt
                    ? ` · ${new Date(coupon.expiresAt).toLocaleDateString("ko-KR")}까지`
                    : ""}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => toggleActive(coupon)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                  title={coupon.isActive ? "비활성화" : "활성화"}
                >
                  {coupon.isActive ? <ToggleRight className="h-5 w-5 text-blue-500" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => deleteCoupon(coupon.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
