"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Trash2, Package } from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  price: number;
  isPublished: boolean;
  sellCount: number;
  thumbnailUrl: string | null;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function DigitalProductsManager({ slug, initialProducts }: { slug: string; initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);

  async function togglePublish(id: string, current: boolean) {
    const res = await fetch(`/api/communities/${slug}/admin/digital-products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !current }),
    });
    if (!res.ok) { toast.error("변경에 실패했습니다."); return; }
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, isPublished: !current } : p));
    toast.success(!current ? "상품이 공개되었습니다." : "상품이 비공개로 변경되었습니다.");
  }

  async function handleDelete(id: string) {
    if (!confirm("상품을 삭제하시겠습니까? 구매 기록은 유지됩니다.")) return;
    const res = await fetch(`/api/communities/${slug}/admin/digital-products/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("삭제에 실패했습니다."); return; }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("상품이 삭제되었습니다.");
  }

  return (
    <div className="space-y-3">
      {products.map((p) => (
        <div key={p.id} className="border rounded-xl p-4 bg-card flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 overflow-hidden">
            {p.thumbnailUrl ? (
              <img src={p.thumbnailUrl} alt={p.title} className="w-full h-full object-cover" />
            ) : (
              <Package className="h-5 w-5 text-purple-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{p.title}</p>
            <p className="text-xs text-muted-foreground">{p.fileName} · {formatSize(p.fileSize)}</p>
            <p className="text-xs text-muted-foreground">{p.sellCount}회 판매</p>
          </div>

          <div className="text-right shrink-0 space-y-1">
            <p className="font-bold text-sm">
              {p.price === 0 ? "무료" : `${p.price.toLocaleString()}원`}
            </p>
            <span className={`text-xs font-medium ${p.isPublished ? "text-green-600" : "text-muted-foreground"}`}>
              {p.isPublished ? "공개" : "비공개"}
            </span>
          </div>

          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={() => togglePublish(p.id, p.isPublished)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              title={p.isPublished ? "비공개로 전환" : "공개로 전환"}
            >
              {p.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              onClick={() => handleDelete(p.id)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
