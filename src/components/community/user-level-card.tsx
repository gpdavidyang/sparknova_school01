import Link from "next/link";
import { DEFAULT_LEVELS } from "@/lib/gamification";
import { DailyCheckinButton } from "./daily-checkin-button";
import { Star, Trophy } from "lucide-react";

interface Props {
  slug: string;
  points: number;
  level: number;
  todayCheckedIn: boolean;
  rank?: number;
}

export function UserLevelCard({ slug, points, level, todayCheckedIn, rank }: Props) {
  const currentLevelDef = DEFAULT_LEVELS.find((l) => l.level === level) ?? DEFAULT_LEVELS[0];
  const nextLevelDef = DEFAULT_LEVELS.find((l) => l.level === level + 1);

  const progressPct = nextLevelDef
    ? Math.min(
        100,
        ((points - currentLevelDef.minPoints) /
          (nextLevelDef.minPoints - currentLevelDef.minPoints)) *
          100
      )
    : 100;

  const isMaxLevel = !nextLevelDef;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      {/* 레벨 뱃지 */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shrink-0">
          <Star className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">나의 레벨</p>
          <p className="text-sm font-bold">
            Lv.{level}{" "}
            <span className="text-orange-600">{currentLevelDef.name}</span>
          </p>
        </div>
        {rank && (
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">랭킹</p>
            <p className="text-sm font-bold text-yellow-600">#{rank}</p>
          </div>
        )}
      </div>

      {/* 포인트 */}
      <div className="bg-muted/40 rounded-lg px-3 py-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">총 포인트</span>
        <span className="text-sm font-bold text-orange-600">
          {points.toLocaleString()} P
        </span>
      </div>

      {/* 레벨 진행 바 */}
      {isMaxLevel ? (
        <div className="space-y-1">
          <p className="text-xs text-center text-muted-foreground">
            최고 레벨 달성! 🎉
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>다음: Lv.{level + 1} {nextLevelDef!.name}</span>
            <span>{(nextLevelDef!.minPoints - points).toLocaleString()}P 남음</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* 출석체크 */}
      <DailyCheckinButton slug={slug} initialCheckedIn={todayCheckedIn} />

      {/* 리더보드 링크 */}
      <Link
        href={`/community/${slug}/leaderboard`}
        className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Trophy className="h-3.5 w-3.5" />
        리더보드 보기
      </Link>
    </div>
  );
}
