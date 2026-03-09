import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLevelConfig } from "@/lib/gamification";
import { Settings, BookOpen, Users, Star } from "lucide-react";
import { CoursePublishToggle } from "@/components/admin/course-publish-toggle";
import { MemberActions } from "@/components/admin/member-actions";
import { LevelConfigForm } from "@/components/admin/level-config-form";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "오너",
  ADMIN: "관리자",
  MODERATOR: "모더레이터",
  MEMBER: "멤버",
};

export default async function AdminPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab = "courses" } = await searchParams;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true, name: true },
  });
  if (!community || community.ownerId !== session.user.id) notFound();

  const tabs = [
    { key: "courses", label: "강좌 관리", icon: BookOpen },
    { key: "members", label: "멤버 관리", icon: Users },
    { key: "levels",  label: "레벨 설정", icon: Star },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-orange-50 flex items-center justify-center">
          <Settings className="h-4 w-4 text-orange-500" />
        </div>
        <div>
          <h1 className="font-bold">커뮤니티 관리</h1>
          <p className="text-xs text-muted-foreground">{community.name}</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b">
        {tabs.map(({ key, label, icon: Icon }) => (
          <a
            key={key}
            href={`/community/${slug}/admin?tab=${key}`}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </a>
        ))}
      </div>

      {/* 강좌 관리 */}
      {tab === "courses" && <CoursesTab slug={slug} communityId={community.id} />}
      {/* 멤버 관리 */}
      {tab === "members" && <MembersTab slug={slug} communityId={community.id} />}
      {/* 레벨 설정 */}
      {tab === "levels" && <LevelsTab slug={slug} communityId={community.id} />}
    </div>
  );
}

async function CoursesTab({ slug, communityId }: { slug: string; communityId: string }) {
  const courses = await db.course.findMany({
    where: { communityId },
    include: { _count: { select: { enrollments: true, modules: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (courses.length === 0) {
    return (
      <div className="border rounded-xl p-8 text-center text-muted-foreground bg-card">
        <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
        <p>아직 강좌가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">강좌명</th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">모듈</th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">수강자</th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">가격</th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">공개</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3">
                <span className="font-medium truncate max-w-[200px] block">{course.title}</span>
              </td>
              <td className="px-4 py-3 text-center text-muted-foreground">{course._count.modules}</td>
              <td className="px-4 py-3 text-center text-muted-foreground">{course._count.enrollments}</td>
              <td className="px-4 py-3 text-center">
                <span className={`text-xs font-medium ${course.isFree ? "text-green-600" : "text-orange-600"}`}>
                  {course.isFree ? "무료" : `${course.price?.toLocaleString()}원`}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex justify-center">
                  <CoursePublishToggle
                    slug={slug}
                    courseId={course.id}
                    initialPublished={course.isPublished}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function MembersTab({ slug, communityId }: { slug: string; communityId: string }) {
  const members = await db.communityMember.findMany({
    where: { communityId, isActive: true },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    orderBy: { joinedAt: "asc" },
  });

  const roleOrder: Record<string, number> = { OWNER: 0, ADMIN: 1, MODERATOR: 2, MEMBER: 3 };
  members.sort((a, b) => (roleOrder[a.role] ?? 4) - (roleOrder[b.role] ?? 4));

  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">멤버</th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">역할</th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">가입일</th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">관리</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-600 shrink-0">
                    {m.user.avatarUrl ? (
                      <img src={m.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      (m.user.name ?? m.user.email)[0]?.toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{m.user.name ?? "이름 없음"}</p>
                    <p className="text-xs text-muted-foreground">{m.user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  m.role === "OWNER" ? "bg-orange-100 text-orange-700" :
                  m.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                  m.role === "MODERATOR" ? "bg-blue-100 text-blue-700" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {ROLE_LABELS[m.role]}
                </span>
              </td>
              <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                {new Date(m.joinedAt).toLocaleDateString("ko-KR")}
              </td>
              <td className="px-4 py-3 text-center">
                {m.role !== "OWNER" ? (
                  <MemberActions slug={slug} memberId={m.id} currentRole={m.role} />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function LevelsTab({ slug, communityId }: { slug: string; communityId: string }) {
  const levels = await getLevelConfig(communityId);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        각 레벨의 이름과 최소 포인트를 커스터마이징하세요.
      </p>
      <LevelConfigForm slug={slug} initialLevels={levels} />
    </div>
  );
}
