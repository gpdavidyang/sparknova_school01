import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ slug: string }> };

// GET: 쿠폰 목록 조회
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (community.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const coupons = await db.coupon.findMany({
    where: { communityId: community.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(coupons);
}

// POST: 쿠폰 생성
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (community.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { code, description, discountType, discountValue, minAmount, maxUses, expiresAt } = body;

  if (!code || !discountValue) {
    return NextResponse.json({ error: "코드와 할인 값은 필수입니다." }, { status: 400 });
  }

  // 중복 코드 체크
  const existing = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (existing) {
    return NextResponse.json({ error: "이미 사용 중인 쿠폰 코드입니다." }, { status: 409 });
  }

  const coupon = await db.coupon.create({
    data: {
      communityId: community.id,
      code: code.toUpperCase(),
      description,
      discountType: discountType || "PERCENTAGE",
      discountValue: Number(discountValue),
      minAmount: minAmount ? Number(minAmount) : null,
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  return NextResponse.json(coupon, { status: 201 });
}
