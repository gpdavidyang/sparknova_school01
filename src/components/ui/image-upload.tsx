"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";

type UploadType = "avatar" | "cover" | "thumbnail";

interface Props {
  value?: string | null;
  onChange: (url: string) => void;
  uploadType?: UploadType;
  className?: string;
  aspectRatio?: "square" | "wide" | "cover";
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  uploadType = "avatar",
  className = "",
  aspectRatio = "square",
  placeholder = "클릭 또는 드래그하여 이미지 업로드",
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClass = {
    square: "aspect-square",
    wide: "aspect-video",
    cover: "aspect-[3/1]",
  }[aspectRatio];

  const upload = async (file: File) => {
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", uploadType);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "업로드 실패"); return; }
      onChange(data.url);
    } catch {
      setError("업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  return (
    <div className={className}>
      <div
        className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors
          ${aspectClass}
          ${uploading ? "border-orange-300 bg-orange-50/30" : "border-border hover:border-orange-400 hover:bg-muted/30"}
        `}
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover" />
            {/* 제거 버튼 */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="absolute top-2 right-2 h-6 w-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="h-3.5 w-3.5 text-white" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            ) : (
              <>
                <Upload className="h-8 w-8 opacity-40" />
                <p className="text-xs text-center px-4">{placeholder}</p>
              </>
            )}
          </div>
        )}

        {/* 업로드 중 오버레이 */}
        {uploading && value && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
