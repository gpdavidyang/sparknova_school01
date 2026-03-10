import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { CommunityNav } from "@/components/community/community-nav";
import { JoinButton } from "@/components/community/join-button";
import { UserLevelCard } from "@/components/community/user-level-card";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function CommunityLayout({ children, params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const session = await auth();

  const community = await db.community.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { digitalProducts: { where: { isPublished: true } } } },
    },
  });

  if (!community || !community.isActive) notFound();

  const membership = session?.user?.id
    ? await db.communityMember.findUnique({
        where: { communityId_userId: { communityId: community.id, userId: session.user.id } },
      })
    : null;
  const isOwner = membership?.role === "OWNER";
  // 만료 여부: expiresAt이 있고 현재 시각보다 이전이면 만료
  const now = new Date();
  const isExpired = !!(membership?.expiresAt && membership.expiresAt < now);
  const isJoined = !!membership && (isOwner || (!isExpired && membership.isActive));
  // 7일 이내 만료 예정
  const expiresInDays = membership?.expiresAt && !isExpired
    ? Math.ceil((membership.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // 사이드바용 데이터: 로그인 + 멤버인 경우만
  let levelData: { points: number; level: number; todayCheckedIn: boolean; rank?: number } | null = null;
  if (session?.user?.id && isJoined) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [userLevel, checkinToday] = await Promise.all([
      db.userLevel.findUnique({
        where: { userId_communityId: { userId: session.user.id, communityId: community.id } },
      }),
      db.pointTransaction.findFirst({
        where: {
          userId: session.user.id,
          communityId: community.id,
          type: "DAILY_CHECKIN",
          createdAt: { gte: todayStart },
        },
      }),
    ]);

    // 내 랭킹 계산: 나보다 포인트 많은 유저 수 + 1
    const myPoints = userLevel?.points ?? 0;
    const aboveMe = myPoints > 0
      ? await db.userLevel.count({
          where: { communityId: community.id, points: { gt: myPoints } },
        })
      : null;

    levelData = {
      points: userLevel?.points ?? 0,
      level: userLevel?.level ?? 1,
      todayCheckedIn: !!checkinToday,
      rank: aboveMe !== null ? aboveMe + 1 : undefined,
    };
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 커뮤니티 커버 & 헤더 */}
      <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-500 relative">
        {community.coverUrl && (
          <img src={community.coverUrl} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
          <div className="flex items-end gap-4">
            <div className="h-16 w-16 rounded-xl border-4 border-white bg-white overflow-hidden">
              {community.avatarUrl ? (
                <img src={community.avatarUrl} alt={community.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                  {community.name[0]}
                </div>
              )}
            </div>
            <div className="text-white pb-1">
              <h1 className="text-xl font-bold">{community.name}</h1>
              <p className="text-sm text-white/80">{community.memberCount.toLocaleString()}명</p>
            </div>
          </div>
          <div className="pb-1">
            <JoinButton
              slug={slug}
              initialJoined={isJoined}
              isOwner={isOwner}
              isPaid={community.joinType === "PAID"}
            />
          </div>
        </div>
      </div>

      {/* 멤버십 만료 경고 배너 */}
      {isExpired && !isOwner && (
        <div className="bg-red-500 text-white text-center text-sm py-2 px-4">
          멤버십이 만료되었습니다.{" "}
          <a href={`/community/${slug}/join`} className="underline font-semibold">갱신하기 →</a>
        </div>
      )}
      {!isExpired && expiresInDays !== null && expiresInDays <= 7 && (
        <div className="bg-yellow-400 text-yellow-900 text-center text-sm py-2 px-4">
          멤버십이 <strong>{expiresInDays}일 후</strong> 만료됩니다.{" "}
          <a href={`/community/${slug}/join`} className="underline font-semibold">갱신하기 →</a>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <CommunityNav
        slug={slug}
        showClassroom={community.showClassroom}
        showCalendar={community.showCalendar}
        showShop={community._count.digitalProducts > 0 || isOwner}
        isOwner={isOwner}
      />

      {/* 컨텐츠 + 사이드바 */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-6 items-start">
          {/* 메인 콘텐츠 */}
          <div className="flex-1 min-w-0">
            {children}
          </div>

          {/* 사이드바: 로그인 + 멤버인 경우만 */}
          {levelData && (
            <div className="w-60 shrink-0 hidden lg:block">
              <UserLevelCard
                slug={slug}
                points={levelData.points}
                level={levelData.level}
                todayCheckedIn={levelData.todayCheckedIn}
                rank={levelData.rank}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
