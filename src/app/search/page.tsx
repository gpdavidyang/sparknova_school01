import { db } from "@/lib/db";
import Link from "next/link";
import { Users, BookOpen, Search, FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { Metadata } from "next";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `"${q}" 검색 결과` : "검색" };
}

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

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <EmptyState icon={Search} title="검색어를 입력하세요" description="커뮤니티, 강좌, 게시글을 검색할 수 있습니다." />
      </div>
    );
  }

  // Sanitize: strip tsquery special characters, then build safe prefix query
  const sanitized = query.replace(/[&|!():*<>'\\]/g, " ");
  const words = sanitized.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <EmptyState icon={Search} title="검색어를 입력하세요" description="커뮤니티, 강좌, 게시글을 검색할 수 있습니다." />
      </div>
    );
  }

  const tsquery = words.map((w) => `${w}:*`).join(" & ");

  const [communities, courses, posts] = await Promise.all([
    db.$queryRaw<CommunityRow[]>`
      SELECT id, slug, name, description, "avatarUrl", "memberCount"
      FROM "Community"
      WHERE
        "isPublic" = true
        AND (
          to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, ''))
            @@ to_tsquery('simple', ${tsquery})
          OR name ILIKE ${'%' + query + '%'}
          OR description ILIKE ${'%' + query + '%'}
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
        c.id, c.title, c.description, c."thumbnailUrl", c.price,
        cm.slug AS "communitySlug", cm.name AS "communityName"
      FROM "Course" c
      JOIN "Community" cm ON cm.id = c."communityId"
      WHERE
        c."isPublished" = true
        AND (
          to_tsvector('simple', coalesce(c.title, '') || ' ' || coalesce(c.description, ''))
            @@ to_tsquery('simple', ${tsquery})
          OR c.title ILIKE ${'%' + query + '%'}
          OR c.description ILIKE ${'%' + query + '%'}
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
        p.id, p.title,
        cm.slug AS "communitySlug", cm.name AS "communityName",
        u.name AS "authorName", p."createdAt"
      FROM "Post" p
      JOIN "Community" cm ON cm.id = p."communityId"
      LEFT JOIN "User" u ON u.id = p."authorId"
      WHERE
        cm."isPublic" = true
        AND (
          to_tsvector('simple', coalesce(p.title, '') || ' ' || coalesce(p.content, ''))
            @@ to_tsquery('simple', ${tsquery})
          OR p.title ILIKE ${'%' + query + '%'}
        )
      ORDER BY
        ts_rank(
          to_tsvector('simple', coalesce(p.title, '') || ' ' || coalesce(p.content, '')),
          to_tsquery('simple', ${tsquery})
        ) DESC
      LIMIT 10
    `,
  ]);

  const total = communities.length + courses.length + posts.length;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-xl font-bold">"{query}" 검색 결과</h1>
        <p className="text-sm text-muted-foreground mt-1">총 {total}개의 결과</p>
      </div>

      {/* 커뮤니티 */}
      {communities.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            커뮤니티 ({communities.length})
          </h2>
          <div className="space-y-2">
            {communities.map((c) => (
              <Link
                key={c.id}
                href={`/community/${c.slug}`}
                className="border rounded-xl p-4 bg-card flex items-center gap-3 hover:border-blue-300 transition-colors block"
              >
                <div className="h-12 w-12 rounded-xl bg-blue-100 overflow-hidden shrink-0 flex items-center justify-center font-bold text-blue-600">
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    c.name[0]
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{c.name}</p>
                  {c.description && (
                    <p className="text-sm text-muted-foreground truncate">{c.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{c.memberCount.toLocaleString()}명</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 강좌 */}
      {courses.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-500" />
            강좌 ({courses.length})
          </h2>
          <div className="space-y-2">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/community/${course.communitySlug}/classroom/${course.id}`}
                className="border rounded-xl p-4 bg-card flex items-center gap-3 hover:border-blue-300 transition-colors block"
              >
                <div className="h-14 w-20 rounded-lg bg-blue-50 overflow-hidden shrink-0">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-blue-300" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{course.title}</p>
                  <p className="text-xs text-muted-foreground">{course.communityName}</p>
                  <p className="text-sm font-semibold text-blue-600 mt-0.5">
                    {!course.price ? "무료" : `₩${course.price.toLocaleString()}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 게시글 */}
      {posts.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            게시글 ({posts.length})
          </h2>
          <div className="space-y-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/community/${post.communitySlug}/posts/${post.id}`}
                className="border rounded-xl p-4 bg-card hover:border-blue-300 transition-colors block"
              >
                <p className="font-medium truncate">{post.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{post.communityName}</span>
                  {post.authorName && (
                    <>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{post.authorName}</span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {total === 0 && (
        <EmptyState
          icon={Search}
          title="검색 결과가 없습니다"
          description={`"${query}"에 대한 결과를 찾을 수 없습니다.`}
        />
      )}
    </div>
  );
}
