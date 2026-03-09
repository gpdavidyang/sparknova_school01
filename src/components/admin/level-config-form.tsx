"use client";

import { useState } from "react";
import { DEFAULT_LEVELS } from "@/lib/gamification";

interface LevelEntry {
  level: number;
  name: string;
  minPoints: number;
}

interface Props {
  slug: string;
  initialLevels: LevelEntry[];
}

export function LevelConfigForm({ slug, initialLevels }: Props) {
  const [levels, setLevels] = useState<LevelEntry[]>(initialLevels);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (index: number, field: keyof LevelEntry, value: string | number) => {
    setLevels((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`/api/communities/${slug}/admin/levels`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levels }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setLevels(DEFAULT_LEVELS.map((l) => ({ ...l })));
    setSaved(false);
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-xl overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-16">레벨</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">레벨명</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-32">최소 포인트</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((l, i) => (
              <tr key={l.level} className="border-b last:border-0">
                <td className="px-4 py-2 text-center font-medium text-muted-foreground">{l.level}</td>
                <td className="px-4 py-2">
                  <input
                    value={l.name}
                    onChange={(e) => update(i, "name", e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={l.minPoints}
                    onChange={(e) => update(i, "minPoints", Number(e.target.value))}
                    className="w-full border rounded px-2 py-1 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-orange-400"
                    min={0}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-muted transition-colors"
        >
          기본값으로 초기화
        </button>
        {saved && <span className="text-sm text-green-600">저장되었습니다.</span>}
      </div>
    </div>
  );
}
