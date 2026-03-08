import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { slug } = await params;
  const community = await db.community.findUnique({ where: { slug } });
  if (!community) {
    return NextResponse.json({ error: "커뮤니티를 찾을 수 없습니다." }, { status: 404 });
  }

  const existing = await db.communityMember.findUnique({
    where: { communityId_userId: { communityId: community.id, userId: session.user.id } },
  });

  if (existing) {
    // 탈퇴 (OWNER는 탈퇴 불가)
    if (existing.role === "OWNER") {
      return NextResponse.json({ error: "오너는 탈퇴할 수 없습니다." }, { status: 400 });
    }
    await db.communityMember.delete({
      where: { communityId_userId: { communityId: community.id, userId: session.user.id } },
    });
    await db.community.update({
      where: { id: community.id },
      data: { memberCount: { decrement: 1 } },
    });
    return NextResponse.json({ joined: false });
  }

  // 가입
  await db.communityMember.create({
    data: { communityId: community.id, userId: session.user.id, role: "MEMBER" },
  });
  await db.community.update({
    where: { id: community.id },
    data: { memberCount: { increment: 1 } },
  });

  return NextResponse.json({ joined: true }, { status: 201 });
}
