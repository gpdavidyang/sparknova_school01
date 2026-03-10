"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, Zap, LogIn, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileSidebar } from "@/components/shared/mobile-sidebar";
import { NotificationBell } from "@/components/shared/notification-bell";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MyCommunity {
  slug: string;
  name: string;
  avatarUrl: string | null;
}

interface HeaderProps {
  myCommunities?: MyCommunity[];
}

export function Header({ myCommunities = [] }: HeaderProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user;
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-full items-center gap-3 px-4">
          {/* 모바일 햄버거 */}
          <button
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl shrink-0">
            <Zap className="h-6 w-6 text-blue-500" fill="currentColor" />
            <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent hidden sm:inline">
              SparkNova
            </span>
          </Link>

          {/* 검색 */}
          <form
            className="flex-1 max-w-md mx-auto relative hidden sm:block"
            onSubmit={(e) => { e.preventDefault(); if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`); }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="커뮤니티, 강좌 검색..."
              className="pl-9 bg-muted/50"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          {/* 우측 액션 */}
          <div className="flex items-center gap-2 ml-auto">
            {status === "loading" ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <>
                <ThemeToggle />
                <NotificationBell />

                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center justify-center size-8 rounded-full hover:bg-muted transition-colors outline-none">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image ?? ""} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-xs">
                        {user.name?.[0] ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 text-sm font-medium truncate">{user.name}</div>
                    <div className="px-2 pb-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link href="/profile" className="w-full block">내 프로필</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/my/bookmarks" className="w-full block">북마크</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/dashboard" className="w-full block">크리에이터 대시보드</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/my/payments" className="w-full block">결제 내역</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/settings" className="w-full block">설정</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/referral" className="w-full block">추천인 센터</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive cursor-pointer"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
                  요금제
                </Link>
                <Link href="/login" className={cn(buttonVariants({ size: "sm" }), "bg-blue-500 hover:bg-blue-600")}>
                  <LogIn className="h-4 w-4 mr-1" />
                  로그인
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 모바일 사이드바 드로어 */}
      <MobileSidebar
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        myCommunities={myCommunities}
      />
    </>
  );
}
