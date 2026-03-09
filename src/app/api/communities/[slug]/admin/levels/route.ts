import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function getOwnerCommunity(slug: string, userId: string) {
  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });
  if (!community || community.ownerId !== userId) return null;
  return community;
}

// PUT: save level configs
export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const community = await getOwnerCommunity(slug, session.user.id);
  if (!community) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { levels } = await req.json() as {
    levels: Array<{ level: number; name: string; minPoints: number }>;
  };

  // upsert each level config
  await Promise.all(
    levels.map((l) =>
      db.levelConfig.upsert({
        where: { communityId_level: { communityId: community.id, level: l.level } },
        create: { communityId: community.id, level: l.level, name: l.name, minPoints: l.minPoints },
        update: { name: l.name, minPoints: l.minPoints },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
