"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/ui/image-upload";

interface Props {
  initial: {
    name: string;
    bio: string;
    avatarUrl: string;
    coverUrl: string;
  };
}

export function ProfileForm({ initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setSaved(false);
    setError("");
  };

  const save = async () => {
    if (!form.name.trim()) { setError("이름을 입력해주세요."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "저장 실패");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 아바타 & 커버 업로드 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">프로필 사진</label>
          <ImageUpload
            value={form.avatarUrl}
            onChange={(url) => set("avatarUrl", url)}
            uploadType="avatar"
            aspectRatio="square"
            placeholder="프로필 사진 업로드"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">커버 이미지</label>
          <ImageUpload
            value={form.coverUrl}
            onChange={(url) => set("coverUrl", url)}
            uploadType="cover"
            aspectRatio="wide"
            placeholder="커버 이미지 업로드"
          />
        </div>
      </div>

      {/* 이름 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">이름</label>
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="표시 이름"
        />
      </div>

      {/* 소개 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">한 줄 소개</label>
        <textarea
          value={form.bio}
          onChange={(e) => set("bio", e.target.value)}
          rows={2}
          className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
          placeholder="나를 소개해보세요..."
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground text-right">{form.bio.length}/200</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장하기"}
        </button>
        {saved && <span className="text-sm text-green-600">저장되었습니다.</span>}
      </div>
    </div>
  );
}
