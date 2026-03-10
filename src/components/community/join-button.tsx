"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";

interface Props {
  slug: string;
  initialJoined: boolean;
  isOwner: boolean;
  isPaid?: boolean;
}

export function JoinButton({ slug, initialJoined, isOwner, isPaid = false }: Props) {
  const router = useRouter();
  const [joined, setJoined] = useState(initialJoined);
  const [loading, setLoading] = useState(false);

  if (isOwner) return null;

  async function handleClick() {
    // 유료 커뮤니티 + 미가입: 결제 페이지로 이동
    if (!joined && isPaid) {
      router.push(`/checkout/community/${slug}`);
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/communities/${slug}/join`, { method: "POST" });
    setLoading(false);

    if (res.status === 401) {
      toast.error("로그인이 필요합니다.");
      router.push("/login");
      return;
    }
    if (!res.ok) {
      toast.error("오류가 발생했습니다.");
      return;
    }
    const data = await res.json();
    setJoined(data.joined);
    toast.success(data.joined ? "커뮤니티에 가입했습니다!" : "커뮤니티에서 탈퇴했습니다.");
    router.refresh();
  }

  return (
    <Button
      size="sm"
      variant={joined ? "outline" : "default"}
      className={joined ? "" : "bg-blue-500 hover:bg-blue-600"}
      onClick={handleClick}
      disabled={loading}
    >
      {joined ? (
        <>
          <UserMinus className="h-4 w-4 mr-1" />
          탈퇴
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1" />
          {isPaid ? "구독하기" : "가입하기"}
        </>
      )}
    </Button>
  );
}
