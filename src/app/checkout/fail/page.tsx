"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutFailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const code = searchParams.get("code");
  const message = searchParams.get("message") ?? "결제가 취소되었거나 실패했습니다.";

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-4">
      <div className="h-20 w-20 rounded-full bg-red-50 border-4 border-red-200 flex items-center justify-center">
        <XCircle className="h-10 w-10 text-red-400" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">결제 실패</h1>
        <p className="text-muted-foreground">{message}</p>
        {code && (
          <p className="text-xs text-muted-foreground">오류 코드: {code}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          다시 시도
        </Button>
        <Button
          className="bg-blue-500 hover:bg-blue-600"
          onClick={() => router.push("/")}
        >
          홈으로
        </Button>
      </div>
    </div>
  );
}
