import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "이메일을 입력해주세요." }, { status: 400 });

  // 유저 존재 여부와 무관하게 성공 응답 (보안)
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });

  if (user) {
    // 기존 토큰 삭제
    await db.verificationToken.deleteMany({ where: { identifier: email } });

    // 새 토큰 생성 (1시간 만료)
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await db.verificationToken.create({ data: { identifier: email, token, expires } });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await sendPasswordResetEmail({ to: email, resetUrl });
  }

  return NextResponse.json({ ok: true });
}
