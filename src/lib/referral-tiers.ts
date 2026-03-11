/**
 * 단계별 Referral 보상 시스템
 *
 * Lv.1 구매 즉시: maxValue의 30% 지급
 * Lv.2 진도율 30% 달성: maxValue의 60%로 상향 (차액 소급 지급)
 * Lv.3 진도율 70% 달성: maxValue의 100%로 상향 (차액 소급 지급)
 */

import { db } from "@/lib/db";

const TIER_RATES = [
  { tier: 1, minProgress: 0,   rate: 0.3 },  // 구매 즉시 30%
  { tier: 2, minProgress: 0.3, rate: 0.6 },  // 진도율 30% → 60%
  { tier: 3, minProgress: 0.7, rate: 1.0 },  // 진도율 70% → 100%
] as const;

/**
 * 추천인의 진도율이 변경되었을 때 보상 업그레이드 체크
 * 레슨 완료 시 호출됨
 */
export async function checkReferralTierUpgrade(userId: string, courseId: string, progress: number) {
  // 이 유저가 추천인(referrer)으로서 받은 보상 중, 해당 강좌 관련 건을 찾음
  const rewards = await db.referralReward.findMany({
    where: {
      userId,
      type: "CASH",
      status: "GRANTED",
      maxValue: { not: null },
      record: { courseId },
    },
    include: { record: true },
  });

  for (const reward of rewards) {
    if (!reward.maxValue) continue;

    // 현재 티어보다 높은 티어를 찾음
    const nextTier = TIER_RATES.find(
      (t) => t.tier > reward.tier && progress >= t.minProgress,
    );

    if (!nextTier) continue;

    // 가장 높은 달성 티어 찾기
    const achievedTier = [...TIER_RATES]
      .reverse()
      .find((t) => progress >= t.minProgress);
    if (!achievedTier || achievedTier.tier <= reward.tier) continue;

    const newValue = Math.round(reward.maxValue * achievedTier.rate);
    const diff = newValue - reward.value;

    if (diff <= 0) continue;

    // 보상 업그레이드
    await db.referralReward.update({
      where: { id: reward.id },
      data: { value: newValue, tier: achievedTier.tier },
    });
  }
}

/**
 * 구매 시 Lv.1(30%) 보상 생성
 * 강좌 결제 완료 후 호출
 */
export async function createTieredReferralReward({
  referrerId,
  referredId,
  courseId,
  totalRewardAmount,
}: {
  referrerId: string;
  referredId: string;
  courseId: string;
  totalRewardAmount: number;
}) {
  // 기존 ReferralRecord 찾기
  const record = await db.referralRecord.findFirst({
    where: { referrerId, referredId },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return;

  // courseId 연결
  if (!record.courseId) {
    await db.referralRecord.update({
      where: { id: record.id },
      data: { courseId },
    });
  }

  const tier1Value = Math.round(totalRewardAmount * 0.3);

  // Lv.1 보상 생성 (30%)
  await db.referralReward.create({
    data: {
      recordId: record.id,
      userId: referrerId,
      type: "CASH",
      value: tier1Value,
      maxValue: totalRewardAmount,
      tier: 1,
      status: "GRANTED",
      grantedAt: new Date(),
    },
  });
}
