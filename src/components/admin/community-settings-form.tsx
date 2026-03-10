"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/ui/image-upload";

interface CommunitySettings {
  name: string;
  description: string;
  isPublic: boolean;
  joinType: string;
  price: number | null;
  showClassroom: boolean;
  showCalendar: boolean;
  avatarUrl?: string;
  coverUrl?: string;
}

interface Props {
  slug: string;
  initial: CommunitySettings;
}

export function CommunitySettingsForm({ slug, initial }: Props) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof CommunitySettings, value: unknown) => {
    setForm((p) => ({ ...p, [key]: value }));
    setSaved(false);
    setError("");
  };

  const save = async () => {
    if (!form.name.trim()) { setError("커뮤니티 이름을 입력해주세요."); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/communities/${slug}/admin/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: form.joinType === "PAID" ? form.price : null,
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
    } catch {
      setError("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-lg">
      {/* 커뮤니티 이름 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">커뮤니티 이름</label>
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      {/* 이미지 업로드 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">아바타 이미지</label>
          <ImageUpload
            value={form.avatarUrl}
            onChange={(url) => set("avatarUrl" as keyof CommunitySettings, url)}
            uploadType="avatar"
            aspectRatio="square"
            placeholder="커뮤니티 아이콘"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">커버 이미지</label>
          <ImageUpload
            value={form.coverUrl}
            onChange={(url) => set("coverUrl" as keyof CommunitySettings, url)}
            uploadType="cover"
            aspectRatio="wide"
            placeholder="커버 이미지"
          />
        </div>
      </div>

      {/* 설명 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">소개</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
          placeholder="커뮤니티를 소개해주세요."
        />
      </div>

      {/* 공개 여부 */}
      <div className="flex items-center justify-between border rounded-lg px-4 py-3">
        <div>
          <p className="text-sm font-medium">공개 커뮤니티</p>
          <p className="text-xs text-muted-foreground">누구나 커뮤니티를 검색/조회할 수 있습니다.</p>
        </div>
        <button
          onClick={() => set("isPublic", !form.isPublic)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            form.isPublic ? "bg-blue-500" : "bg-gray-200"
          }`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            form.isPublic ? "translate-x-4" : "translate-x-1"
          }`} />
        </button>
      </div>

      {/* 가입 유형 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">가입 유형</label>
        <select
          value={form.joinType}
          onChange={(e) => set("joinType", e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="FREE">무료</option>
          <option value="PAID">유료 구독</option>
          <option value="INVITE">초대제</option>
        </select>
      </div>

      {/* 유료 가격 */}
      {form.joinType === "PAID" && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">월 구독료 (원)</label>
          <input
            type="number"
            value={form.price ?? ""}
            onChange={(e) => set("price", e.target.value ? Number(e.target.value) : null)}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="예: 9900"
            min={0}
          />
        </div>
      )}

      {/* 탭 표시 설정 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">표시 탭</label>
        {[
          { key: "showClassroom", label: "클래스룸" },
          { key: "showCalendar",  label: "캘린더" },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between border rounded-lg px-4 py-3">
            <p className="text-sm">{label} 탭 표시</p>
            <button
              onClick={() => set(key as keyof CommunitySettings, !form[key as keyof CommunitySettings])}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                form[key as keyof CommunitySettings] ? "bg-blue-500" : "bg-gray-200"
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                form[key as keyof CommunitySettings] ? "translate-x-4" : "translate-x-1"
              }`} />
            </button>
          </div>
        ))}
      </div>

      {/* 저장 */}
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
