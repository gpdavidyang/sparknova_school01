import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Award, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { CertificatePrintButton } from "@/components/classroom/certificate-print-button";

interface Props {
  params: Promise<{ slug: string; courseId: string }>;
}

export default async function CertificatePage({ params }: Props) {
  const { slug: rawSlug, courseId } = await params;
  const slug = decodeURIComponent(rawSlug);
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const certificate = await db.certificate.findUnique({
    where: { courseId_userId: { courseId, userId: session.user.id } },
    include: {
      course: { select: { title: true } },
      user: { select: { name: true } },
    },
  });

  if (!certificate) notFound();

  const issuedAt = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  }).format(certificate.issuedAt);

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 print:min-h-screen print:py-0">
      <div className="text-center space-y-8 max-w-lg">
        <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-yellow-50 border-4 border-yellow-200 mx-auto">
          <Award className="h-12 w-12 text-yellow-500" />
        </div>

        {/* 수료증 카드 */}
        <div className="border-4 border-blue-200 rounded-2xl p-8 bg-gradient-to-br from-blue-50 to-pink-50 space-y-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Certificate of Completion</div>
          <div className="text-xs text-muted-foreground">수료 증명서</div>

          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">이 수료증은 다음 분이</p>
            <p className="text-2xl font-bold text-blue-600">{certificate.user.name ?? "수강생"}</p>
            <p className="text-muted-foreground text-sm">아래 강좌를 성공적으로 완료했음을 증명합니다.</p>
          </div>

          <div className="bg-white rounded-xl p-4 border">
            <p className="font-semibold text-lg">{certificate.course.title}</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">수료 완료</span>
          </div>

          <p className="text-xs text-muted-foreground">{issuedAt} 발급</p>
        </div>

        <div className="flex gap-3 justify-center print:hidden">
          <Link
            href={`/community/${slug}/classroom`}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-muted transition-colors"
          >
            클래스룸으로 돌아가기
          </Link>
          <Link
            href={`/community/${slug}/classroom/${courseId}`}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border hover:bg-muted transition-colors"
          >
            강좌 다시 보기
          </Link>
          <CertificatePrintButton />
        </div>
      </div>
    </div>
  );
}
