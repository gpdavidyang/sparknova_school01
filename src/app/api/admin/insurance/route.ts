import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET — 전체 보증보험 목록 (슈퍼 어드민)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const insurances = await db.insuranceGuarantee.findMany({
    include: {
      community: { select: { name: true, slug: true, owner: { select: { name: true, email: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(insurances);
}
