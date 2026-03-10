import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function toSlug(text: string) {
  const ascii = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  return ascii || `community-${Date.now()}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { name, description, joinType } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "커뮤니티 이름을 입력해주세요." }, { status: 400 });
  }

  // 슬러그 생성 (중복 시 숫자 추가)
  let slug = toSlug(name);
  if (!slug) slug = "community";

  const existing = await db.community.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  const community = await db.community.create({
    data: {
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      joinType: joinType ?? "FREE",
      ownerId: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
  });

  return NextResponse.json({ slug: community.slug }, { status: 201 });
}
