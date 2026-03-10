import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Bell, Star, Heart, MessageSquare, Trophy, CheckCircle, DollarSign, Users, Zap } from "lucide-react";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  POST_LIKED:       { icon: Heart,        color: "text-red-500",    bg: "bg-red-50" },
  POST_COMMENTED:   { icon: MessageSquare,color: "text-blue-500",   bg: "bg-blue-50" },
  COMMENT_REPLIED:  { icon: MessageSquare,color: "text-blue-500",   bg: "bg-blue-50" },
  COMMENT_LIKED:    { icon: Heart,        color: "text-red-500",    bg: "bg-red-50" },
  NEW_MEMBER_JOINED:{ icon: Users,        color: "text-green-500",  bg: "bg-green-50" },
  LEVEL_UP:         { icon: Trophy,       color: "text-yellow-500", bg: "bg-yellow-50" },
  BADGE_EARNED:     { icon: Star,         color: "text-blue-500", bg: "bg-blue-50" },
  COURSE_PUBLISHED: { icon: Zap,          color: "text-purple-500", bg: "bg-purple-50" },
  PAYMENT_SUCCESS:  { icon: DollarSign,   color: "text-green-500",  bg: "bg-green-50" },
  PAYMENT_FAILED:   { icon: DollarSign,   color: "text-red-500",    bg: "bg-red-50" },
  REFERRAL_SUCCESS: { icon: Users,        color: "text-blue-500", bg: "bg-blue-50" },
  EVENT_REMINDER:   { icon: Bell,         color: "text-blue-500",   bg: "bg-blue-50" },
  SYSTEM:           { icon: Bell,         color: "text-gray-500",   bg: "bg-gray-100" },
};

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 0) return `${day}일 전`;
  if (hr > 0) return `${hr}시간 전`;
  if (min > 0) return `${min}분 전`;
  return "방금 전";
}

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // 읽음 처리 (서버에서 바로)
  const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
  if (unreadIds.length > 0) {
    await db.notification.updateMany({
      where: { id: { in: unreadIds } },
      data: { isRead: true },
    });
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
          <Bell className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold">알림</h1>
          {unreadIds.length > 0 && (
            <p className="text-sm text-muted-foreground">읽지 않은 알림 {unreadIds.length}개</p>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="border rounded-xl p-12 text-center text-muted-foreground bg-card">
          <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p>알림이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.SYSTEM;
            const Icon = config.icon;
            return (
              <div
                key={n.id}
                className={`border rounded-xl p-4 flex items-start gap-3 bg-card ${
                  !n.isRead ? "border-blue-200 bg-blue-50/30" : ""
                }`}
              >
                <div className={`h-9 w-9 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
