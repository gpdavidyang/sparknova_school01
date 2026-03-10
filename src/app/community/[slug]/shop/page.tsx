import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Package, ShoppingBag } from "lucide-react";
import { DigitalProductCard } from "./digital-product-card";

interface Props { params: Promise<{ slug: string }> }

export default async function CommunityShopPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const session = await auth();

  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, name: true, ownerId: true },
  });
  if (!community) notFound();

  const products = await db.digitalProduct.findMany({
    where: { communityId: community.id, isPublished: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, description: true, thumbnailUrl: true,
      fileName: true, fileSize: true, price: true, sellCount: true,
    },
  });

  // 현재 사용자가 구매한 상품 ID
  const purchasedIds = session?.user?.id
    ? (await db.digitalPurchase.findMany({
        where: { userId: session.user.id, productId: { in: products.map((p) => p.id) } },
        select: { productId: true },
      })).map((p) => p.productId)
    : [];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
          <ShoppingBag className="h-5 w-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold">디지털 상품</h1>
          <p className="text-sm text-muted-foreground">{community.name}</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>등록된 상품이 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((p) => (
            <DigitalProductCard
              key={p.id}
              product={p}
              slug={slug}
              isPurchased={purchasedIds.includes(p.id)}
              isLoggedIn={!!session?.user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
