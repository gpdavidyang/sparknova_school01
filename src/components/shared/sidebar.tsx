"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Compass, Users, LayoutDashboard, Gift, Plus } from "lucide-react";
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

interface SidebarProps {
  myCommunities?: MyCommunity[];
}

export function Sidebar({ myCommunities = [] }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r bg-background p-4 flex-col">
      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === href
                ? "bg-blue-50 text-blue-600"
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
                    ? "bg-blue-50 text-blue-600"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={c.avatarUrl ?? ""} />
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                    {c.name[0]}
                  </AvatarFallback>
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
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          커뮤니티 만들기
        </Link>
      </div>
    </aside>
  );
}
