import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PostFeed } from "@/components/community/post-feed";
import { PostComposer } from "@/components/community/post-composer";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const community = await db.community.findUnique({ where: { slug } });
  if (!community) return {};
  return {
    title: community.name,
    description: community.description ?? `${community.name} 커뮤니티`,
    openGraph: {
      title: community.name,
      description: community.description ?? `${community.name} 커뮤니티`,
      ...(community.avatarUrl ? { images: [{ url: community.avatarUrl }] } : {}),
    },
  };
}

export default async function CommunityFeedPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const community = await db.community.findUnique({ where: { slug } });
  if (!community) notFound();

  return (
    <div className="space-y-4">
      <PostComposer communityId={community.id} communitySlug={slug} />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <PostFeed communityId={community.id} communitySlug={slug} />
      </Suspense>
    </div>
  );
}
