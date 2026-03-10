import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) return NextResponse.json({ communities: [], courses: [] });

  const [communities, courses] = await Promise.all([
    db.community.findMany({
      where: {
        isPublic: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, slug: true, name: true, description: true, avatarUrl: true, memberCount: true },
      take: 10,
    }),
    db.course.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        price: true,
        community: { select: { slug: true, name: true } },
      },
      take: 10,
    }),
  ]);

  return NextResponse.json({ communities, courses });
}
