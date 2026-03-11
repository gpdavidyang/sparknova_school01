import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET — 보증보험 목록 조회 (커뮤니티 오너)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const community = await db.community.findUnique({
    where: { slug: decodeURIComponent(slug) },
    select: { id: true, ownerId: true },
  });
  if (!community || community.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const insurances = await db.insuranceGuarantee.findMany({
    where: { communityId: community.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(insurances);
}

// POST — 보증보험 제출
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const community = await db.community.findUnique({
    where: { slug: decodeURIComponent(slug) },
    select: { id: true, ownerId: true },
  });
  if (!community || community.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { insurerName, policyNumber, fileUrl, issuedAt, expiresAt, amount } = await req.json();

  if (!insurerName || !policyNumber || !fileUrl || !issuedAt || !expiresAt) {
    return NextResponse.json({ error: "필수 항목을 모두 입력해주세요." }, { status: 400 });
  }

  const insurance = await db.insuranceGuarantee.create({
    data: {
      communityId: community.id,
      insurerName,
      policyNumber,
      fileUrl,
      issuedAt: new Date(issuedAt),
      expiresAt: new Date(expiresAt),
      amount: amount ?? 10_000_000,
    },
  });

  return NextResponse.json(insurance, { status: 201 });
}
