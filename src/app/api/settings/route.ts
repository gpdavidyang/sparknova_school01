import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET: 현재 설정 조회
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      emailNotifComments: true,
      emailNotifPayments: true,
    },
  });

  return NextResponse.json(user);
}

// PATCH: 설정 업데이트
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json();
  const { emailNotifComments, emailNotifPayments, currentPassword, newPassword } = body;

  const updateData: Record<string, unknown> = {};

  // 이메일 알림 설정
  if (typeof emailNotifComments === "boolean") updateData.emailNotifComments = emailNotifComments;
  if (typeof emailNotifPayments === "boolean") updateData.emailNotifPayments = emailNotifPayments;

  // 비밀번호 변경
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "현재 비밀번호를 입력해주세요." }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "새 비밀번호는 6자 이상이어야 합니다." }, { status: 400 });
    }

    // 현재 비밀번호 확인 (credentials 계정)
    const account = await db.account.findFirst({
      where: { userId: session.user.id, provider: "credentials" },
      select: { id: true, access_token: true },
    });

    if (!account?.access_token) {
      return NextResponse.json({ error: "소셜 로그인 계정은 비밀번호를 변경할 수 없습니다." }, { status: 400 });
    }

    const valid = await bcrypt.compare(currentPassword, account.access_token);
    if (!valid) {
      return NextResponse.json({ error: "현재 비밀번호가 올바르지 않습니다." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await db.account.update({
      where: { id: account.id },
      data: { access_token: hashed },
    });
  }

  if (Object.keys(updateData).length > 0) {
    await db.user.update({
      where: { id: session.user.id },
      data: updateData,
    });
  }

  return NextResponse.json({ ok: true });
}
