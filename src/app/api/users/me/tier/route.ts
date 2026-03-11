import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calculateStudentTier, calculateInstructorTier } from "@/lib/promotion-tiers";

// GET — 현재 사용자의 수강생/강사 등급 조회
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [studentTier, instructorTier] = await Promise.all([
    calculateStudentTier(session.user.id),
    calculateInstructorTier(session.user.id),
  ]);

  return NextResponse.json({ studentTier, instructorTier });
}
