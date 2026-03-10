import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Users, Crown, Shield } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

const ROLE_CONFIG = {
  OWNER:     { label: "운영자", icon: Crown,  color: "text-blue-500" },
  ADMIN:     { label: "관리자", icon: Shield, color: "text-blue-500" },
  MODERATOR: { label: "모더레이터", icon: Shield, color: "text-purple-500" },
  MEMBER:    { label: null,     icon: null,   color: "" },
};

export default async function MembersPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const session = await auth();

  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, memberCount: true },
  });
  if (!community) notFound();

  // 역할 순서: OWNER > ADMIN > MODERATOR > MEMBER
  const roleOrder = ["OWNER", "ADMIN", "MODERATOR", "MEMBER"];

  const members = await db.communityMember.findMany({
    where: { communityId: community.id, isActive: true },
    orderBy: { joinedAt: "asc" },
    take: 100,
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, bio: true } },
    },
  });

  // 역할 순 정렬
  const sorted = members.sort(
    (a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)
  );

  // 멤버별 레벨 정보
  const userIds = sorted.map((m) => m.userId);
  const levels = await db.userLevel.findMany({
    where: { communityId: community.id, userId: { in: userIds } },
    select: { userId: true, points: true, level: true },
  });
  const levelMap = new Map(levels.map((l) => [l.userId, l]));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
          <Users className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold">멤버</h1>
          <p className="text-sm text-muted-foreground">
            전체 {community.memberCount.toLocaleString()}명
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map(({ user, role, joinedAt }) => {
          const roleConf = ROLE_CONFIG[role];
          const RoleIcon = roleConf.icon;
          const userLevel = levelMap.get(user.id);
          const isMe = user.id === session?.user?.id;

          return (
            <div
              key={user.id}
              className={`flex items-center gap-3 border rounded-xl p-3 bg-card ${isMe ? "border-blue-200 bg-blue-50/40" : ""}`}
            >
              {/* 아바타 */}
              <div className="h-10 w-10 rounded-full bg-blue-100 overflow-hidden shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-base font-bold text-blue-600">
                    {user.name?.[0] ?? "?"}
                  </div>
                )}
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate">{user.name ?? "익명"}</p>
                  {isMe && <span className="text-xs text-blue-500">(나)</span>}
                  {RoleIcon && (
                    <RoleIcon className={`h-3.5 w-3.5 shrink-0 ${roleConf.color}`} />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {roleConf.label && (
                    <span className={`text-xs font-medium ${roleConf.color}`}>
                      {roleConf.label}
                    </span>
                  )}
                  {userLevel && (
                    <span className="text-xs text-muted-foreground">
                      Lv.{userLevel.level} · {userLevel.points.toLocaleString()}P
                    </span>
                  )}
                </div>
                {user.bio && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.bio}</p>
                )}
              </div>

              {/* 가입일 */}
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(
                    joinedAt
                  )}
                </p>
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="col-span-2 text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>멤버가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
