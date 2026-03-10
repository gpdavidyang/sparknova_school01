import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ slug: string; reportId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, reportId } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const community = await db.community.findUnique({
    where: { slug: decodedSlug },
    select: { id: true, ownerId: true },
  });
  if (!community || community.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status } = await req.json();
  const allowed = ["REVIEWED", "DISMISSED", "REMOVED"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const report = await db.report.update({
    where: { id: reportId },
    data: { status },
    select: { id: true, status: true },
  });

  return NextResponse.json(report);
}
