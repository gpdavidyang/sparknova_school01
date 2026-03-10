"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bell, Lock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  emailNotifComments: boolean;
  emailNotifPayments: boolean;
  hasCredentials: boolean;
}

export function SettingsForm({ emailNotifComments, emailNotifPayments, hasCredentials }: Props) {
  const [notifComments, setNotifComments] = useState(emailNotifComments);
  const [notifPayments, setNotifPayments] = useState(emailNotifPayments);
  const [savingNotif, setSavingNotif] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  async function handleSaveNotif() {
    setSavingNotif(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailNotifComments: notifComments, emailNotifPayments: notifPayments }),
    });
    setSavingNotif(false);
    if (!res.ok) {
      toast.error("저장에 실패했습니다.");
      return;
    }
    toast.success("알림 설정이 저장되었습니다.");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      toast.error("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setSavingPw(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    setSavingPw(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "비밀번호 변경에 실패했습니다.");
      return;
    }
    toast.success("비밀번호가 변경되었습니다.");
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
  }

  const Toggle = ({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description: string }) => (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? "bg-blue-500" : "bg-muted-foreground/30"}`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4.5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 이메일 알림 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />이메일 알림
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <Toggle
            checked={notifComments}
            onChange={setNotifComments}
            label="댓글 알림"
            description="내 게시글에 댓글이 달리면 이메일을 받습니다."
          />
          <Toggle
            checked={notifPayments}
            onChange={setNotifPayments}
            label="결제 영수증"
            description="결제 완료 시 이메일 영수증을 받습니다."
          />
          <div className="pt-4">
            <Button onClick={handleSaveNotif} disabled={savingNotif} size="sm" className="bg-blue-500 hover:bg-blue-600">
              {savingNotif ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              저장
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 비밀번호 변경 */}
      {hasCredentials ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4" />비밀번호 변경
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1.5">
                <Label>현재 비밀번호</Label>
                <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>새 비밀번호</Label>
                <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} minLength={6} required />
              </div>
              <div className="space-y-1.5">
                <Label>새 비밀번호 확인</Label>
                <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
              </div>
              <Button type="submit" disabled={savingPw} size="sm" className="bg-blue-500 hover:bg-blue-600">
                {savingPw ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                비밀번호 변경
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              소셜 로그인 계정은 비밀번호를 별도로 관리합니다.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
