"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      toast.error("요청에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="bg-card border rounded-2xl p-8 space-y-5 text-center">
        <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
          <Mail className="h-7 w-7 text-blue-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">이메일을 확인하세요</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">{email}</span>으로<br />
            비밀번호 재설정 링크를 발송했습니다.<br />
            이메일이 없다면 스팸함도 확인해보세요.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          로그인으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-2xl p-8 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">비밀번호 찾기</h2>
        <p className="text-sm text-muted-foreground">
          가입한 이메일을 입력하면 재설정 링크를 보내드립니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">이메일</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm"
        >
          {loading ? "발송 중..." : "재설정 링크 받기"}
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
