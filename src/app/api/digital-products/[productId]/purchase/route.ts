import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ productId: string }> };

// POST: 무료 상품 즉시 구매 (유료는 결제 완료 후 처리)
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { productId } = await params;

  const product = await db.digitalProduct.findUnique({
    where: { id: productId, isPublished: true },
    select: { id: true, price: true },
  });

  if (!product) return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  if (product.price > 0) {
    return NextResponse.json({ error: "유료 상품은 결제가 필요합니다." }, { status: 400 });
  }

  const purchase = await db.digitalPurchase.upsert({
    where: { productId_userId: { productId, userId: session.user.id } },
    create: { productId, userId: session.user.id },
    update: {},
  });

  await db.digitalProduct.update({
    where: { id: productId },
    data: { sellCount: { increment: 1 } },
  });

  return NextResponse.json({ purchaseId: purchase.id });
}
