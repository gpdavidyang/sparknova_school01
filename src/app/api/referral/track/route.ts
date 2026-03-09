import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/referral/track — 추천 링크 클릭 시 쿠키에 코드 저장 + 클릭 수 증가
export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ ok: false });

  const referralCode = await db.referralCode.findUnique({
    where: { code, isActive: true },
  });
  if (!referralCode) return NextResponse.json({ ok: false });

  // 클릭 수 증가
  await db.referralCode.update({
    where: { id: referralCode.id },
    data: { clickCount: { increment: 1 } },
  });

  const res = NextResponse.json({ ok: true });
  // 30일 쿠키로 추천 코드 저장
  res.cookies.set("ref_code", code, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
