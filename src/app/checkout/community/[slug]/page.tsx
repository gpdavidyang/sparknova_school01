"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { Users, CreditCard, Lock, Ticket, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CommunityInfo {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string | null;
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

export default function CommunityCheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [community, setCommunity] = useState<CommunityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  // 쿠폰
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);

  useEffect(() => {
    fetch(`/api/communities/${slug}/info`)
      .then((r) => r.json())
      .then(setCommunity)
      .catch(() => toast.error("커뮤니티 정보를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, [slug]);

  const finalPrice = appliedCoupon ? appliedCoupon.finalAmount : (community?.price ?? 0);

  async function applyCoupon() {
    if (!couponCode.trim() || !community) return;
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, communityId: community.id, amount: community.price }),
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
    if (!community) return;
    setPaying(true);

    try {
      const toss = await loadTossPayments(
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!
      );
      const payment = toss.payment({ customerKey: `comm_${community.id}` });

      const couponParam = appliedCoupon ? `&couponId=${appliedCoupon.couponId}` : "";

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: finalPrice },
        orderId: `community_${community.id}_${Date.now()}`,
        orderName: `${community.name} 멤버십 (30일)`,
        successUrl: `${window.location.origin}/checkout/success?type=community&slug=${slug}${couponParam}`,
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

  if (!community) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        커뮤니티를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-blue-50 border-2 border-blue-200 mx-auto">
            <Users className="h-7 w-7 text-blue-500" />
          </div>
          <h1 className="text-xl font-bold">커뮤니티 멤버십</h1>
          <p className="text-sm text-muted-foreground">{community.name}</p>
        </div>

        {/* 플랜 카드 */}
        <div className="border-2 border-blue-200 rounded-xl p-5 bg-blue-50/30 space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">구독 플랜</p>
            <p className="font-semibold">{community.name} 멤버십 · 30일</p>
            {community.description && (
              <p className="text-sm text-muted-foreground">{community.description}</p>
            )}
          </div>

          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {["커뮤니티 피드 무제한 이용", "강좌 · 클래스룸 접근", "멤버 전용 이벤트 참가", "리더보드 및 게임화 기능"].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <div className="border-t border-blue-200 pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">월 구독료</span>
              <span className={`text-lg font-bold ${appliedCoupon ? "line-through text-muted-foreground" : "text-blue-600"}`}>
                {community.price.toLocaleString()}원
              </span>
            </div>
            {appliedCoupon && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">쿠폰 할인</span>
                  <span className="text-green-600 font-medium">-{appliedCoupon.discount.toLocaleString()}원</span>
                </div>
                <div className="flex items-center justify-between border-t border-blue-200 pt-2">
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

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          토스페이먼츠 보안 결제
        </div>

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
