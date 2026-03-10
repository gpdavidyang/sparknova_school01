import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Settings } from "lucide-react";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      emailNotifComments: true,
      emailNotifPayments: true,
      accounts: { where: { provider: "credentials" }, select: { id: true } },
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
          <Settings className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold">설정</h1>
          <p className="text-sm text-muted-foreground">알림 및 계정 설정</p>
        </div>
      </div>

      <SettingsForm
        emailNotifComments={user.emailNotifComments}
        emailNotifPayments={user.emailNotifPayments}
        hasCredentials={user.accounts.length > 0}
      />
    </div>
  );
}
