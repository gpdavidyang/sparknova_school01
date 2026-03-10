"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
  sort: string;
  type: string;
}

export function ExploreFilters({ sort, type }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (key === "sort") { params.set("sort", value); params.set("type", type); }
    else { params.set("sort", sort); params.set("type", value); }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* 정렬 */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        {[
          { value: "popular", label: "인기순" },
          { value: "newest", label: "최신순" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => update("sort", value)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              sort === value
                ? "bg-background shadow-sm font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 유료/무료 필터 */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        {[
          { value: "all", label: "전체" },
          { value: "free", label: "무료" },
          { value: "paid", label: "유료" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => update("type", value)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              type === value
                ? "bg-background shadow-sm font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
