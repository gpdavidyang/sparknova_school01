import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getLevelConfig } from "@/lib/gamification";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string }>;
}

export default async function LeaderboardPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { period = "all" } = await searchParams;

  const community = await db.community.findUnique({ where: { slug } });
  if (!community) notFound();

  const levelConfig = await getLevelConfig(community.id);

  // 기간 필터
  const dateFilter: Record<string, Date | undefined> = {
    "7d": new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    "30d": new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    all: undefined,
  };
  const since = dateFilter[period];

  let rankings;
  if (since) {
    // 기간별: PointTransaction 합산
    const txs = await db.pointTransaction.groupBy({
      by: ["userId"],
      where: { communityId: community.id, createdAt: { gte: since }, points: { gt: 0 } },
      _sum: { points: true },
      orderBy: { _sum: { points: "desc" } },
      take: 50,
    });

    const users = await db.user.findMany({
      where: { id: { in: txs.map((t) => t.userId) } },
      select: { id: true, name: true, avatarUrl: true, username: true },
    });

    rankings = txs.map((t, i) => ({
      rank: i + 1,
      userId: t.userId,
      points: t._sum.points ?? 0,
      user: users.find((u) => u.id === t.userId)!,
      level: 0,
    }));
  } else {
    // 전체: UserLevel 기준
    const levels = await db.userLevel.findMany({
      where: { communityId: community.id },
      include: { user: { select: { id: true, name: true, avatarUrl: true, username: true } } },
      orderBy: { points: "desc" },
      take: 50,
    });

    rankings = levels.map((l, i) => ({
      rank: i + 1,
      userId: l.userId,
      points: l.points,
      level: l.level,
      user: l.user,
    }));
  }

  const periodLabels: Record<string, string> = { "7d": "7일", "30d": "30일", all: "전체" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          리더보드
        </h2>
        <div className="flex gap-1">
          {["7d", "30d", "all"].map((p) => (
            <a
              key={p}
              href={`?period=${p}`}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                period === p
                  ? "bg-orange-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {periodLabels[p]}
            </a>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {rankings.map(({ rank, user, points, level }) => {
          const levelName = levelConfig.find((l) => l.level === level)?.name ?? `Lv.${level}`;
          return (
            <div
              key={user.id}
              className={`flex items-center gap-4 p-3 rounded-xl ${
                rank <= 3 ? "bg-yellow-50 border border-yellow-100" : "bg-muted/30"
              }`}
            >
              {/* 순위 */}
              <div className="w-8 text-center">
                {rank === 1 && <Trophy className="h-5 w-5 text-yellow-500 mx-auto" />}
                {rank === 2 && <Medal className="h-5 w-5 text-gray-400 mx-auto" />}
                {rank === 3 && <Medal className="h-5 w-5 text-amber-600 mx-auto" />}
                {rank > 3 && <span className="text-sm font-bold text-muted-foreground">{rank}</span>}
              </div>

              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatarUrl ?? ""} />
                <AvatarFallback>{user.name?.[0] ?? "U"}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{user.name ?? user.username}</p>
                <Badge variant="secondary" className="text-xs mt-0.5">
                  {levelName}
                </Badge>
              </div>

              <span className="font-bold text-orange-600 text-sm">
                {points.toLocaleString()}pt
              </span>
            </div>
          );
        })}

        {rankings.length === 0 && (
          <EmptyState
            icon={Trophy}
            title="아직 활동 내역이 없습니다"
            description="첫 번째로 포인트를 획득해보세요!"
          />
        )}
      </div>
    </div>
  );
}
