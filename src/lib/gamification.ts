import { PointType } from "@prisma/client";
import { db } from "@/lib/db";
import { DEFAULT_LEVELS, calculateLevel } from "@/lib/gamification-constants";
export { DEFAULT_LEVELS, calculateLevel };

// 포인트 획득 규칙
export const POINT_RULES: Record<PointType, number> = {
  POST_CREATED:     2,
  COMMENT_CREATED:  1,
  POST_LIKED:       3,
  COMMENT_LIKED:    1,
  LESSON_COMPLETED: 5,
  COURSE_COMPLETED: 20,
  EVENT_ATTENDED:   10,
  REFERRAL_SUCCESS: 50,
  DAILY_CHECKIN:    1,
  MANUAL_GRANT:     0, // 수동 지급은 별도 value 사용
  MANUAL_DEDUCT:    0,
};

/**
 * 포인트 지급 및 레벨 업데이트
 */
export async function grantPoints({
  userId,
  communityId,
  type,
  referenceId,
  customPoints,
}: {
  userId: string;
  communityId: string;
  type: PointType;
  referenceId?: string;
  customPoints?: number; // MANUAL_GRANT/DEDUCT 용
}) {
  const points = customPoints ?? POINT_RULES[type];
  if (points === 0) return null;

  // 포인트 트랜잭션 생성
  await db.pointTransaction.create({
    data: { userId, communityId, type, points, referenceId },
  });

  // UserLevel upsert
  const userLevel = await db.userLevel.upsert({
    where: { userId_communityId: { userId, communityId } },
    create: { userId, communityId, points, level: 1 },
    update: { points: { increment: points } },
  });

  // 레벨 재계산
  const newLevel = calculateLevel(userLevel.points + points);
  const leveledUp = newLevel > userLevel.level;

  if (leveledUp) {
    await db.userLevel.update({
      where: { userId_communityId: { userId, communityId } },
      data: { level: newLevel },
    });

    // 레벨업 알림
    await db.notification.create({
      data: {
        userId,
        type: "LEVEL_UP",
        title: `레벨 ${newLevel} 달성!`,
        body: `축하합니다! 레벨 ${newLevel}로 올라갔습니다.`,
      },
    });
  }

  return { points, newLevel, leveledUp };
}

/**
 * 커뮤니티별 커스텀 레벨명 조회 (없으면 기본값 반환)
 */
export async function getLevelConfig(communityId: string) {
  const configs = await db.levelConfig.findMany({ where: { communityId } });
  if (configs.length === 0) return DEFAULT_LEVELS;

  return DEFAULT_LEVELS.map((def) => {
    const custom = configs.find((c) => c.level === def.level);
    return { ...def, name: custom?.name ?? def.name };
  });
}
