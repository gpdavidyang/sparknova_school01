import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { email, token, password } = await req.json();

  if (!email || !token || !password) {
    return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });
  }

  // 토큰 검증
  const record = await db.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });

  if (!record) {
    return NextResponse.json({ error: "유효하지 않은 링크입니다." }, { status: 400 });
  }
  if (record.expires < new Date()) {
    await db.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } });
    return NextResponse.json({ error: "링크가 만료되었습니다. 다시 요청해주세요." }, { status: 400 });
  }

  // 비밀번호 업데이트
  const hashed = await bcrypt.hash(password, 12);
  await db.user.update({ where: { email }, data: { password: hashed } as never });

  // 토큰 삭제
  await db.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } });

  return NextResponse.json({ ok: true });
}
