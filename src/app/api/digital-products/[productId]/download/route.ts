import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ productId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { productId } = await params;

  // 구매 여부 확인
  const purchase = await db.digitalPurchase.findUnique({
    where: { productId_userId: { productId, userId: session.user.id } },
  });

  // 커뮤니티 오너도 다운로드 가능
  const product = await db.digitalProduct.findUnique({
    where: { id: productId },
    select: { fileUrl: true, fileName: true, community: { select: { ownerId: true } } },
  });

  if (!product) return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });

  const isOwner = product.community.ownerId === session.user.id;
  if (!purchase && !isOwner) {
    return NextResponse.json({ error: "구매 후 다운로드 가능합니다." }, { status: 403 });
  }

  // 파일 URL로 리다이렉트 (Supabase public URL)
  return NextResponse.redirect(product.fileUrl);
}
