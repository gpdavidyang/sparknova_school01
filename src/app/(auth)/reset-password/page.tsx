"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token || !email) {
    return (
      <div className="bg-card border rounded-2xl p-8 text-center space-y-4">
        <p className="text-sm text-destructive font-medium">유효하지 않은 링크입니다.</p>
        <Link href="/forgot-password" className="text-sm text-blue-500 hover:underline">
          비밀번호 찾기 다시 시도
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-card border rounded-2xl p-8 space-y-5 text-center">
        <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
          <CheckCircle className="h-7 w-7 text-blue-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">비밀번호 재설정 완료</h2>
          <p className="text-sm text-muted-foreground">새 비밀번호로 로그인하세요.</p>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          로그인하러 가기
        </button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "재설정에 실패했습니다.");
        return;
      }
      setDone(true);
    } catch {
      toast.error("요청에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border rounded-2xl p-8 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">새 비밀번호 설정</h2>
        <p className="text-sm text-muted-foreground">
          {email} 계정의 새 비밀번호를 입력하세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">새 비밀번호</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder="6자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border rounded-xl px-4 py-3 pr-10 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">비밀번호 확인</label>
          <input
            type="password"
            placeholder="비밀번호 재입력"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
          />
          {confirm && password !== confirm && (
            <p className="text-xs text-destructive">비밀번호가 일치하지 않습니다.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || (!!confirm && password !== confirm)}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm"
        >
          {loading ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>

      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        로그인으로 돌아가기
      </Link>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="bg-card border rounded-2xl p-8 h-64 animate-pulse" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
