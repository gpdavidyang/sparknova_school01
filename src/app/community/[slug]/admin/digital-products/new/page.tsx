"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Upload, ArrowLeft, Loader2, FileText } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";

export default function NewDigitalProductPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [price, setPrice] = useState("0");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload/digital", { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "파일 업로드에 실패했습니다.");
      return;
    }
    const { url, fileName: fn, fileSize: fs } = await res.json();
    setFileUrl(url);
    setFileName(fn);
    setFileSize(fs);
    toast.success("파일이 업로드되었습니다.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fileUrl) { toast.error("파일을 업로드해주세요."); return; }
    setSaving(true);
    const res = await fetch(`/api/communities/${slug}/admin/digital-products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description, thumbnailUrl: thumbnailUrl || null,
        fileUrl, fileName, fileSize,
        price: parseInt(price) || 0,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "저장에 실패했습니다.");
      return;
    }
    toast.success("디지털 상품이 등록되었습니다.");
    router.push(`/community/${slug}/admin/digital-products`);
  }

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6 px-4">
      <div>
        <Link href={`/community/${slug}/admin/digital-products`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-4 w-4" />디지털 상품 목록
        </Link>
        <h1 className="text-2xl font-bold">디지털 상품 등록</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">기본 정보</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>상품명 *</Label>
              <Input placeholder="예: K-뷰티 메이크업 가이드 전자책" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>썸네일 이미지</Label>
              <ImageUpload value={thumbnailUrl} onChange={setThumbnailUrl} uploadType="thumbnail" aspectRatio="wide" placeholder="상품 커버 이미지 업로드" />
            </div>
            <div className="space-y-1.5">
              <Label>상품 소개</Label>
              <Textarea placeholder="상품에 대한 설명을 입력해주세요..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label>가격 (원) — 0이면 무료</Label>
              <Input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">파일 업로드 *</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {fileUrl ? (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileName}</p>
                  <p className="text-xs text-muted-foreground">{(fileSize / (1024 * 1024)).toFixed(2)}MB</p>
                </div>
                <button type="button" onClick={() => { setFileUrl(""); setFileName(""); setFileSize(0); }} className="text-xs text-muted-foreground hover:text-destructive">제거</button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {uploading ? "업로드 중..." : "PDF, ZIP, EPUB, DOCX 등 (최대 100MB)"}
                </span>
                <input type="file" className="hidden" onChange={handleFileChange} disabled={uploading} accept=".pdf,.zip,.epub,.docx,.xlsx,.txt,.jpg,.png,.webp" />
              </label>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600" disabled={saving || uploading}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          상품 등록
        </Button>
      </form>
    </div>
  );
}
