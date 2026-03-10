"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface Props {
  courseId: string;
  isFree: boolean;
  enrolled: boolean;
  isLoggedIn?: boolean;
  courseSlug?: string;
}

export function EnrollButton({ courseId, isFree, enrolled: initialEnrolled, isLoggedIn = true, courseSlug }: Props) {
  const router = useRouter();
  const [enrolled, setEnrolled] = useState(initialEnrolled);
  const [loading, setLoading] = useState(false);

  if (enrolled) {
    return (
      <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
        <CheckCircle2 className="h-4 w-4" />
        수강 중
      </div>
    );
  }

  // 비로그인 상태
  if (!isLoggedIn) {
    const nextPath = courseSlug ? encodeURIComponent(courseSlug) : "";
    return (
      <div className="flex items-center gap-2">
        <Link
          href={`/signup${nextPath ? `?next=${nextPath}` : ""}`}
          className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors whitespace-nowrap"
        >
          무료로 가입하고 수강하기
        </Link>
        <Link
          href={`/login${nextPath ? `?next=${nextPath}` : ""}`}
          className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium border border-border bg-background hover:bg-muted transition-colors whitespace-nowrap"
        >
          로그인
        </Link>
      </div>
    );
  }

  if (!isFree) {
    return (
      <Button
        className="bg-blue-500 hover:bg-blue-600"
        onClick={() => router.push(`/checkout/course/${courseId}`)}
      >
        결제하고 수강하기
      </Button>
    );
  }

  async function handleEnroll() {
    setLoading(true);
    const res = await fetch(`/api/courses/${courseId}/enroll`, { method: "POST" });
    setLoading(false);

    if (res.status === 401) {
      toast.error("로그인이 필요합니다.");
      router.push("/login");
      return;
    }
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "수강 신청에 실패했습니다.");
      return;
    }
    setEnrolled(true);
    toast.success("수강 신청 완료! 학습을 시작해보세요 🎉");
    router.refresh();
  }

  return (
    <Button
      className="bg-blue-500 hover:bg-blue-600"
      onClick={handleEnroll}
      disabled={loading}
    >
      <BookOpen className="h-4 w-4 mr-2" />
      {loading ? "신청 중..." : "무료 수강 신청"}
    </Button>
  );
}
