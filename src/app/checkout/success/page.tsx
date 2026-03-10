"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const called = useRef(false);

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const type = searchParams.get("type");        // "course" | "community"
  const courseId = searchParams.get("courseId");
  const slug = searchParams.get("slug");

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setErrorMsg("결제 정보가 올바르지 않습니다.");
      return;
    }

    fetch("/api/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: parseInt(amount),
        type,
        courseId,
        communitySlug: slug,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMsg(data.error ?? "결제 처리 실패");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("네트워크 오류가 발생했습니다.");
      });
  }, [paymentKey, orderId, amount, type, courseId, slug]);

  function handleGoNext() {
    if (type === "course" && courseId && slug) {
      router.push(`/community/${slug}/classroom/${courseId}`);
    } else if (type === "community" && slug) {
      router.push(`/community/${slug}`);
    } else {
      router.push("/");
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-sm text-muted-foreground">결제를 처리하고 있습니다...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
          <span className="text-3xl">⚠️</span>
        </div>
        <div>
          <h1 className="text-xl font-bold">결제 처리 실패</h1>
          <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-4">
      <div className="h-20 w-20 rounded-full bg-green-50 border-4 border-green-200 flex items-center justify-center">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">결제 완료!</h1>
        <p className="text-muted-foreground">
          {type === "course"
            ? "강좌 수강 등록이 완료되었습니다."
            : "커뮤니티 멤버십이 활성화되었습니다."}
        </p>
      </div>

      <Button
        className="bg-blue-500 hover:bg-blue-600 px-8"
        onClick={handleGoNext}
      >
        {type === "course" ? "강좌 시작하기" : "커뮤니티 입장하기"}
      </Button>
    </div>
  );
}
