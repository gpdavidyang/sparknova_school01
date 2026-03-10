import { Suspense } from "react";
import { db } from "@/lib/db";
import { CommunityCard, type CommunityCardData } from "@/components/community/community-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExploreFilters } from "@/components/community/explore-filters";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "커뮤니티 탐색" };

interface Props {
  searchParams: Promise<{ sort?: string; type?: string }>;
}

async function CommunityList({ sort, type }: { sort: string; type: string }) {
  const isPaid = type === "paid" ? true : type === "free" ? false : undefined;

  const communities: CommunityCardData[] = await db.community.findMany({
    where: {
      isPublic: true,
      isActive: true,
      ...(isPaid !== undefined
        ? { joinType: isPaid ? { in: ["PAID", "ONE_TIME"] } : "FREE" }
        : {}),
    },
    include: { owner: { select: { name: true, avatarUrl: true } } },
    orderBy: sort === "newest" ? { createdAt: "desc" } : { memberCount: "desc" },
    take: 30,
  });

  if (communities.length === 0) {
    return (
      <p className="col-span-3 text-center text-muted-foreground py-12">
        커뮤니티가 없습니다.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {communities.map((community) => (
        <CommunityCard key={community.id} community={community} />
      ))}
    </div>
  );
}

export default async function ExplorePage({ searchParams }: Props) {
  const { sort = "popular", type = "all" } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">커뮤니티 탐색</h1>
        <p className="text-muted-foreground">관심 있는 커뮤니티를 찾아 가입해보세요.</p>
      </div>

      <ExploreFilters sort={sort} type={type} />

      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        }
      >
        <CommunityList sort={sort} type={type} />
      </Suspense>
    </div>
  );
}
