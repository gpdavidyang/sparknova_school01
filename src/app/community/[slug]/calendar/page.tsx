import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { CalendarEventList } from "@/components/community/calendar-event-list";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CommunityCalendarPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const session = await auth();

  const community = await db.community.findUnique({
    where: { slug },
    select: { id: true, ownerId: true, name: true },
  });
  if (!community) notFound();

  const isOwner = session?.user?.id === community.ownerId;

  const events = await db.event.findMany({
    where: { communityId: community.id },
    orderBy: { startAt: "asc" },
    include: { _count: { select: { attendees: true } } },
  });

  const myAttendances = session?.user?.id
    ? await db.eventAttendee.findMany({
        where: { userId: session.user.id, eventId: { in: events.map((e) => e.id) } },
        select: { eventId: true },
      })
    : [];
  const attendingSet = new Set(myAttendances.map((a) => a.eventId));

  const now = new Date();
  const upcoming = events.filter((e) => e.startAt >= now);
  const past = events.filter((e) => e.startAt < now);

  const toEventData = (e: typeof events[0]) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    startAt: e.startAt.toISOString(),
    endAt: e.endAt?.toISOString() ?? null,
    location: e.location,
    isOnline: e.isOnline,
    meetingUrl: e.meetingUrl,
    maxAttendees: e.maxAttendees,
    attending: attendingSet.has(e.id),
    attendeeCount: e._count.attendees,
  });

  return (
    <CalendarEventList
      slug={slug}
      isOwner={isOwner}
      isLoggedIn={!!session?.user?.id}
      upcoming={upcoming.map(toEventData)}
      past={past.map(toEventData)}
    />
  );
}
