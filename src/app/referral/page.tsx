"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Share2, Gift, Users, TrendingUp, CheckCircle2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReferralData {
  code: string;
  shareUrl: string;
  clickCount: number;
  useCount: number;
  convertedCount: number;
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral/code")
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast.error("정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  async function copyCode() {
    if (!data) return;
    await navigator.clipboard.writeText(data.code);
    setCopied(true);
    toast.success("추천 코드가 복사되었습니다!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function copyLink() {
    if (!data) return;
    await navigator.clipboard.writeText(data.shareUrl);
    toast.success("초대 링크가 복사되었습니다!");
  }

  async function share() {
    if (!data) return;
    if (navigator.share) {
      await navigator.share({
        title: "SparkNova School 초대",
        text: `${data.code} 코드로 SparkNova School에 가입하세요!`,
        url: data.shareUrl,
      });
    } else {
      copyLink();
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center text-muted-foreground">
        로그인이 필요합니다.
      </div>
    );
  }

  const stats = [
    { label: "링크 클릭", value: data.clickCount, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "가입 완료", value: data.useCount, icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "전환 성공", value: data.convertedCount, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
  ];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-orange-50 border-2 border-orange-200 mx-auto">
          <Gift className="h-8 w-8 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold">추천인 센터</h1>
        <p className="text-sm text-muted-foreground">
          친구를 초대하고 함께 성장하세요.<br />
          추천 성공 시 <span className="text-orange-600 font-semibold">+50 포인트</span> 지급!
        </p>
      </div>

      {/* 추천 코드 카드 */}
      <div className="border-2 border-orange-200 rounded-2xl p-6 bg-gradient-to-br from-orange-50 to-pink-50 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center">
          나의 추천 코드
        </p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl font-bold tracking-widest text-orange-600 font-mono">
            {data.code}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={copyCode}
          >
            {copied ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* 공유 링크 */}
        <div className="bg-white rounded-xl p-3 flex items-center gap-2 border">
          <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground truncate flex-1">{data.shareUrl}</p>
          <Button size="sm" variant="ghost" className="shrink-0 h-7 text-xs" onClick={copyLink}>
            복사
          </Button>
        </div>

        {/* 공유 버튼 */}
        <Button
          className="w-full bg-orange-500 hover:bg-orange-600"
          onClick={share}
        >
          <Share2 className="h-4 w-4 mr-2" />
          초대 링크 공유하기
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="border rounded-xl p-4 bg-card text-center space-y-2">
            <div className={`h-10 w-10 rounded-full ${bg} flex items-center justify-center mx-auto`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* 추천 방법 안내 */}
      <div className="border rounded-xl p-5 bg-card space-y-3">
        <h3 className="font-semibold text-sm">추천 방법</h3>
        <ol className="space-y-2">
          {[
            "위의 추천 코드 또는 초대 링크를 친구에게 공유하세요.",
            "친구가 링크로 가입하거나 코드를 입력하면 추천이 등록됩니다.",
            "친구가 커뮤니티 활동을 시작하면 전환 성공으로 처리됩니다.",
            "전환 성공 시 나와 친구 모두 +50 포인트가 자동 지급됩니다.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="h-5 w-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
