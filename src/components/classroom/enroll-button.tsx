"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle2 } from "lucide-react";

interface Props {
  courseId: string;
  isFree: boolean;
  enrolled: boolean;
}

export function EnrollButton({ courseId, isFree, enrolled: initialEnrolled }: Props) {
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

  if (!isFree) {
    return (
      <Button
        className="bg-orange-500 hover:bg-orange-600"
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
      className="bg-orange-500 hover:bg-orange-600"
      onClick={handleEnroll}
      disabled={loading}
    >
      <BookOpen className="h-4 w-4 mr-2" />
      {loading ? "신청 중..." : "무료 수강 신청"}
    </Button>
  );
}
