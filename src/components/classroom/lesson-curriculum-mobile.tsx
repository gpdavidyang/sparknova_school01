"use client";

import { useState } from "react";
import Link from "next/link";
import { List, Lock, ChevronDown, ChevronUp } from "lucide-react";

interface CurriculumLesson {
  id: string;
  title: string;
  isFree: boolean;
}

interface CurriculumModule {
  id: string;
  title: string;
  lessons: CurriculumLesson[];
}

interface Props {
  modules: CurriculumModule[];
  currentLessonId: string;
  canTrack: boolean;
  courseIsFree: boolean;
  slug: string;
  courseId: string;
  isLoggedIn: boolean;
}

export function LessonCurriculumMobile({
  modules,
  currentLessonId,
  canTrack,
  courseIsFree,
  slug,
  courseId,
  isLoggedIn,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-muted/30 text-sm font-medium"
      >
        <div className="flex items-center gap-2">
          <List className="h-4 w-4" />
          커리큘럼
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="max-h-72 overflow-y-auto">
          {modules.map((mod) => (
            <div key={mod.id}>
              <div className="px-4 py-2 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {mod.title}
              </div>
              {mod.lessons.map((l) => {
                const accessible = canTrack || l.isFree || courseIsFree;
                const isCurrent = l.id === currentLessonId;
                return accessible ? (
                  <Link
                    key={l.id}
                    href={`/community/${slug}/classroom/${courseId}/lessons/${l.id}`}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs transition-colors hover:bg-muted/50 ${isCurrent ? "bg-blue-50 text-blue-600 font-medium" : "text-muted-foreground"}`}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${isCurrent ? "bg-blue-500" : "bg-muted-foreground/30"}`} />
                    <span className="flex-1 line-clamp-1">{l.title}</span>
                    {l.isFree && !canTrack && (
                      <span className="text-[10px] text-violet-500 font-medium shrink-0">무료</span>
                    )}
                  </Link>
                ) : (
                  <div
                    key={l.id}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground/50 cursor-not-allowed"
                  >
                    <Lock className="h-3 w-3 shrink-0" />
                    <span className="flex-1 line-clamp-1">{l.title}</span>
                  </div>
                );
              })}
            </div>
          ))}
          {!isLoggedIn && (
            <div className="border-t px-4 py-3 bg-muted/10 space-y-2">
              <p className="text-xs text-muted-foreground">전체 강의는 가입 후 수강하세요</p>
              <Link
                href={`/signup?next=/community/${slug}/classroom/${courseId}`}
                className="block w-full text-center text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg py-1.5 transition-colors"
              >
                무료 가입하기
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
