"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Zap, CheckCircle2 } from "lucide-react";

interface Props {
  slug: string;
  initialCheckedIn: boolean;
}

export function DailyCheckinButton({ slug, initialCheckedIn }: Props) {
  const router = useRouter();
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);
  const [loading, setLoading] = useState(false);

  async function handleCheckin() {
    if (checkedIn) return;
    setLoading(true);
    const res = await fetch(`/api/communities/${slug}/checkin`, { method: "POST" });
    setLoading(false);

    if (!res.ok) {
      toast.error("오류가 발생했습니다.");
      return;
    }

    const data = await res.json();
    setCheckedIn(true);

    if (data.alreadyCheckedIn) {
      toast.info("오늘은 이미 출석체크를 완료했습니다.");
      return;
    }

    if (data.leveledUp) {
      toast.success(`🎉 레벨 ${data.newLevel} 달성! +${data.points} 포인트`, { duration: 4000 });
    } else {
      toast.success(`출석 완료! +${data.points} 포인트 획득`);
    }
    router.refresh();
  }

  return (
    <Button
      size="sm"
      className={`w-full text-xs h-8 ${
        checkedIn
          ? "bg-green-50 text-green-600 border border-green-200 hover:bg-green-50"
          : "bg-orange-500 hover:bg-orange-600 text-white"
      }`}
      variant="ghost"
      onClick={handleCheckin}
      disabled={loading || checkedIn}
    >
      {checkedIn ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
          오늘 출석 완료
        </>
      ) : (
        <>
          <Zap className="h-3.5 w-3.5 mr-1.5" />
          {loading ? "처리 중..." : "출석체크 +1P"}
        </>
      )}
    </Button>
  );
}
