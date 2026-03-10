import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ slug: string; eventId: string }> };

async function getOwnerCommunity(slug: string, userId: string) {
  const community = await db.community.findUnique({
    where: { slug: decodeURIComponent(slug) },
    select: { id: true, ownerId: true },
  });
  if (!community || community.ownerId !== userId) return null;
  return community;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, eventId } = await params;
  const community = await getOwnerCommunity(slug, session.user.id);
  if (!community) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, description, startAt, endAt, location, isOnline, meetingUrl, maxAttendees } = await req.json();

  const event = await db.event.update({
    where: { id: eventId, communityId: community.id },
    data: {
      title: title?.trim(),
      description: description?.trim() || null,
      startAt: startAt ? new Date(startAt) : undefined,
      endAt: endAt ? new Date(endAt) : null,
      location: location?.trim() || null,
      isOnline: isOnline ?? true,
      meetingUrl: meetingUrl?.trim() || null,
      maxAttendees: maxAttendees ? Number(maxAttendees) : null,
    },
    include: { _count: { select: { attendees: true } } },
  });

  return NextResponse.json(event);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, eventId } = await params;
  const community = await getOwnerCommunity(slug, session.user.id);
  if (!community) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.event.delete({ where: { id: eventId, communityId: community.id } });
  return NextResponse.json({ ok: true });
}

// 참석 토글
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, eventId } = await params;
  const community = await db.community.findUnique({
    where: { slug: decodeURIComponent(slug) },
    select: { id: true },
  });
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await db.eventAttendee.findUnique({
    where: { eventId_userId: { eventId, userId: session.user.id } },
  });

  if (existing) {
    await db.eventAttendee.delete({ where: { eventId_userId: { eventId, userId: session.user.id } } });
    return NextResponse.json({ attending: false });
  } else {
    await db.eventAttendee.create({ data: { eventId, userId: session.user.id } });
    return NextResponse.json({ attending: true });
  }
}
