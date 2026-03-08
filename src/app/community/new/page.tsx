"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function NewCommunityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", joinType: "FREE" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/communities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);

    if (!res.ok) {
      const { error } = await res.json();
      if (res.status === 401) {
        toast.error("로그인이 필요합니다.");
        router.push("/login");
        return;
      }
      toast.error(error ?? "커뮤니티 생성에 실패했습니다.");
      return;
    }

    const { slug } = await res.json();
    toast.success("커뮤니티가 생성되었습니다! 🎉");
    router.push(`/community/${slug}`);
  }

  return (
    <div className="max-w-lg mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">커뮤니티 만들기</CardTitle>
          <CardDescription>나만의 커뮤니티를 시작해보세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">커뮤니티 이름 *</Label>
              <Input
                id="name"
                placeholder="예: 마케팅 마스터 클래스"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">소개 (선택)</Label>
              <Textarea
                id="description"
                placeholder="커뮤니티를 간략히 소개해주세요..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="resize-none"
                rows={3}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label>가입 방식</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "FREE", label: "무료", desc: "누구나 무료로 가입" },
                  { value: "APPROVAL", label: "승인제", desc: "관리자 승인 후 가입" },
                ].map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, joinType: value })}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      form.joinType === value
                        ? "border-orange-500 bg-orange-50"
                        : "border-border hover:border-orange-200"
                    }`}
                  >
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={loading}
            >
              {loading ? "생성 중..." : "커뮤니티 만들기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
