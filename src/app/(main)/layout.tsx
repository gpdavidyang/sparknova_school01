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
      <Header />
      <div className="flex">
        <Sidebar myCommunities={myCommunities} />
        <main className="flex-1 ml-64 pt-16 p-6 max-w-4xl">
          {children}
        </main>
      </div>
    </div>
  );
}
