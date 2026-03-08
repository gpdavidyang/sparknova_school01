import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Plus, BookOpen, Users, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

async function CourseList({ slug }: { slug: string }) {
  const session = await auth();

  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });
  if (!community) notFound();

  const isOwner = session?.user?.id === community.ownerId;

  const courses = await db.course.findMany({
    where: {
      communityId: community.id,
      ...(isOwner ? {} : { isPublished: true }),
    },
    include: {
      modules: { select: { _count: { select: { lessons: true } } } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { order: "asc" },
  });

  const myEnrollments = session?.user?.id
    ? await db.enrollment.findMany({
        where: { userId: session.user.id, courseId: { in: courses.map((c) => c.id) } },
        select: { courseId: true, progress: true },
      })
    : [];
  const enrollMap = new Map(myEnrollments.map((e) => [e.courseId, e]));

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex justify-end">
          <Link
            href={`/community/${slug}/classroom/new`}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            강좌 만들기
          </Link>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">아직 강좌가 없습니다.</p>
          {isOwner && <p className="text-sm mt-1">첫 번째 강좌를 만들어보세요!</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => {
            const lessonCount = course.modules.reduce(
              (acc: number, m: { _count: { lessons: number } }) => acc + m._count.lessons, 0
            );
            const enrollment = enrollMap.get(course.id);
            return (
              <Link key={course.id} href={`/community/${slug}/classroom/${course.id}`}>
                <div className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-card">
                  <div className="h-36 bg-gradient-to-br from-orange-100 to-pink-100 relative">
                    {course.thumbnailUrl && (
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                    )}
                    {!course.isPublished && (
                      <Badge className="absolute top-2 left-2 bg-yellow-500 text-white border-0">미발행</Badge>
                    )}
                    {!course.isFree && (
                      <Badge className="absolute top-2 right-2 bg-black/60 text-white border-0">
                        <Lock className="h-3 w-3 mr-1" />유료
                      </Badge>
                    )}
                    {enrollment && (
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
                        <div className="h-full bg-orange-500 transition-all" style={{ width: `${enrollment.progress}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-2">{course.title}</h3>
                    {course.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <BookOpen className="h-3 w-3" />{lessonCount}개 레슨
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />{course._count.enrollments.toLocaleString()}명
                      </span>
                      {enrollment ? (
                        <span className={cn("text-xs font-medium", enrollment.progress === 100 ? "text-green-500" : "text-orange-500")}>
                          {enrollment.progress === 100 ? "✓ 수료" : `${Math.round(enrollment.progress)}% 수강 중`}
                        </span>
                      ) : course.price ? (
                        <span className="text-xs font-semibold text-orange-600">₩{course.price.toLocaleString()}</span>
                      ) : (
                        <span className="text-xs font-medium text-green-600">무료</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default async function ClassroomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">클래스룸</h2>
        <p className="text-sm text-muted-foreground">강좌를 수강하고 새로운 지식을 쌓으세요.</p>
      </div>
      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      }>
        <CourseList slug={slug} />
      </Suspense>
    </div>
  );
}
