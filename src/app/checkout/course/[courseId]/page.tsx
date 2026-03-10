"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { CreditCard, BookOpen, Lock, Ticket, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CourseInfo {
  id: string;
  title: string;
  price: number;
  communityId: string;
  communitySlug: string;
  communityName: string;
}

interface CouponResult {
  valid: boolean;
  couponId: string;
  discountType: string;
  discountValue: number;
  discount: number;
  finalAmount: number;
  description: string | null;
}

export default function CourseCheckoutPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  // 쿠폰
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);

  useEffect(() => {
    fetch(`/api/courses/${courseId}/info`)
      .then((r) => r.json())
      .then(setCourse)
      .catch(() => toast.error("강좌 정보를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, [courseId]);

  const finalPrice = appliedCoupon ? appliedCoupon.finalAmount : (course?.price ?? 0);

  async function applyCoupon() {
    if (!couponCode.trim() || !course) return;
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, communityId: course.communityId, amount: course.price }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      setAppliedCoupon(data);
      toast.success(`${data.discount.toLocaleString()}원 할인 적용!`);
    } catch {
      toast.error("쿠폰 확인에 실패했습니다.");
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
  }

  async function handlePay() {
    if (!course) return;
    setPaying(true);

    try {
      const toss = await loadTossPayments(
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!
      );
      const payment = toss.payment({ customerKey: `user_${courseId}` });

      const couponParam = appliedCoupon ? `&couponId=${appliedCoupon.couponId}` : "";

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: finalPrice },
        orderId: `course_${courseId}_${Date.now()}`,
        orderName: course.title,
        successUrl: `${window.location.origin}/checkout/success?type=course&courseId=${courseId}&slug=${course.communitySlug}${couponParam}`,
        failUrl: `${window.location.origin}/checkout/fail`,
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.message !== "결제가 취소되었습니다.") {
        toast.error(e.message ?? "결제 중 오류가 발생했습니다.");
      }
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
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
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-blue-50 border-2 border-blue-200 mx-auto">
            <BookOpen className="h-7 w-7 text-blue-500" />
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

          <div className="border-t pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">결제 금액</span>
              <span className={`text-lg font-bold ${appliedCoupon ? "line-through text-muted-foreground" : "text-blue-600"}`}>
                {course.price.toLocaleString()}원
              </span>
            </div>
            {appliedCoupon && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">쿠폰 할인</span>
                  <span className="text-green-600 font-medium">-{appliedCoupon.discount.toLocaleString()}원</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm font-medium">최종 결제액</span>
                  <span className="text-xl font-bold text-blue-600">{finalPrice.toLocaleString()}원</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 쿠폰 입력 */}
        <div className="space-y-2">
          {appliedCoupon ? (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg text-sm">
              <Check className="h-4 w-4 text-green-600 shrink-0" />
              <span className="flex-1 text-green-700">
                <strong>{couponCode}</strong> 적용됨
                {appliedCoupon.description ? ` — ${appliedCoupon.description}` : ""}
              </span>
              <button onClick={removeCoupon} className="text-green-500 hover:text-green-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="쿠폰 코드 입력"
                  className="w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm bg-background font-mono uppercase placeholder:normal-case placeholder:font-sans"
                  onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                />
              </div>
              <button
                onClick={applyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="px-4 py-2.5 text-sm font-medium border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                {couponLoading ? "확인 중..." : "적용"}
              </button>
            </div>
          )}
        </div>

        {/* 보안 배지 */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          토스페이먼츠 보안 결제
        </div>

        {/* 결제 버튼 */}
        <Button
          className="w-full bg-blue-500 hover:bg-blue-600 h-12 text-base"
          onClick={handlePay}
          disabled={paying}
        >
          <CreditCard className="h-5 w-5 mr-2" />
          {paying ? "결제창 열는 중..." : `${finalPrice.toLocaleString()}원 결제하기`}
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
