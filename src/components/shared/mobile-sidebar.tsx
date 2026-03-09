"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Compass, Users, LayoutDashboard, Gift, Plus, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { href: "/explore",   icon: Compass,         label: "탐색" },
  { href: "/my-groups", icon: Users,           label: "내 커뮤니티" },
  { href: "/dashboard", icon: LayoutDashboard, label: "대시보드" },
  { href: "/referral",  icon: Gift,            label: "추천인 센터" },
];

interface MyCommunity {
  slug: string;
  name: string;
  avatarUrl: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  myCommunities?: MyCommunity[];
}

export function MobileSidebar({ isOpen, onClose, myCommunities = [] }: Props) {
  const pathname = usePathname();

  // 경로 변경 시 닫기
  useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        onClick={onClose}
      />
      {/* 드로어 */}
      <div className="fixed left-0 top-0 h-full w-72 z-50 bg-background border-r shadow-xl flex flex-col p-4 lg:hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-lg">메뉴</span>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-orange-50 text-orange-600"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <Separator className="my-4" />

        <div className="flex-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            내 커뮤니티
          </p>
          {myCommunities.length === 0 ? (
            <p className="px-3 text-xs text-muted-foreground">아직 가입한 커뮤니티가 없습니다.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {myCommunities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/community/${c.slug}`}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    pathname.startsWith(`/community/${c.slug}`)
                      ? "bg-orange-50 text-orange-600"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={c.avatarUrl ?? ""} />
                    <AvatarFallback className="text-xs bg-orange-100 text-orange-600">{c.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{c.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <Link
            href="/community/new"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            커뮤니티 만들기
          </Link>
        </div>
      </div>
    </>
  );
}
