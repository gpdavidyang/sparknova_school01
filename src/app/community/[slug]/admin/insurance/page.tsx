import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { InsuranceManager } from "./insurance-manager";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function InsurancePage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true, name: true },
  });
  if (!community || community.ownerId !== session.user.id) notFound();

  const insurances = await db.insuranceGuarantee.findMany({
    where: { communityId: community.id },
    orderBy: { createdAt: "desc" },
  });

  // 현재 유효한 보증보험 여부
  const hasValid = insurances.some(
    (i) => i.status === "APPROVED" && new Date(i.expiresAt) > new Date(),
  );

  return (
    <InsuranceManager
      slug={slug}
      insurances={JSON.parse(JSON.stringify(insurances))}
      hasValid={hasValid}
    />
  );
}
