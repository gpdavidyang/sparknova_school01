import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  const events = await db.event.findMany({
    where: { startAt: { gte: now, lte: oneHourLater } },
    include: { attendees: { select: { userId: true } } },
  });

  let notified = 0;

  for (const event of events) {
    for (const attendee of event.attendees) {
      // Skip if already notified for this event
      const existing = await db.notification.findFirst({
        where: {
          userId: attendee.userId,
          type: "EVENT_REMINDER",
          referenceId: event.id,
        },
      });
      if (existing) continue;

      const minutesUntil = Math.round((event.startAt.getTime() - now.getTime()) / 60000);

      await db.notification.create({
        data: {
          userId: attendee.userId,
          type: "EVENT_REMINDER",
          title: "이벤트가 곧 시작됩니다",
          body: `"${event.title}" 이벤트가 약 ${minutesUntil}분 후에 시작됩니다.`,
          referenceId: event.id,
          referenceType: "Event",
        },
      });

      notified++;
    }
  }

  return NextResponse.json({ events: events.length, notified });
}
