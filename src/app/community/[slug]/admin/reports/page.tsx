import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ReportActions } from "./report-actions";
import { Flag } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "대기 중",
  REVIEWED: "검토 완료",
  DISMISSED: "무시됨",
  REMOVED: "삭제됨",
};

const TARGET_LABELS: Record<string, string> = {
  POST: "게시글",
  COMMENT: "댓글",
};

export default async function AdminReportsPage({ params, searchParams }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const { status = "PENDING" } = await searchParams;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true, name: true },
  });
  if (!community || community.ownerId !== session.user.id) notFound();

  const reports = await db.report.findMany({
    where: { status: status as never },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const tabs = ["PENDING", "REVIEWED", "DISMISSED", "REMOVED"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-red-50 flex items-center justify-center">
          <Flag className="h-4 w-4 text-red-500" />
        </div>
        <div>
          <h1 className="font-bold">신고 관리</h1>
          <p className="text-xs text-muted-foreground">{community.name}</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b">
        {tabs.map((s) => (
          <a
            key={s}
            href={`/community/${slug}/admin/reports?status=${s}`}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              status === s
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {STATUS_LABELS[s]}
          </a>
        ))}
      </div>

      {reports.length === 0 ? (
        <div className="border rounded-xl p-10 text-center text-muted-foreground bg-card">
          <Flag className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p>신고 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">대상</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">신고 사유</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">신고자</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">일시</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">처리</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium">
                      {TARGET_LABELS[report.targetType]}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{report.targetId.slice(0, 8)}…</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{report.reason}</p>
                    {report.detail && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{report.detail}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{report.reporter.name ?? "이름 없음"}</p>
                    <p className="text-xs text-muted-foreground">{report.reporter.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                    {new Date(report.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ReportActions reportId={report.id} currentStatus={report.status} slug={slug} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
