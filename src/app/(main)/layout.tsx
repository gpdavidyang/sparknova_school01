import { Header } from "@/components/shared/header";
import { Sidebar } from "@/components/shared/sidebar";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  const myCommunities = session?.user?.id
    ? await db.communityMember.findMany({
        where: { userId: session.user.id },
        include: { community: { select: { slug: true, name: true, avatarUrl: true } } },
        orderBy: { joinedAt: "desc" },
        take: 10,
      }).then((members: { community: { slug: string; name: string; avatarUrl: string | null } }[]) =>
        members.map((m) => m.community)
      )
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Header myCommunities={myCommunities} />
      <div className="flex">
        {/* 데스크탑 사이드바 */}
        <Sidebar myCommunities={myCommunities} />
        {/* 메인 콘텐츠: 모바일은 전체 너비, 데스크탑은 사이드바 여백 */}
        <main className="flex-1 pt-16 px-4 pb-4 sm:px-6 sm:pb-6 lg:ml-64 min-w-0">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
