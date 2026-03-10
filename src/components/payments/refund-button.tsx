"use client";

import { useState } from "react";
import { RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  paymentId: string;
  amount: number;
  onRefunded: () => void;
}

export function RefundButton({ paymentId, amount, onRefunded }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleRefund() {
    if (!confirm(`${amount.toLocaleString()}원을 환불하시겠습니까?\n환불 후 멤버십/수강 권한이 즉시 해제됩니다.`)) return;
    setLoading(true);
    const res = await fetch(`/api/payments/${paymentId}/refund`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "환불에 실패했습니다.");
      return;
    }
    toast.success("환불이 완료되었습니다.");
    onRefunded();
  }

  return (
    <button
      onClick={handleRefund}
      disabled={loading}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
      환불
    </button>
  );
}
