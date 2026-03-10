import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ slug: string }> };

async function getOwnerCommunity(rawSlug: string, userId: string) {
  const slug = decodeURIComponent(rawSlug);
  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });
  if (!community || community.ownerId !== userId) return null;
  return community;
}

// GET: 디지털 상품 목록
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const community = await getOwnerCommunity(slug, session.user.id);
  if (!community) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const products = await db.digitalProduct.findMany({
    where: { communityId: community.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, description: true, thumbnailUrl: true,
      fileName: true, fileSize: true, price: true, isPublished: true,
      sellCount: true, createdAt: true,
    },
  });

  return NextResponse.json(products);
}

// POST: 디지털 상품 생성
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const community = await getOwnerCommunity(slug, session.user.id);
  if (!community) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, description, thumbnailUrl, fileUrl, fileName, fileSize, price } = await req.json();

  if (!title?.trim()) return NextResponse.json({ error: "상품명을 입력해주세요." }, { status: 400 });
  if (!fileUrl) return NextResponse.json({ error: "파일을 업로드해주세요." }, { status: 400 });
  if (price == null || price < 0) return NextResponse.json({ error: "가격을 입력해주세요." }, { status: 400 });

  const product = await db.digitalProduct.create({
    data: {
      communityId: community.id,
      title: title.trim(),
      description: description?.trim() || null,
      thumbnailUrl: thumbnailUrl || null,
      fileUrl,
      fileName: fileName || "파일",
      fileSize: fileSize || 0,
      price,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
