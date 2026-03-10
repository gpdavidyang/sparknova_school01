"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Package, Download, ShoppingCart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  fileName: string;
  fileSize: number;
  price: number;
  sellCount: number;
}

interface Props {
  product: Product;
  slug: string;
  isPurchased: boolean;
  isLoggedIn: boolean;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function DigitalProductCard({ product: p, isPurchased, isLoggedIn }: Props) {
  const router = useRouter();
  const [purchased, setPurchased] = useState(isPurchased);
  const [loading, setLoading] = useState(false);

  async function handleFreeGet() {
    if (!isLoggedIn) { router.push("/login"); return; }
    setLoading(true);
    const res = await fetch(`/api/digital-products/${p.id}/purchase`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "오류가 발생했습니다.");
      return;
    }
    setPurchased(true);
    toast.success("상품이 추가되었습니다.");
  }

  function handleDownload() {
    window.open(`/api/digital-products/${p.id}/download`, "_blank");
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-card hover:shadow-md transition-shadow">
      <div className="aspect-video bg-purple-50 flex items-center justify-center overflow-hidden">
        {p.thumbnailUrl ? (
          <img src={p.thumbnailUrl} alt={p.title} className="w-full h-full object-cover" />
        ) : (
          <Package className="h-10 w-10 text-purple-300" />
        )}
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm leading-snug">{p.title}</h3>
          {p.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{p.fileName} · {formatSize(p.fileSize)}</span>
          <span>{p.sellCount}명 구매</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="font-bold text-base">
            {p.price === 0 ? "무료" : `₩${p.price.toLocaleString()}`}
          </p>
          {purchased ? (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />다운로드
            </button>
          ) : p.price === 0 ? (
            <button
              onClick={handleFreeGet}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              무료 받기
            </button>
          ) : (
            <button
              onClick={() => toast.info("결제 기능은 준비 중입니다.")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors"
            >
              <ShoppingCart className="h-3.5 w-3.5" />구매하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
