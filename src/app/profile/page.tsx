import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEFAULT_LEVELS } from "@/lib/gamification";
import { ProfileForm } from "@/components/profile/profile-form";
import { Users, BookOpen, Star, Trophy } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      avatarUrl: true,
      coverUrl: true,
      createdAt: true,
      memberships: {
        where: { isActive: true },
        include: { community: { select: { id: true, slug: true, name: true, avatarUrl: true } } },
        orderBy: { joinedAt: "desc" },
        take: 12,
      },
      userBadges: {
        include: { badge: true },
        orderBy: { earnedAt: "desc" },
      },
      userLevels: {
        orderBy: { points: "desc" },
        take: 3,
        include: { community: { select: { name: true, slug: true } } },
      },
    },
  });

  if (!user) redirect("/login");

  // 총 포인트
  const totalPoints = user.userLevels.reduce((s, l) => s + l.points, 0);
  const topLevel = user.userLevels[0];
  const levelName = topLevel
    ? DEFAULT_LEVELS.find((l) => l.level === topLevel.level)?.name ?? `Lv.${topLevel.level}`
    : null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      {/* 커버 & 아바타 */}
      <div className="relative">
        <div className="h-32 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 overflow-hidden">
          {user.coverUrl && (
            <img src={user.coverUrl} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="absolute -bottom-10 left-5">
          <div className="h-20 w-20 rounded-full border-4 border-background bg-blue-100 overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name ?? ""} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-blue-500">
                {(user.name ?? user.email)[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="pt-10 space-y-1">
        <h1 className="text-xl font-bold">{user.name ?? "이름 없음"}</h1>
        {user.bio && <p className="text-sm text-muted-foreground">{user.bio}</p>}
        <p className="text-xs text-muted-foreground">
          {new Date(user.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long" })} 가입
        </p>

        {/* 레벨/포인트 뱃지 */}
        {levelName && (
          <div className="flex items-center gap-2 pt-2">
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
              <Trophy className="h-3 w-3" />
              {levelName}
            </span>
            <span className="text-xs text-muted-foreground">{totalPoints.toLocaleString()}P 누적</span>
          </div>
        )}
      </div>

      {/* 프로필 편집 폼 */}
      <div className="border rounded-xl p-5 bg-card space-y-4">
        <h2 className="font-semibold text-sm">프로필 편집</h2>
        <ProfileForm
          initial={{
            name: user.name ?? "",
            bio: user.bio ?? "",
            avatarUrl: user.avatarUrl ?? "",
            coverUrl: user.coverUrl ?? "",
          }}
        />
      </div>

      {/* 획득 배지 */}
      {user.userBadges.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-blue-500" />
            획득한 배지 ({user.userBadges.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {user.userBadges.map(({ badge, earnedAt }) => (
              <div key={badge.id} className="border rounded-xl p-3 bg-card flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  {badge.iconUrl ? (
                    <img src={badge.iconUrl} alt="" className="h-6 w-6" />
                  ) : (
                    <Star className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(earnedAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 가입한 커뮤니티 */}
      {user.memberships.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            가입한 커뮤니티 ({user.memberships.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {user.memberships.map(({ community }) => (
              <Link
                key={community.id}
                href={`/community/${community.slug}`}
                className="border rounded-xl p-3 bg-card flex items-center gap-2 hover:border-blue-300 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-blue-100 overflow-hidden shrink-0 flex items-center justify-center font-bold text-blue-600 text-sm">
                  {community.avatarUrl ? (
                    <img src={community.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    community.name[0]
                  )}
                </div>
                <span className="text-sm font-medium truncate">{community.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 수강 현황 */}
      <EnrollmentSummary userId={session.user.id} />
    </div>
  );
}

async function EnrollmentSummary({ userId }: { userId: string }) {
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        select: { id: true, title: true, communityId: true, community: { select: { slug: true } } },
      },
    },
    orderBy: { enrolledAt: "desc" },
    take: 6,
  });

  if (enrollments.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="font-semibold flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-blue-500" />
        수강 중인 강좌 ({enrollments.length})
      </h2>
      <div className="space-y-2">
        {enrollments.map((e) => (
          <Link
            key={e.id}
            href={`/community/${e.course.community.slug}/classroom/${e.course.id}`}
            className="border rounded-xl p-3 bg-card flex items-center gap-3 hover:border-blue-300 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{e.course.title}</p>
              <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${e.progress}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{Math.round(e.progress)}%</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
