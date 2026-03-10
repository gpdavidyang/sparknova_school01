"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Gift } from "lucide-react";
import { ReferralTracker } from "@/components/shared/referral-tracker";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      toast.error(error ?? "회원가입에 실패했습니다.");
      setLoading(false);
      return;
    }

    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    toast.success("환영합니다! 🎉");
    router.push("/explore");
    router.refresh();
  }

  async function handleSocial(provider: string) {
    setSocialLoading(provider);
    await signIn(provider, { callbackUrl: "/explore" });
  }

  return (
    <>
      {refCode && <ReferralTracker code={refCode} />}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <CardDescription>SparkNova School에 오신 것을 환영합니다</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 추천인 코드 배너 */}
          {refCode && (
            <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700">
              <Gift className="h-4 w-4 shrink-0" />
              <span>추천 코드 <strong>{refCode}</strong>가 적용되었습니다. 가입 후 보너스 포인트를 받으세요!</span>
            </div>
          )}

          {/* 소셜 가입 */}
          <div className="space-y-2 mb-6">
            <button
              type="button"
              onClick={() => handleSocial("google")}
              disabled={!!socialLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              {socialLoading === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Google로 시작하기
            </button>

            <button
              type="button"
              onClick={() => handleSocial("kakao")}
              disabled={!!socialLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 bg-[#FEE500] text-[#191919] hover:bg-[#FDD800]"
            >
              {socialLoading === "kakao" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M12 3C6.48 3 2 6.36 2 10.44c0 2.62 1.75 4.93 4.38 6.24l-1.12 4.16c-.1.36.3.64.6.44l4.96-3.28c.38.04.77.06 1.18.06 5.52 0 10-3.36 10-7.5S17.52 3 12 3z" fill="#191919"/>
                </svg>
              )}
              카카오로 시작하기
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs text-muted-foreground">
              <span className="bg-card px-2">또는 이메일로 가입</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                placeholder="홍길동"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="6자 이상"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">비밀번호 확인</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="비밀번호 재입력"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? "가입 중..." : "회원가입"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-blue-500 hover:underline font-medium">
              로그인
            </Link>
          </p>
        </CardContent>
      </Card>
    </>
  );
}
