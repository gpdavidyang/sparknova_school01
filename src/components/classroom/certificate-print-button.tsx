"use client";

import { Download } from "lucide-react";

export function CertificatePrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors"
    >
      <Download className="h-4 w-4" />
      PDF 저장 / 인쇄
    </button>
  );
}
