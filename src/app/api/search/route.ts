import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) return NextResponse.json({ communities: [], courses: [], posts: [] });

  // Sanitize: strip tsquery special characters, then build safe prefix query
  const sanitized = q.replace(/[&|!():*<>'\\]/g, " ");
  const words = sanitized.split(/\s+/).filter(Boolean);
  if (words.length === 0) return NextResponse.json({ communities: [], courses: [], posts: [] });
  const tsquery = words.map((w) => `${w}:*`).join(" & ");

  type CommunityRow = {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    avatarUrl: string | null;
    memberCount: number;
  };

  type CourseRow = {
    id: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    price: number | null;
    communitySlug: string;
    communityName: string;
  };

  type PostRow = {
    id: string;
    title: string;
    communitySlug: string;
    communityName: string;
    authorName: string | null;
    createdAt: Date;
  };

  const [communities, courses, posts] = await Promise.all([
    db.$queryRaw<CommunityRow[]>`
      SELECT
        id, slug, name, description, "avatarUrl", "memberCount"
      FROM "Community"
      WHERE
        "isPublic" = true
        AND (
          to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, ''))
            @@ to_tsquery('simple', ${tsquery})
          OR name ILIKE ${'%' + q + '%'}
          OR description ILIKE ${'%' + q + '%'}
        )
      ORDER BY
        ts_rank(
          to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, '')),
          to_tsquery('simple', ${tsquery})
        ) DESC
      LIMIT 10
    `,
    db.$queryRaw<CourseRow[]>`
      SELECT
        c.id,
        c.title,
        c.description,
        c."thumbnailUrl",
        c.price,
        cm.slug AS "communitySlug",
        cm.name AS "communityName"
      FROM "Course" c
      JOIN "Community" cm ON cm.id = c."communityId"
      WHERE
        c."isPublished" = true
        AND (
          to_tsvector('simple', coalesce(c.title, '') || ' ' || coalesce(c.description, ''))
            @@ to_tsquery('simple', ${tsquery})
          OR c.title ILIKE ${'%' + q + '%'}
          OR c.description ILIKE ${'%' + q + '%'}
        )
      ORDER BY
        ts_rank(
          to_tsvector('simple', coalesce(c.title, '') || ' ' || coalesce(c.description, '')),
          to_tsquery('simple', ${tsquery})
        ) DESC
      LIMIT 10
    `,
    db.$queryRaw<PostRow[]>`
      SELECT
        p.id,
        p.title,
        cm.slug AS "communitySlug",
        cm.name AS "communityName",
        u.name AS "authorName",
        p."createdAt"
      FROM "Post" p
      JOIN "Community" cm ON cm.id = p."communityId"
      LEFT JOIN "User" u ON u.id = p."authorId"
      WHERE
        cm."isPublic" = true
        AND (
          to_tsvector('simple', coalesce(p.title, '') || ' ' || coalesce(p.content, ''))
            @@ to_tsquery('simple', ${tsquery})
          OR p.title ILIKE ${'%' + q + '%'}
        )
      ORDER BY
        ts_rank(
          to_tsvector('simple', coalesce(p.title, '') || ' ' || coalesce(p.content, '')),
          to_tsquery('simple', ${tsquery})
        ) DESC
      LIMIT 10
    `,
  ]);

  // Normalize course shape to match previous API contract
  const normalizedCourses = courses.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    thumbnailUrl: c.thumbnailUrl,
    price: c.price,
    community: { slug: c.communitySlug, name: c.communityName },
  }));

  return NextResponse.json({ communities, courses: normalizedCourses, posts });
}
