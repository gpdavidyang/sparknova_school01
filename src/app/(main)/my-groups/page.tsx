import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Users, Plus, Crown, ShieldCheck, Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "내 커뮤니티" };

const ROLE_LABELS: Record<string, string> = {
  OWNER: "오너",
  ADMIN: "관리자",
  MODERATOR: "모더레이터",
  MEMBER: "멤버",
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  OWNER: Crown,
  ADMIN: ShieldCheck,
  MODERATOR: Shield,
};

export default async function MyGroupsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const memberships = await db.communityMember.findMany({
    where: { userId: session.user.id, isActive: true },
    include: {
      community: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          avatarUrl: true,
          isPublic: true,
          joinType: true,
          _count: {
            select: {
              members: { where: { isActive: true } },
              courses: { where: { isPublished: true } },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const owned = memberships.filter((m) => m.role === "OWNER");
  const joined = memberships.filter((m) => m.role !== "OWNER");

  return (
    <div className="py-6 space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">내 커뮤니티</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            가입한 커뮤니티 {memberships.length}개
          </p>
        </div>
        <Link
          href="/community/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          커뮤니티 만들기
        </Link>
      </div>

      {memberships.length === 0 ? (
        <div className="border rounded-2xl p-12 text-center space-y-4 bg-card">
          <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
            <Users className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <p className="font-semibold">아직 가입한 커뮤니티가 없습니다</p>
            <p className="text-sm text-muted-foreground mt-1">커뮤니티를 탐색하거나 직접 만들어보세요.</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link
              href="/explore"
              className="px-4 py-2 text-sm border rounded-xl hover:bg-muted transition-colors"
            >
              커뮤니티 탐색
            </Link>
            <Link
              href="/community/new"
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              만들기
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 내가 운영하는 커뮤니티 */}
          {owned.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                운영 중인 커뮤니티
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {owned.map((m) => (
                  <CommunityCard key={m.id} membership={m} />
                ))}
              </div>
            </section>
          )}

          {/* 가입한 커뮤니티 */}
          {joined.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                가입한 커뮤니티
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {joined.map((m) => (
                  <CommunityCard key={m.id} membership={m} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

type Membership = Awaited<ReturnType<typeof db.communityMember.findMany>>[number] & {
  community: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    avatarUrl: string | null;
    isPublic: boolean;
    joinType: string;
    _count: { members: number; courses: number };
  };
};

function CommunityCard({ membership: m }: { membership: Membership }) {
  const RoleIcon = ROLE_ICONS[m.role];

  return (
    <Link
      href={`/community/${m.community.slug}`}
      className="flex items-start gap-3 p-4 border rounded-xl bg-card hover:bg-muted/30 transition-colors group"
    >
      {/* 아바타 */}
      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center shrink-0 overflow-hidden">
        {m.community.avatarUrl ? (
          <img src={m.community.avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-blue-600">
            {m.community.name[0]}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate group-hover:text-blue-600 transition-colors">
            {m.community.name}
          </p>
          {RoleIcon && (
            <span className="shrink-0">
              <RoleIcon className="h-3.5 w-3.5 text-blue-500" />
            </span>
          )}
        </div>

        {m.community.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {m.community.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            {m.community._count.members.toLocaleString()}명
          </span>
          {m.community._count.courses > 0 && (
            <span className="text-xs text-muted-foreground">
              강좌 {m.community._count.courses}개
            </span>
          )}
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted font-medium ml-auto">
            {ROLE_LABELS[m.role]}
          </span>
        </div>
      </div>
    </Link>
  );
}
