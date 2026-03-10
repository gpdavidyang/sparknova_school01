"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RichEditor } from "@/components/ui/rich-editor";

interface Props {
  postId: string;
  initialContent: string;
  redirectTo: string;
  isAuthor: boolean;
}

export function PostDetailBody({ postId, initialContent, redirectTo, isAuthor }: Props) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  async function handleSave() {
    if (!editText.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editText }),
    });
    setSaving(false);
    if (!res.ok) { toast.error("수정에 실패했습니다."); return; }
    const data = await res.json();
    setContent(data.content);
    setEditing(false);
    toast.success("게시글이 수정되었습니다.");
  }

  async function handleDelete() {
    if (!confirm("게시글을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (!res.ok) { toast.error("삭제에 실패했습니다."); return; }
    toast.success("게시글이 삭제되었습니다.");
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <>
      {/* 작성자 메뉴 */}
      {isAuthor && (
        <div className="relative ml-auto" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-10 bg-popover border rounded-lg shadow-md py-1 min-w-[100px]">
              <button
                onClick={() => { setEditing(true); setEditText(content); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-muted transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />수정
              </button>
              <button
                onClick={() => { setMenuOpen(false); handleDelete(); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-destructive hover:bg-muted transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />삭제
              </button>
            </div>
          )}
        </div>
      )}

      {/* 본문 */}
      {editing ? (
        <div className="space-y-2">
          <RichEditor
            value={editText}
            onChange={setEditText}
            placeholder="내용을 입력하세요..."
            minHeight="150px"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !editText.trim()}
              className="px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 transition-colors"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-muted transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div
          className="text-sm leading-relaxed rich-content"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </>
  );
}
