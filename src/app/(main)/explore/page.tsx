import { Suspense } from "react";
import { db } from "@/lib/db";
import { CommunityCard, type CommunityCardData } from "@/components/community/community-card";
import { Skeleton } from "@/components/ui/skeleton";

async function CommunityList() {
  const communities: CommunityCardData[] = await db.community.findMany({
    where: { isPublic: true, isActive: true },
    include: { owner: { select: { name: true, avatarUrl: true } } },
    orderBy: { memberCount: "desc" },
    take: 20,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {communities.map((community) => (
        <CommunityCard key={community.id} community={community} />
      ))}
      {communities.length === 0 && (
        <p className="col-span-3 text-center text-muted-foreground py-12">
          아직 커뮤니티가 없습니다. 첫 번째 커뮤니티를 만들어보세요!
        </p>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">커뮤니티 탐색</h1>
        <p className="text-muted-foreground">관심 있는 커뮤니티를 찾아 가입해보세요.</p>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        }
      >
        <CommunityList />
      </Suspense>
    </div>
  );
}
