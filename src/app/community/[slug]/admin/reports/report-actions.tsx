"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Props {
  reportId: string;
  currentStatus: string;
  slug: string;
}

const ACTIONS = [
  { value: "REVIEWED", label: "검토 완료" },
  { value: "DISMISSED", label: "무시" },
  { value: "REMOVED", label: "삭제 처리" },
];

export function ReportActions({ reportId, currentStatus, slug }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleUpdate(newStatus: string) {
    setLoading(true);
    const res = await fetch(`/api/communities/${slug}/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    if (!res.ok) { toast.error("처리에 실패했습니다."); return; }
    setStatus(newStatus);
    toast.success("신고 상태가 업데이트되었습니다.");
  }

  if (status !== "PENDING") {
    return <span className="text-xs text-muted-foreground">처리됨</span>;
  }

  return (
    <div className="flex gap-1 justify-center flex-wrap">
      {ACTIONS.map((a) => (
        <button
          key={a.value}
          onClick={() => handleUpdate(a.value)}
          disabled={loading}
          className="text-xs px-2 py-1 border rounded-lg hover:bg-muted transition-colors disabled:opacity-40"
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
