"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

interface Props {
  lessonId: string;
  isCompleted: boolean;
  nextLessonHref: string;
}

export function LessonCompleteButton({ lessonId, isCompleted: init, nextLessonHref }: Props) {
  const router = useRouter();
  const [completed, setCompleted] = useState(init);
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    if (completed) {
      router.push(nextLessonHref);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/lessons/${lessonId}/complete`, { method: "POST" });
    setLoading(false);

    if (!res.ok) {
      toast.error("오류가 발생했습니다.");
      return;
    }
    const data = await res.json();
    setCompleted(true);

    if (data.courseCompleted) {
      toast.success("🎉 강좌를 완료했습니다! 수료증이 발급되었습니다.", { duration: 5000 });
    } else {
      toast.success("레슨 완료! +5 포인트 획득");
    }
    router.refresh();
    setTimeout(() => router.push(nextLessonHref), 800);
  }

  return (
    <Button
      onClick={handleComplete}
      disabled={loading}
      className={completed ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"}
    >
      {completed ? (
        <>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          다음 레슨
          <ArrowRight className="h-4 w-4 ml-2" />
        </>
      ) : (
        <>
          <Circle className="h-4 w-4 mr-2" />
          {loading ? "처리 중..." : "완료 표시"}
        </>
      )}
    </Button>
  );
}
