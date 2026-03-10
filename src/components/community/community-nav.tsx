"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MessageSquare, BookOpen, Calendar, Users, Trophy, Settings, ShoppingBag } from "lucide-react";

interface Props {
  slug: string;
  showClassroom: boolean;
  showCalendar: boolean;
  showShop?: boolean;
  isOwner?: boolean;
}

export function CommunityNav({ slug, showClassroom, showCalendar, showShop, isOwner }: Props) {
  const pathname = usePathname();
  const base = `/community/${slug}`;

  const tabs = [
    { href: base,                    label: "커뮤니티", icon: MessageSquare, always: true },
    { href: `${base}/classroom`,     label: "클래스룸", icon: BookOpen,      always: false, show: showClassroom },
    { href: `${base}/calendar`,      label: "캘린더",   icon: Calendar,      always: false, show: showCalendar },
    { href: `${base}/shop`,          label: "상품",     icon: ShoppingBag,   always: false, show: showShop },
    { href: `${base}/members`,       label: "멤버",     icon: Users,         always: true },
    { href: `${base}/leaderboard`,   label: "리더보드", icon: Trophy,        always: true },
    { href: `${base}/admin`,         label: "관리",     icon: Settings,      always: false, show: isOwner },
  ].filter((t) => t.always || t.show);

  return (
    <div className="border-b bg-background sticky top-0 z-10">
      <nav className="max-w-4xl mx-auto px-4 flex gap-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
