"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Calendar, MapPin, Globe, Users, Plus, Pencil, Trash2,
  ChevronDown, ChevronUp, Clock, Video, X, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface EventData {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  location: string | null;
  isOnline: boolean;
  meetingUrl: string | null;
  maxAttendees: number | null;
  attending: boolean;
  attendeeCount: number;
}

interface Props {
  slug: string;
  isOwner: boolean;
  isLoggedIn: boolean;
  upcoming: EventData[];
  past: EventData[];
}

interface FormState {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  location: string;
  isOnline: boolean;
  meetingUrl: string;
  maxAttendees: string;
}

const emptyForm = (): FormState => ({
  title: "",
  description: "",
  startAt: "",
  endAt: "",
  location: "",
  isOnline: true,
  meetingUrl: "",
  maxAttendees: "",
});

function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function CalendarEventList({ slug, isOwner, isLoggedIn, upcoming: initialUpcoming, past: initialPast }: Props) {
  const [upcoming, setUpcoming] = useState<EventData[]>(initialUpcoming);
  const [past, setPast] = useState<EventData[]>(initialPast);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function allEvents() {
    return [...upcoming, ...past];
  }

  function updateEvent(updated: EventData) {
    const now = new Date();
    setUpcoming((prev) => {
      const filtered = prev.filter((e) => e.id !== updated.id);
      return new Date(updated.startAt) >= now ? [...filtered, updated].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()) : filtered;
    });
    setPast((prev) => {
      const filtered = prev.filter((e) => e.id !== updated.id);
      return new Date(updated.startAt) < now ? [...filtered, updated].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()) : filtered;
    });
  }

  function removeEvent(id: string) {
    setUpcoming((prev) => prev.filter((e) => e.id !== id));
    setPast((prev) => prev.filter((e) => e.id !== id));
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  }

  function openEdit(event: EventData) {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description ?? "",
      startAt: toLocalDatetime(event.startAt),
      endAt: event.endAt ? toLocalDatetime(event.endAt) : "",
      location: event.location ?? "",
      isOnline: event.isOnline,
      meetingUrl: event.meetingUrl ?? "",
      maxAttendees: event.maxAttendees?.toString() ?? "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("이벤트 제목을 입력해주세요."); return; }
    if (!form.startAt) { toast.error("시작 시간을 입력해주세요."); return; }
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        startAt: new Date(form.startAt).toISOString(),
        endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
        location: form.location.trim() || null,
        isOnline: form.isOnline,
        meetingUrl: form.meetingUrl.trim() || null,
        maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees) : null,
      };

      if (editingId) {
        const res = await fetch(`/api/communities/${slug}/events/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); toast.error(d.error ?? "수정에 실패했습니다."); return; }
        const updated = await res.json();
        const existing = allEvents().find((e) => e.id === editingId);
        updateEvent({ ...updated, startAt: updated.startAt, endAt: updated.endAt ?? null, attending: existing?.attending ?? false, attendeeCount: updated._count?.attendees ?? existing?.attendeeCount ?? 0 });
        toast.success("이벤트가 수정되었습니다.");
      } else {
        const res = await fetch(`/api/communities/${slug}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); toast.error(d.error ?? "생성에 실패했습니다."); return; }
        const created = await res.json();
        const newEvent: EventData = { ...created, endAt: created.endAt ?? null, attending: false, attendeeCount: created._count?.attendees ?? 0 };
        updateEvent(newEvent);
        toast.success("이벤트가 생성되었습니다.");
      }
      closeForm();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("이벤트를 삭제하시겠습니까?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/communities/${slug}/events/${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("삭제에 실패했습니다."); return; }
      removeEvent(id);
      toast.success("이벤트가 삭제되었습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleAttend(event: EventData) {
    if (!isLoggedIn) { toast.error("로그인이 필요합니다."); return; }
    setTogglingId(event.id);
    try {
      const res = await fetch(`/api/communities/${slug}/events/${event.id}`, { method: "POST" });
      if (!res.ok) { toast.error("처리에 실패했습니다."); return; }
      const { attending } = await res.json();
      updateEvent({
        ...event,
        attending,
        attendeeCount: event.attendeeCount + (attending ? 1 : -1),
      });
    } finally {
      setTogglingId(null);
    }
  }

  function f(key: keyof FormState, val: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">이벤트</h2>
        {isOwner && (
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />이벤트 추가
          </Button>
        )}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="border rounded-xl p-5 space-y-4 bg-muted/20">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{editingId ? "이벤트 수정" : "새 이벤트 추가"}</h3>
            <button type="button" onClick={closeForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">이벤트 제목 *</Label>
              <Input placeholder="예: 스터디 모임" value={form.title} onChange={(e) => f("title", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">설명</Label>
              <Textarea placeholder="이벤트 내용을 입력하세요..." value={form.description} onChange={(e) => f("description", e.target.value)} rows={2} className="resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">시작 시간 *</Label>
                <Input type="datetime-local" value={form.startAt} onChange={(e) => f("startAt", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">종료 시간</Label>
                <Input type="datetime-local" value={form.endAt} onChange={(e) => f("endAt", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">진행 방식</Label>
              <div className="flex gap-2">
                {[{ v: true, l: "온라인" }, { v: false, l: "오프라인" }].map(({ v, l }) => (
                  <button key={l} type="button" onClick={() => f("isOnline", v)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${form.isOnline === v ? "border-blue-500 bg-blue-50 text-blue-600" : "border-border hover:border-blue-200"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {form.isOnline ? (
              <div className="space-y-1.5">
                <Label className="text-xs">미팅 URL</Label>
                <Input placeholder="https://zoom.us/..." value={form.meetingUrl} onChange={(e) => f("meetingUrl", e.target.value)} />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs">장소</Label>
                <Input placeholder="장소 주소 입력" value={form.location} onChange={(e) => f("location", e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">최대 참석 인원 (선택)</Label>
              <Input type="number" placeholder="제한 없음" min="1" value={form.maxAttendees} onChange={(e) => f("maxAttendees", e.target.value)} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" className="bg-blue-500 hover:bg-blue-600" disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />저장 중...</> : (editingId ? "수정 완료" : "이벤트 생성")}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm}>취소</Button>
            </div>
          </form>
        </div>
      )}

      {/* Upcoming Events */}
      {upcoming.length === 0 && past.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-2">
          <Calendar className="h-10 w-10 opacity-30" />
          <p className="text-sm">아직 이벤트가 없습니다.</p>
          {isOwner && <p className="text-xs">위 버튼을 눌러 이벤트를 추가해보세요.</p>}
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">예정된 이벤트 ({upcoming.length})</h3>
              {upcoming.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isOwner={isOwner}
                  isLoggedIn={isLoggedIn}
                  toggling={togglingId === event.id}
                  deleting={deletingId === event.id}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggleAttend={handleToggleAttend}
                />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-3">
              <button
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPast((v) => !v)}
              >
                {showPast ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                지난 이벤트 ({past.length})
              </button>
              {showPast && past.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isOwner={isOwner}
                  isLoggedIn={isLoggedIn}
                  toggling={togglingId === event.id}
                  deleting={deletingId === event.id}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggleAttend={handleToggleAttend}
                  isPast
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface EventCardProps {
  event: EventData;
  isOwner: boolean;
  isLoggedIn: boolean;
  toggling: boolean;
  deleting: boolean;
  onEdit: (e: EventData) => void;
  onDelete: (id: string) => void;
  onToggleAttend: (e: EventData) => void;
  isPast?: boolean;
}

function EventCard({ event, isOwner, isLoggedIn, toggling, deleting, onEdit, onDelete, onToggleAttend, isPast }: EventCardProps) {
  const isFull = event.maxAttendees !== null && event.attendeeCount >= event.maxAttendees;

  return (
    <div className={`border rounded-xl p-4 space-y-3 transition-colors ${isPast ? "opacity-60" : "bg-card"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm">{event.title}</h4>
            {event.isOnline ? (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 text-blue-600 bg-blue-50">온라인</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">오프라인</Badge>
            )}
            {isPast && <Badge variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground">종료</Badge>}
          </div>
          {event.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
          )}
        </div>
        {isOwner && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEdit(event)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onDelete(event.id)} disabled={deleting} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors">
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {formatDate(event.startAt)}
          {event.endAt && <> ~ {formatDate(event.endAt)}</>}
        </span>
        {event.isOnline && event.meetingUrl && (
          <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
            <Video className="h-3.5 w-3.5 shrink-0" />미팅 참여
          </a>
        )}
        {!event.isOnline && event.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />{event.location}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 shrink-0" />
          {event.attendeeCount}명 참석 중
          {event.maxAttendees && <> / 최대 {event.maxAttendees}명</>}
        </span>
        {!event.isOnline && !event.location && event.meetingUrl && (
          <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
            <Globe className="h-3.5 w-3.5 shrink-0" />{event.meetingUrl}
          </a>
        )}
      </div>

      {!isPast && isLoggedIn && (
        <Button
          size="sm"
          variant={event.attending ? "outline" : "default"}
          className={event.attending ? "" : "bg-blue-500 hover:bg-blue-600"}
          disabled={toggling || (!event.attending && !!isFull)}
          onClick={() => onToggleAttend(event)}
        >
          {toggling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : event.attending ? (
            "참석 취소"
          ) : isFull ? (
            "마감됨"
          ) : (
            "참석하기"
          )}
        </Button>
      )}
    </div>
  );
}
