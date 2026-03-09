"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  slug: string;
  memberId: string;
  currentRole: string;
}

const ROLES = ["ADMIN", "MODERATOR", "MEMBER"] as const;
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "관리자",
  MODERATOR: "모더레이터",
  MEMBER: "멤버",
};

export function MemberActions({ slug, memberId, currentRole }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const changeRole = async (role: string) => {
    setLoading(true);
    try {
      await fetch(`/api/communities/${slug}/admin/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async () => {
    if (!confirm("이 멤버를 강제 탈퇴시키겠습니까?")) return;
    setLoading(true);
    try {
      await fetch(`/api/communities/${slug}/admin/members/${memberId}`, {
        method: "DELETE",
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentRole}
        disabled={loading}
        onChange={(e) => changeRole(e.target.value)}
        className="text-xs border rounded px-2 py-1 bg-background"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
        ))}
      </select>
      <button
        onClick={removeMember}
        disabled={loading}
        className="text-xs text-red-500 hover:text-red-700 transition-colors px-2 py-1 border border-red-200 rounded hover:bg-red-50"
      >
        추방
      </button>
    </div>
  );
}
