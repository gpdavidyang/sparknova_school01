"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { CreditCard, BookOpen, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CourseInfo {
  id: string;
  title: string;
  price: number;
  communitySlug: string;
  communityName: string;
}

export default function CourseCheckoutPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${courseId}/info`)
      .then((r) => r.json())
      .then(setCourse)
      .catch(() => toast.error("강좌 정보를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, [courseId]);

  async function handlePay() {
    if (!course) return;
    setPaying(true);

    try {
      const toss = await loadTossPayments(
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!
      );
      const payment = toss.payment({ customerKey: `user_${courseId}` });

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: course.price },
        orderId: `course_${courseId}_${Date.now()}`,
        orderName: course.title,
        successUrl: `${window.location.origin}/checkout/success?type=course&courseId=${courseId}&slug=${course.communitySlug}`,
        failUrl: `${window.location.origin}/checkout/fail`,
      });
    } catch (e: unknown) {
      // 사용자가 직접 취소한 경우는 에러 표시 안 함
      if (e instanceof Error && e.message !== "결제가 취소되었습니다.") {
        toast.error(e.message ?? "결제 중 오류가 발생했습니다.");
      }
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        강좌를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-orange-50 border-2 border-orange-200 mx-auto">
            <BookOpen className="h-7 w-7 text-orange-500" />
          </div>
          <h1 className="text-xl font-bold">강좌 결제</h1>
          <p className="text-sm text-muted-foreground">{course.communityName}</p>
        </div>

        {/* 강좌 정보 카드 */}
        <div className="border rounded-xl p-5 bg-card space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">결제 항목</p>
            <p className="font-semibold">{course.title}</p>
          </div>

          <div className="border-t pt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">결제 금액</span>
            <span className="text-xl font-bold text-orange-600">
              {course.price.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 보안 배지 */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          토스페이먼츠 보안 결제
        </div>

        {/* 결제 버튼 */}
        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-base"
          onClick={handlePay}
          disabled={paying}
        >
          <CreditCard className="h-5 w-5 mr-2" />
          {paying ? "결제창 열는 중..." : `${course.price.toLocaleString()}원 결제하기`}
        </Button>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => router.back()}
          disabled={paying}
        >
          돌아가기
        </Button>
      </div>
    </div>
  );
}
