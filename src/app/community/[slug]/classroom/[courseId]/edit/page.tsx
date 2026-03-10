"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import Link from "next/link";

interface Lesson {
  title: string;
  type: "TEXT" | "VIDEO";
  content: string;
  videoUrl: string;
  isFree: boolean;
  duration: string; // 분 단위 입력
}
interface Module {
  title: string;
  drip: string; // 공개 지연일 (빈 문자열 = 즉시 공개)
  lessons: Lesson[];
  open: boolean;
}

export default function EditCoursePage() {
  const router = useRouter();
  const { slug, courseId } = useParams<{ slug: string; courseId: string }>();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [modules, setModules] = useState<Module[]>([]);

  useEffect(() => {
    fetch(`/api/communities/${slug}/admin/courses/${courseId}`)
      .then((r) => r.json())
      .then((data) => {
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setThumbnailUrl(data.thumbnailUrl ?? "");
        setIsFree(data.isFree ?? true);
        setPrice(data.price?.toString() ?? "");
        setModules(
          (data.modules ?? []).map((m: { title: string; drip?: number | null; lessons: { title: string; type: string; content: string | null; videoUrl: string | null; isFree: boolean; duration?: number | null }[] }) => ({
            title: m.title,
            drip: m.drip != null ? String(m.drip) : "",
            open: true,
            lessons: (m.lessons ?? []).map((l) => ({
              title: l.title,
              type: l.type as "TEXT" | "VIDEO",
              content: l.content ?? "",
              videoUrl: l.videoUrl ?? "",
              isFree: l.isFree ?? false,
              duration: l.duration ? String(Math.floor(l.duration / 60)) : "",
            })),
          }))
        );
      })
      .catch(() => toast.error("강좌 정보를 불러오지 못했습니다."))
      .finally(() => setFetching(false));
  }, [slug, courseId]);

  function addModule() {
    setModules([...modules, { title: `모듈 ${modules.length + 1}`, drip: "", lessons: [], open: true }]);
  }
  function removeModule(mi: number) {
    setModules(modules.filter((_, i) => i !== mi));
  }
  function addLesson(mi: number) {
    const updated = [...modules];
    updated[mi].lessons.push({ title: "", type: "TEXT", content: "", videoUrl: "", isFree: false, duration: "" });
    setModules(updated);
  }
  function removeLesson(mi: number, li: number) {
    const updated = [...modules];
    updated[mi].lessons = updated[mi].lessons.filter((_, i) => i !== li);
    setModules(updated);
  }
  function updateModule(mi: number, key: keyof Module, value: unknown) {
    const updated = [...modules];
    (updated[mi] as unknown as Record<string, unknown>)[key] = value;
    setModules(updated);
  }
  function updateLesson(mi: number, li: number, key: keyof Lesson, value: string | boolean) {
    const updated = [...modules];
    updated[mi].lessons[li] = { ...updated[mi].lessons[li], [key]: value };
    setModules(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("강좌 제목을 입력해주세요."); return; }
    setLoading(true);
    const res = await fetch(`/api/communities/${slug}/admin/courses/${courseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description, thumbnailUrl: thumbnailUrl || null, isFree,
        price: isFree ? null : parseInt(price) || 0,
        modules: modules.map((m) => ({
          title: m.title,
          drip: m.drip ? parseInt(m.drip) : null,
          lessons: m.lessons.filter((l) => l.title.trim()).map((l) => ({
            title: l.title,
            type: l.type,
            content: l.content,
            videoUrl: l.videoUrl,
            isFree: l.isFree,
            duration: l.duration ? parseInt(l.duration) * 60 : null,
          })),
        })),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json();
      toast.error(error ?? "저장에 실패했습니다.");
      return;
    }
    toast.success("강좌가 수정되었습니다.");
    router.push(`/community/${slug}/classroom/${courseId}`);
  }

  async function handleDelete() {
    if (!confirm("강좌를 삭제하면 모든 모듈과 레슨이 삭제됩니다. 계속하시겠습니까?")) return;
    const res = await fetch(`/api/communities/${slug}/admin/courses/${courseId}`, { method: "DELETE" });
    if (!res.ok) { toast.error("삭제에 실패했습니다."); return; }
    toast.success("강좌가 삭제되었습니다.");
    router.push(`/community/${slug}/classroom`);
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/community/${slug}/classroom/${courseId}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-4 w-4" />강좌로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold">강좌 수정</h1>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-1" />강좌 삭제
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">기본 정보</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>강좌 제목 *</Label>
              <Input placeholder="예: 마케팅 기초부터 실전까지" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>썸네일 이미지</Label>
              <ImageUpload
                value={thumbnailUrl}
                onChange={setThumbnailUrl}
                uploadType="thumbnail"
                aspectRatio="wide"
                placeholder="강좌 썸네일 이미지 업로드 (권장: 16:9)"
              />
            </div>
            <div className="space-y-2">
              <Label>강좌 소개</Label>
              <Textarea placeholder="이 강좌에서 배울 내용을 간략히 소개해주세요..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="resize-none" />
            </div>
            <div className="space-y-2">
              <Label>가격 설정</Label>
              <div className="grid grid-cols-2 gap-3">
                {[{ v: true, l: "무료", d: "누구나 무료 수강" }, { v: false, l: "유료", d: "결제 후 수강" }].map(({ v, l, d }) => (
                  <button key={l} type="button" onClick={() => setIsFree(v)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${isFree === v ? "border-blue-500 bg-blue-50" : "border-border hover:border-blue-200"}`}>
                    <div className="font-medium text-sm">{l}</div>
                    <div className="text-xs text-muted-foreground">{d}</div>
                  </button>
                ))}
              </div>
              {!isFree && (
                <Input type="number" placeholder="가격 (원)" value={price} onChange={(e) => setPrice(e.target.value)} min="0" className="mt-2" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">커리큘럼</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addModule}>
                <Plus className="h-4 w-4 mr-1" />모듈 추가
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {modules.map((mod, mi) => (
              <div key={mi} className="border rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 p-3 bg-muted/30">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    value={mod.title}
                    onChange={(e) => updateModule(mi, "title", e.target.value)}
                    className="h-8 text-sm font-medium border-0 bg-transparent p-0 focus-visible:ring-0 flex-1"
                    placeholder="모듈 제목"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <Input
                      type="number"
                      value={mod.drip}
                      onChange={(e) => updateModule(mi, "drip", e.target.value)}
                      className="h-7 w-20 text-xs text-center"
                      placeholder="0일"
                      min="0"
                      title="수강 신청 후 N일 뒤 공개 (0 또는 빈칸 = 즉시)"
                    />
                    <span className="text-xs text-muted-foreground">일 후 공개</span>
                  </div>
                  <button type="button" onClick={() => updateModule(mi, "open", !mod.open)} className="text-muted-foreground hover:text-foreground">
                    {mod.open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={() => removeModule(mi)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {mod.open && (
                  <div className="p-3 space-y-2">
                    {mod.lessons.map((lesson, li) => (
                      <div key={li} className="flex gap-2 items-start border rounded-lg p-3 bg-background">
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="레슨 제목"
                            value={lesson.title}
                            onChange={(e) => updateLesson(mi, li, "title", e.target.value)}
                            className="h-8 text-sm"
                          />
                          <div className="flex gap-2">
                            {(["TEXT", "VIDEO"] as const).map((t) => (
                              <button key={t} type="button" onClick={() => updateLesson(mi, li, "type", t)}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${lesson.type === t ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                                {t === "TEXT" ? "텍스트" : "영상"}
                              </button>
                            ))}
                          </div>
                          {lesson.type === "VIDEO" ? (
                            <div className="space-y-1.5">
                              <Input placeholder="YouTube / Vimeo URL" value={lesson.videoUrl} onChange={(e) => updateLesson(mi, li, "videoUrl", e.target.value)} className="h-8 text-sm" />
                              <Input
                                type="number"
                                placeholder="재생시간 (분)"
                                value={lesson.duration}
                                onChange={(e) => updateLesson(mi, li, "duration", e.target.value)}
                                className="h-8 text-sm w-36"
                                min="0"
                              />
                            </div>
                          ) : (
                            <Textarea placeholder="레슨 내용..." value={lesson.content} onChange={(e) => updateLesson(mi, li, "content", e.target.value)} rows={2} className="text-sm resize-none" />
                          )}
                          <button
                            type="button"
                            onClick={() => updateLesson(mi, li, "isFree", !lesson.isFree)}
                            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border transition-colors ${lesson.isFree ? "bg-green-50 border-green-300 text-green-700" : "bg-muted border-border text-muted-foreground hover:border-green-300"}`}
                          >
                            <span className={`h-2 w-2 rounded-full ${lesson.isFree ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                            {lesson.isFree ? "무료 공개" : "미리보기 없음"}
                          </button>
                        </div>
                        <button type="button" onClick={() => removeLesson(mi, li)} className="text-muted-foreground hover:text-destructive mt-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => addLesson(mi)}>
                      <Plus className="h-4 w-4 mr-1" />레슨 추가
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {modules.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">모듈을 추가해주세요.</p>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600" disabled={loading}>
          {loading ? "저장 중..." : "변경사항 저장"}
        </Button>
      </form>
    </div>
  );
}
