import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ slug: string }> };

async function getCommunity(slug: string) {
  return db.community.findUnique({ where: { slug: decodeURIComponent(slug) }, select: { id: true, ownerId: true } });
}

export async function GET(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const community = await getCommunity(slug);
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const events = await db.event.findMany({
    where: { communityId: community.id },
    orderBy: { startAt: "asc" },
    include: { _count: { select: { attendees: true } } },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const community = await getCommunity(slug);
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (community.ownerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, description, startAt, endAt, location, isOnline, meetingUrl, maxAttendees } = await req.json();
  if (!title?.trim() || !startAt) return NextResponse.json({ error: "제목과 시작일시는 필수입니다." }, { status: 400 });

  const event = await db.event.create({
    data: {
      communityId: community.id,
      title: title.trim(),
      description: description?.trim() || null,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : null,
      location: location?.trim() || null,
      isOnline: isOnline ?? true,
      meetingUrl: meetingUrl?.trim() || null,
      maxAttendees: maxAttendees ? Number(maxAttendees) : null,
    },
    include: { _count: { select: { attendees: true } } },
  });

  return NextResponse.json(event, { status: 201 });
}
