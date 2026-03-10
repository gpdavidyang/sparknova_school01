import { Suspense } from "react";
import { db } from "@/lib/db";
import Link from "next/link";
import { Users, BookOpen, Search } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { Metadata } from "next";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `"${q}" 검색 결과` : "검색" };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <EmptyState icon={Search} title="검색어를 입력하세요" description="커뮤니티와 강좌를 검색할 수 있습니다." />
      </div>
    );
  }

  const [communities, courses] = await Promise.all([
    db.community.findMany({
      where: {
        isPublic: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, slug: true, name: true, description: true, avatarUrl: true, memberCount: true },
      take: 10,
    }),
    db.course.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
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

  const total = communities.length + courses.length;

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
                href={`/community/${course.community.slug}/classroom/${course.id}`}
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
                  <p className="text-xs text-muted-foreground">{course.community.name}</p>
                  <p className="text-sm font-semibold text-blue-600 mt-0.5">
                    {!course.price ? "무료" : `₩${course.price.toLocaleString()}`}
                  </p>
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
