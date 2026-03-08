import Link from "next/link";
import { Zap, Users, BookOpen, Trophy, Gift, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Users,
    title: "커뮤니티 피드",
    desc: "수강생들과 게시물을 나누고, 좋아요와 댓글로 깊이 교류하세요.",
  },
  {
    icon: BookOpen,
    title: "온라인 강좌",
    desc: "동영상 강의와 학습 자료를 체계적으로 관리하고 수강생의 진도를 추적하세요.",
  },
  {
    icon: Trophy,
    title: "게임화 시스템",
    desc: "포인트, 레벨, 리더보드로 수강생의 자발적 참여와 학습 동기를 높이세요.",
  },
  {
    icon: Gift,
    title: "Referral 프로그램",
    desc: "수강생이 수강생을 데려오는 구조. 추천인 보상으로 커뮤니티를 함께 키우세요.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center py-12 space-y-6">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-full text-sm font-medium">
          <Zap className="h-4 w-4" fill="currentColor" />
          지식 비즈니스의 새로운 시작
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          당신의 지식이{" "}
          <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            세계를 바꿉니다
          </span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          커뮤니티 기반 글로벌 지식 비즈니스 플랫폼.
          <br />
          1인 사업가부터 기업강사까지, 수강생을 팬으로 만드세요.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/community/new"
            className={cn(buttonVariants({ size: "lg" }), "bg-orange-500 hover:bg-orange-600")}
          >
            커뮤니티 만들기 <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/explore"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            커뮤니티 탐색
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Icon className="h-5 w-5 text-orange-500" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
