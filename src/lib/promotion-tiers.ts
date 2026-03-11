/**
 * 등급별 프로모션 시스템
 * - 수강생 등급: 브론즈 / 실버 / 골드 / 플래티넘 / 다이아몬드
 * - 강사 등급: 신규 / 인증 / 인기 / 스타 / 레전드
 */

import { db } from "@/lib/db";

// ──────────────────────────────────────
// 수강생 등급
// ──────────────────────────────────────

export type StudentTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";

export const STUDENT_TIERS: {
  tier: StudentTier;
  label: string;
  color: string;
  bgColor: string;
  minLevel: number;
  minCourses: number;
  minReviews: number;
  minReferrals: number;
  discountPct: number;
}[] = [
  { tier: "DIAMOND",  label: "다이아몬드", color: "text-cyan-600",   bgColor: "bg-cyan-50",    minLevel: 9, minCourses: 10, minReviews: 0, minReferrals: 10, discountPct: 15 },
  { tier: "PLATINUM", label: "플래티넘",   color: "text-violet-600", bgColor: "bg-violet-50",  minLevel: 7, minCourses: 5,  minReviews: 0, minReferrals: 3,  discountPct: 10 },
  { tier: "GOLD",     label: "골드",       color: "text-yellow-600", bgColor: "bg-yellow-50",  minLevel: 5, minCourses: 3,  minReviews: 5, minReferrals: 0,  discountPct: 10 },
  { tier: "SILVER",   label: "실버",       color: "text-gray-500",   bgColor: "bg-gray-50",    minLevel: 3, minCourses: 1,  minReviews: 0, minReferrals: 0,  discountPct: 5  },
  { tier: "BRONZE",   label: "브론즈",     color: "text-orange-600", bgColor: "bg-orange-50",  minLevel: 1, minCourses: 0,  minReviews: 0, minReferrals: 0,  discountPct: 0  },
];

export async function calculateStudentTier(userId: string): Promise<{
  tier: StudentTier;
  label: string;
  color: string;
  bgColor: string;
  discountPct: number;
}> {
  const [maxLevel, completedCourses, reviewCount, referralCount] = await Promise.all([
    db.userLevel.findFirst({
      where: { userId },
      orderBy: { level: "desc" },
      select: { level: true },
    }),
    db.enrollment.count({
      where: { userId, completedAt: { not: null } },
    }),
    db.review.count({ where: { userId } }),
    db.referralRecord.count({
      where: { referrerId: userId, status: "CONVERTED" },
    }),
  ]);

  const level = maxLevel?.level ?? 1;

  for (const t of STUDENT_TIERS) {
    if (
      level >= t.minLevel &&
      completedCourses >= t.minCourses &&
      reviewCount >= t.minReviews &&
      referralCount >= t.minReferrals
    ) {
      return { tier: t.tier, label: t.label, color: t.color, bgColor: t.bgColor, discountPct: t.discountPct };
    }
  }

  const bronze = STUDENT_TIERS[STUDENT_TIERS.length - 1];
  return { tier: bronze.tier, label: bronze.label, color: bronze.color, bgColor: bronze.bgColor, discountPct: bronze.discountPct };
}

// ──────────────────────────────────────
// 강사 등급
// ──────────────────────────────────────

export type InstructorTier = "NEW" | "CERTIFIED" | "POPULAR" | "STAR" | "LEGEND";

export const INSTRUCTOR_TIERS: {
  tier: InstructorTier;
  label: string;
  color: string;
  bgColor: string;
  minAvgRating: number;
  minLikes: number;
  minStudents: number;
  feeDiscountPct: number;
}[] = [
  { tier: "LEGEND",    label: "레전드 강사", color: "text-amber-600",  bgColor: "bg-amber-50",  minAvgRating: 4.8, minLikes: 1000, minStudents: 5000, feeDiscountPct: 3 },
  { tier: "STAR",      label: "스타 강사",   color: "text-pink-600",   bgColor: "bg-pink-50",   minAvgRating: 4.7, minLikes: 500,  minStudents: 1000, feeDiscountPct: 2 },
  { tier: "POPULAR",   label: "인기 강사",   color: "text-blue-600",   bgColor: "bg-blue-50",   minAvgRating: 4.5, minLikes: 100,  minStudents: 200,  feeDiscountPct: 1 },
  { tier: "CERTIFIED", label: "인증 강사",   color: "text-green-600",  bgColor: "bg-green-50",  minAvgRating: 4.0, minLikes: 0,    minStudents: 50,   feeDiscountPct: 0 },
  { tier: "NEW",       label: "신규 강사",   color: "text-gray-500",   bgColor: "bg-gray-50",   minAvgRating: 0,   minLikes: 0,    minStudents: 0,    feeDiscountPct: 0 },
];

export async function calculateInstructorTier(userId: string): Promise<{
  tier: InstructorTier;
  label: string;
  color: string;
  bgColor: string;
  feeDiscountPct: number;
}> {
  // 이 강사가 소유한 커뮤니티의 강좌 통계
  const communities = await db.community.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });

  if (communities.length === 0) {
    const newTier = INSTRUCTOR_TIERS[INSTRUCTOR_TIERS.length - 1];
    return { tier: newTier.tier, label: newTier.label, color: newTier.color, bgColor: newTier.bgColor, feeDiscountPct: newTier.feeDiscountPct };
  }

  const communityIds = communities.map((c) => c.id);

  const [avgRatingResult, totalLikes, totalStudents] = await Promise.all([
    db.review.aggregate({
      where: { course: { communityId: { in: communityIds } } },
      _avg: { rating: true },
    }),
    db.like.count({
      where: { post: { communityId: { in: communityIds } } },
    }),
    db.enrollment.count({
      where: { course: { communityId: { in: communityIds } } },
    }),
  ]);

  const avgRating = avgRatingResult._avg.rating ?? 0;

  for (const t of INSTRUCTOR_TIERS) {
    if (
      avgRating >= t.minAvgRating &&
      totalLikes >= t.minLikes &&
      totalStudents >= t.minStudents
    ) {
      return { tier: t.tier, label: t.label, color: t.color, bgColor: t.bgColor, feeDiscountPct: t.feeDiscountPct };
    }
  }

  const newTier = INSTRUCTOR_TIERS[INSTRUCTOR_TIERS.length - 1];
  return { tier: newTier.tier, label: newTier.label, color: newTier.color, bgColor: newTier.bgColor, feeDiscountPct: newTier.feeDiscountPct };
}
