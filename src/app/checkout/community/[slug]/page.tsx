"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { Users, CreditCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CommunityInfo {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string | null;
}

export default function CommunityCheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [community, setCommunity] = useState<CommunityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetch(`/api/communities/${slug}/info`)
      .then((r) => r.json())
      .then(setCommunity)
      .catch(() => toast.error("커뮤니티 정보를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handlePay() {
    if (!community) return;
    setPaying(true);

    try {
      const toss = await loadTossPayments(
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!
      );
      const payment = toss.payment({ customerKey: `comm_${community.id}` });

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: community.price },
        orderId: `community_${community.id}_${Date.now()}`,
        orderName: `${community.name} 멤버십 (30일)`,
        successUrl: `${window.location.origin}/checkout/success?type=community&slug=${slug}`,
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
        <div className="h-8 w-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
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
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-orange-50 border-2 border-orange-200 mx-auto">
            <Users className="h-7 w-7 text-orange-500" />
          </div>
          <h1 className="text-xl font-bold">커뮤니티 멤버십</h1>
          <p className="text-sm text-muted-foreground">{community.name}</p>
        </div>

        {/* 플랜 카드 */}
        <div className="border-2 border-orange-200 rounded-xl p-5 bg-orange-50/30 space-y-4">
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
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <div className="border-t border-orange-200 pt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">월 구독료</span>
            <span className="text-xl font-bold text-orange-600">
              {community.price.toLocaleString()}원
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          토스페이먼츠 보안 결제
        </div>

        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-base"
          onClick={handlePay}
          disabled={paying}
        >
          <CreditCard className="h-5 w-5 mr-2" />
          {paying ? "결제창 열는 중..." : `${community.price.toLocaleString()}원 결제하기`}
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
