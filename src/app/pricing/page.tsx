import Link from "next/link";
import { Check, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "요금제",
  description: "Free 15% · Pro ₩49,000 7% · Business ₩149,000 5% — 당신의 성장에 맞는 크리에이터 플랜을 선택하세요.",
  openGraph: {
    title: "SparkNova School 요금제",
    description: "강좌·멤버십·디지털 상품으로 수익을 창출하세요. 규모가 커질수록 수수료는 낮아집니다.",
  },
};

const plans = [
  {
    name: "Free",
    price: null,
    priceLabel: "무료",
    fee: "15%",
    feeDesc: "결제 수수료",
    description: "개인 크리에이터로 시작해보세요.",
    color: "border-border",
    badge: null,
    features: [
      "커뮤니티 1개 생성",
      "강좌 무제한 등록",
      "디지털 상품 판매",
      "멤버십 결제",
      "기본 분석 리포트",
      "결제 수수료 15%",
    ],
    cta: "무료로 시작",
    ctaHref: "/signup",
    ctaStyle: "border border-border hover:bg-muted transition-colors",
  },
  {
    name: "Pro",
    price: 49000,
    priceLabel: "₩49,000",
    fee: "7%",
    feeDesc: "결제 수수료",
    description: "수익을 본격적으로 늘리고 싶은 크리에이터.",
    color: "border-blue-500 ring-2 ring-blue-500/20",
    badge: "인기",
    features: [
      "커뮤니티 5개 생성",
      "강좌 무제한 등록",
      "디지털 상품 판매",
      "멤버십 결제",
      "상세 분석 리포트",
      "결제 수수료 7%",
      "이메일 마케팅 연동",
      "우선 고객 지원",
    ],
    cta: "Pro 시작하기",
    ctaHref: "/signup?plan=pro",
    ctaStyle: "bg-blue-500 text-white hover:bg-blue-600 transition-colors",
  },
  {
    name: "Business",
    price: 149000,
    priceLabel: "₩149,000",
    fee: "5%",
    feeDesc: "결제 수수료",
    description: "팀 또는 대규모 크리에이터 비즈니스.",
    color: "border-border",
    badge: null,
    features: [
      "커뮤니티 무제한 생성",
      "강좌 무제한 등록",
      "디지털 상품 판매",
      "멤버십 결제",
      "고급 분석 리포트 + API",
      "결제 수수료 5%",
      "이메일 마케팅 연동",
      "전담 고객 지원",
      "화이트라벨 옵션",
      "팀 계정 (최대 5명)",
    ],
    cta: "Business 시작하기",
    ctaHref: "/signup?plan=business",
    ctaStyle: "border border-border hover:bg-muted transition-colors",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="border-b px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bold text-lg">SparkNova</Link>
          <div className="flex gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">로그인</Link>
            <Link href="/signup" className="text-sm px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">시작하기</Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-16 px-4 space-y-12">
        {/* 타이틀 */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">
            <Zap className="h-3.5 w-3.5" />
            크리에이터 요금제
          </div>
          <h1 className="text-4xl font-bold">당신의 성장에 맞는 플랜</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            강좌, 멤버십, 디지털 상품으로 수익을 창출하세요.<br />
            규모가 커질수록 수수료는 낮아집니다.
          </p>
        </div>

        {/* 요금제 카드 */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative border rounded-2xl p-6 bg-card flex flex-col ${plan.color}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="space-y-1 mb-6">
                <h2 className="text-lg font-bold">{plan.name}</h2>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.priceLabel}</span>
                  {plan.price && <span className="text-muted-foreground text-sm">/ 월</span>}
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-sm font-semibold">
                  수수료 <span className="text-blue-600">{plan.fee}</span>
                </div>
              </div>

              <ul className="space-y-2.5 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`block text-center py-2.5 rounded-xl text-sm font-medium ${plan.ctaStyle}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-xl font-bold text-center">자주 묻는 질문</h2>
          <div className="space-y-4">
            {[
              {
                q: "수수료는 어떻게 계산되나요?",
                a: "판매 금액에서 플랜별 수수료율이 차감됩니다. 예를 들어 Pro 플랜에서 10만원 강좌를 판매하면 수수료 7,000원을 제외한 93,000원을 수령합니다.",
              },
              {
                q: "무료 플랜에서 유료 플랜으로 언제든 업그레이드할 수 있나요?",
                a: "네, 언제든지 업그레이드 가능합니다. 업그레이드 즉시 해당 플랜의 혜택이 적용됩니다.",
              },
              {
                q: "환불 정책은 어떻게 되나요?",
                a: "결제 후 7일 이내에 서비스를 이용하지 않으셨다면 전액 환불이 가능합니다. 자세한 사항은 고객 지원팀에 문의해주세요.",
              },
              {
                q: "PG사 수수료는 별도인가요?",
                a: "네, 토스페이먼츠 PG 수수료(약 2~3%)는 별도로 차감됩니다. 플랜 수수료와 PG 수수료가 합산 차감됩니다.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="border rounded-xl p-4 space-y-2">
                <p className="font-semibold text-sm">{q}</p>
                <p className="text-sm text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA 배너 */}
        <div className="border rounded-2xl p-8 bg-card text-center space-y-4">
          <h2 className="text-xl font-bold">지금 바로 시작하세요</h2>
          <p className="text-muted-foreground">무료로 시작하고, 성장하면서 업그레이드하세요.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            <Zap className="h-4 w-4" />
            무료로 시작하기
          </Link>
        </div>
      </div>
    </div>
  );
}
