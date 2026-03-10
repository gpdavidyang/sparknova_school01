"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <AlertTriangle className="h-10 w-10 text-destructive opacity-50" />
      <h2 className="font-semibold text-lg">문제가 발생했습니다</h2>
      <p className="text-sm text-muted-foreground">페이지를 불러오는 중 오류가 발생했습니다.</p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        다시 시도
      </button>
    </div>
  );
}
