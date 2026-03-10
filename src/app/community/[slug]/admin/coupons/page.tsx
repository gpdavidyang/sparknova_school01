import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { CouponManager } from "./coupon-manager";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CouponsPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true, slug: true, name: true },
  });
  if (!community) notFound();
  if (community.ownerId !== session.user.id) redirect(`/community/${slug}`);

  const coupons = await db.coupon.findMany({
    where: { communityId: community.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { usages: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold">쿠폰 관리</h1>
        <p className="text-sm text-muted-foreground">할인 쿠폰을 생성하고 관리하세요.</p>
      </div>
      <CouponManager slug={slug} coupons={coupons} />
    </div>
  );
}
