import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { InsuranceReviewList } from "./insurance-review-list";

export default async function AdminInsurancePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (me?.role !== "SUPER_ADMIN") redirect("/");

  const insurances = await db.insuranceGuarantee.findMany({
    include: {
      community: {
        select: {
          name: true,
          slug: true,
          owner: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold">보증보험 심사</h1>
        <p className="text-sm text-muted-foreground mt-1">
          커뮤니티 보증보험 제출 건을 심사합니다.
        </p>
      </div>
      <InsuranceReviewList
        insurances={JSON.parse(JSON.stringify(insurances))}
      />
    </div>
  );
}
