import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Package, Plus, Eye, EyeOff, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DigitalProductsManager } from "./digital-products-manager";

interface Props { params: Promise<{ slug: string }> }

export default async function AdminDigitalProductsPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true, name: true },
  });
  if (!community || community.ownerId !== session.user.id) notFound();

  const products = await db.digitalProduct.findMany({
    where: { communityId: community.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, fileName: true, fileSize: true,
      price: true, isPublished: true, sellCount: true, thumbnailUrl: true,
    },
  });

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
            <Package className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">디지털 상품</h1>
            <p className="text-sm text-muted-foreground">전자책·파일 판매 관리</p>
          </div>
        </div>
        <Link href={`/community/${slug}/admin/digital-products/new`}>
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
            <Plus className="h-4 w-4 mr-1" />상품 등록
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>등록된 디지털 상품이 없습니다.</p>
          <Link href={`/community/${slug}/admin/digital-products/new`}>
            <Button variant="outline" size="sm" className="mt-4">첫 상품 등록하기</Button>
          </Link>
        </div>
      ) : (
        <DigitalProductsManager slug={slug} initialProducts={products} />
      )}
    </div>
  );
}
