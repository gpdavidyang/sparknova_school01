import { db } from "@/lib/db";

// 기본 배지 정의 (DB에 없으면 자동 생성)
export const BADGE_DEFINITIONS = [
  {
    key: "FIRST_LESSON",
    name: "첫 걸음",
    description: "첫 번째 레슨을 완료했습니다.",
    iconUrl: null,
    condition: JSON.stringify({ type: "LESSON_COMPLETED", count: 1 }),
  },
  {
    key: "LESSON_10",
    name: "열정 학습자",
    description: "레슨 10개를 완료했습니다.",
    iconUrl: null,
    condition: JSON.stringify({ type: "LESSON_COMPLETED", count: 10 }),
  },
  {
    key: "FIRST_COURSE",
    name: "수료 달인",
    description: "첫 번째 강좌를 수료했습니다.",
    iconUrl: null,
    condition: JSON.stringify({ type: "COURSE_COMPLETED", count: 1 }),
  },
  {
    key: "CHECKIN_7",
    name: "7일 연속 출석",
    description: "7일 연속 출석 체크인을 완료했습니다.",
    iconUrl: null,
    condition: JSON.stringify({ type: "DAILY_CHECKIN", streak: 7 }),
  },
  {
    key: "REFERRAL_1",
    name: "소개왕",
    description: "첫 번째 친구를 초대했습니다.",
    iconUrl: null,
    condition: JSON.stringify({ type: "REFERRAL_SUCCESS", count: 1 }),
  },
] as const;

export type BadgeKey = (typeof BADGE_DEFINITIONS)[number]["key"];

/**
 * 배지를 조회하거나 없으면 생성
 */
async function getOrCreateBadge(key: BadgeKey) {
  const def = BADGE_DEFINITIONS.find((b) => b.key === key)!;
  const existing = await db.badge.findFirst({ where: { condition: { contains: key } } });
  if (existing) return existing;

  return db.badge.create({
    data: {
      name: def.name,
      description: def.description,
      iconUrl: def.iconUrl,
      condition: def.condition,
    },
  });
}

/**
 * 배지 지급 (중복 지급 방지)
 * @returns true if newly granted, false if already had it
 */
export async function grantBadge({
  userId,
  badgeKey,
  communityId,
}: {
  userId: string;
  badgeKey: BadgeKey;
  communityId?: string;
}): Promise<boolean> {
  try {
    const badge = await getOrCreateBadge(badgeKey);

    // 이미 보유 여부 확인
    const existing = await db.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
    });
    if (existing) return false;

    await db.userBadge.create({ data: { userId, badgeId: badge.id } });

    // 알림 발송
    await db.notification.create({
      data: {
        userId,
        type: "BADGE_EARNED",
        title: `배지 획득: ${badge.name}`,
        body: badge.description ?? undefined,
      },
    });

    return true;
  } catch {
    // 동시성 문제로 unique 제약 오류가 발생해도 무시
    return false;
  }
}

/**
 * 레슨 완료 수에 따른 배지 자동 지급
 */
export async function checkAndGrantLessonBadges({
  userId,
  communityId,
  completedCount,
}: {
  userId: string;
  communityId: string;
  completedCount: number;
}) {
  if (completedCount === 1) {
    await grantBadge({ userId, badgeKey: "FIRST_LESSON", communityId });
  }
  if (completedCount === 10) {
    await grantBadge({ userId, badgeKey: "LESSON_10", communityId });
  }
}

/**
 * 강좌 완료 시 배지 자동 지급
 */
export async function checkAndGrantCourseBadges({
  userId,
  communityId,
}: {
  userId: string;
  communityId: string;
}) {
  // 전체 수료 수 조회
  const completedCourses = await db.certificate.count({ where: { userId } });
  if (completedCourses === 1) {
    await grantBadge({ userId, badgeKey: "FIRST_COURSE", communityId });
  }
}

/**
 * 추천 성공 시 배지 자동 지급
 */
export async function checkAndGrantReferralBadges({
  userId,
  communityId,
}: {
  userId: string;
  communityId: string;
}) {
  const referralCount = await db.referralRecord.count({
    where: { referrerId: userId, status: "CONVERTED" },
  });
  if (referralCount === 1) {
    await grantBadge({ userId, badgeKey: "REFERRAL_1", communityId });
  }
}
