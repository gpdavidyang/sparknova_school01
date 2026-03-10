import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Zap, Users, BookOpen, Trophy, Gift, ArrowRight,
  CheckCircle, Star, LogIn, Play, Lock,
} from "lucide-react";
import { ReferralTracker } from "@/components/shared/referral-tracker";

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

const perks = [
  "커뮤니티 무제한 개설",
  "강좌 & 레슨 관리",
  "Toss 결제 연동",
  "게임화 / 뱃지 시스템",
  "추천인 리워드",
  "다크 모드 지원",
];

function getYoutubeThumbnail(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
}

interface Props {
  searchParams: Promise<{ ref?: string }>;
}

export default async function LandingPage({ searchParams }: Props) {
  const { ref } = await searchParams;
  const session = await auth();
  if (session?.user) redirect("/explore");

  const [recentCourses, recentLessons] = await Promise.all([
    db.course.findMany({
      where: { isPublished: true, community: { isPublic: true, isActive: true } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        community: { select: { name: true, slug: true, avatarUrl: true } },
        _count: { select: { enrollments: true } },
      },
    }),
    db.lesson.findMany({
      where: {
        type: "VIDEO",
        isFree: true,
        isPublished: true,
        videoUrl: { not: null },
        module: {
          isPublished: true,
          course: { isPublished: true, community: { isPublic: true, isActive: true } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        module: {
          include: {
            course: {
              include: {
                community: { select: { name: true, slug: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  // CSS variables override: force light mode regardless of html.dark class
  const lightVars: React.CSSProperties = {
    ["--background" as string]: "oklch(1 0 0)",
    ["--foreground" as string]: "oklch(0.148 0 0)",
    ["--card" as string]: "oklch(1 0 0)",
    ["--card-foreground" as string]: "oklch(0.148 0 0)",
    ["--popover" as string]: "oklch(1 0 0)",
    ["--popover-foreground" as string]: "oklch(0.148 0 0)",
    ["--primary" as string]: "oklch(0.604 0.213 264)",
    ["--primary-foreground" as string]: "oklch(1 0 0)",
    ["--secondary" as string]: "oklch(0.963 0 0)",
    ["--secondary-foreground" as string]: "oklch(0.148 0 0)",
    ["--muted" as string]: "oklch(0.978 0 0)",
    ["--muted-foreground" as string]: "oklch(0.556 0 0)",
    ["--accent" as string]: "oklch(0.963 0 0)",
    ["--accent-foreground" as string]: "oklch(0.148 0 0)",
    ["--border" as string]: "oklch(0.921 0 0)",
    ["--input" as string]: "oklch(0.921 0 0)",
    ["--ring" as string]: "oklch(0.604 0.213 264)",
    colorScheme: "light",
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={lightVars}>
      {ref && <ReferralTracker code={ref} />}
      {/* 네비게이션 */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Zap className="h-6 w-6 text-blue-500" fill="currentColor" />
            <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
              SparkNova
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              <LogIn className="h-4 w-4" />
              무료로 시작하기
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 py-24 text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium">
            <Zap className="h-4 w-4" fill="currentColor" />
            지식 비즈니스의 새로운 시작
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
            당신의 지식이{" "}
            <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
              세계를 바꿉니다
            </span>
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            커뮤니티 기반 글로벌 지식 비즈니스 플랫폼.
            <br />
            1인 사업가부터 기업강사까지, 수강생을 팬으로 만드세요.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-base font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
            >
              무료로 커뮤니티 만들기 <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-base font-medium border bg-background hover:bg-muted transition-colors"
            >
              커뮤니티 탐색
            </Link>
          </div>
        </section>

        {/* 최신 강좌 */}
        {recentCourses.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 py-16 space-y-8">
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-500">지금 바로 시작</p>
                <h2 className="text-2xl font-bold">플랫폼의 인기 강좌</h2>
              </div>
              <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                전체 보기 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {recentCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/community/${course.community.slug}/classroom/${course.id}`}
                  className="group rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-blue-400 opacity-60" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {course.isFree ? (
                        <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">FREE</span>
                      ) : (
                        <span className="bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Lock className="h-2.5 w-2.5" />₩{course.price?.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 space-y-1.5">
                    <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1.5">
                      {course.community.avatarUrl ? (
                        <img src={course.community.avatarUrl} alt="" className="h-4 w-4 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className="h-4 w-4 rounded-full bg-blue-100 shrink-0 inline-block" />
                      )}
                      {course.community.name}
                    </p>
                    <p className="text-sm font-medium line-clamp-2 leading-snug">{course.title}</p>
                    <p className="text-xs text-muted-foreground">{course._count.enrollments.toLocaleString()}명 수강 중</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 무료 영상 미리보기 */}
        {recentLessons.length > 0 && (
          <section className="bg-muted/20 py-16">
            <div className="max-w-6xl mx-auto px-6 space-y-8">
              <div className="space-y-1">
                <p className="text-sm font-medium text-violet-500">무료 공개 레슨</p>
                <h2 className="text-2xl font-bold">지금 바로 무료로 들어보세요</h2>
                <p className="text-sm text-muted-foreground">가입 없이 미리 확인할 수 있는 강의 샘플</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {recentLessons.map((lesson) => {
                  const course = lesson.module.course;
                  const thumb = getYoutubeThumbnail(lesson.videoUrl);
                  return (
                    <Link
                      key={lesson.id}
                      href={`/community/${course.community.slug}/classroom/${course.id}/lessons/${lesson.id}`}
                      className="group rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-video bg-muted relative overflow-hidden">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={lesson.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
                            <Play className="h-8 w-8 text-violet-400 opacity-60" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-10 w-10 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="h-5 w-5 text-white fill-white" />
                          </div>
                        </div>
                        <span className="absolute bottom-2 left-2 bg-violet-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">무료</span>
                        {lesson.duration && (
                          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                            {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, "0")}
                          </span>
                        )}
                      </div>
                      <div className="p-3 space-y-1">
                        <p className="text-sm font-medium line-clamp-2 leading-snug">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{course.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          {course.community.avatarUrl ? (
                            <img src={course.community.avatarUrl} alt="" className="h-3.5 w-3.5 rounded-full object-cover shrink-0" />
                          ) : (
                            <span className="h-3.5 w-3.5 rounded-full bg-violet-100 shrink-0 inline-block" />
                          )}
                          {course.community.name}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="text-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-xl transition-colors"
                >
                  가입하고 전체 강의 보기 <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 포함된 기능 */}
        <section className="bg-muted/30 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {perks.map((perk) => (
                <div key={perk} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
                  {perk}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 py-20 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">크리에이터에게 필요한 모든 것</h2>
            <p className="text-muted-foreground">강좌 판매부터 커뮤니티 운영까지, 하나의 플랫폼에서</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="border rounded-2xl p-6 bg-card space-y-3 hover:border-blue-200 transition-colors">
                <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-blue-500 to-violet-500 py-20">
          <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
            <div className="flex justify-center">
              <Star className="h-10 w-10 text-white/80" fill="currentColor" />
            </div>
            <h2 className="text-3xl font-bold text-white">지금 바로 시작하세요</h2>
            <p className="text-white/80 text-lg">
              무료로 가입하고 첫 커뮤니티를 만들어보세요.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-base font-medium text-blue-600 bg-white hover:bg-blue-50 transition-colors shadow-lg"
            >
              무료로 시작하기 <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="border-t py-8 text-center text-sm text-muted-foreground">
          © 2025 SparkNova School. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
