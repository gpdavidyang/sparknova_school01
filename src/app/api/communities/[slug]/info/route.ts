import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: _rawSlug } = await params;
  const slug = decodeURIComponent(_rawSlug);

  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, price: true, description: true },
  });

  if (!community) {
    return NextResponse.json({ error: "커뮤니티를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({
    id: community.id,
    name: community.name,
    slug: community.slug,
    price: community.price ?? 0,
    description: community.description,
  });
}
