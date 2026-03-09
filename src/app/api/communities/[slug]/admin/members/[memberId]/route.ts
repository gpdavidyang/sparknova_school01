import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ slug: string; memberId: string }> };

async function getOwnerCommunity(slug: string, userId: string) {
  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });
  if (!community || community.ownerId !== userId) return null;
  return community;
}

// PATCH: update member role
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, memberId } = await params;
  const community = await getOwnerCommunity(slug, session.user.id);
  if (!community) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { role } = await req.json();
  if (!["ADMIN", "MODERATOR", "MEMBER"].includes(role)) {
    return NextResponse.json({ error: "유효하지 않은 역할입니다." }, { status: 400 });
  }

  const member = await db.communityMember.update({
    where: { id: memberId, communityId: community.id },
    data: { role },
    select: { id: true, role: true },
  });

  return NextResponse.json(member);
}

// DELETE: remove member
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, memberId } = await params;
  const community = await getOwnerCommunity(slug, session.user.id);
  if (!community) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // OWNER는 추방 불가
  const member = await db.communityMember.findUnique({
    where: { id: memberId, communityId: community.id },
    select: { role: true, userId: true },
  });
  if (!member) return NextResponse.json({ error: "멤버를 찾을 수 없습니다." }, { status: 404 });
  if (member.role === "OWNER") return NextResponse.json({ error: "오너는 추방할 수 없습니다." }, { status: 400 });

  await db.communityMember.delete({ where: { id: memberId } });
  await db.community.update({
    where: { id: community.id },
    data: { memberCount: { decrement: 1 } },
  });

  return NextResponse.json({ ok: true });
}
