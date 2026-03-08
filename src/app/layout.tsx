import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthSessionProvider } from "@/components/shared/session-provider";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SparkNova School",
    template: "%s | SparkNova School",
  },
  description: "당신의 지식이 세계를 바꿉니다. 커뮤니티 기반 글로벌 지식 비즈니스 플랫폼",
  keywords: ["온라인강의", "커뮤니티", "크리에이터", "지식비즈니스", "SparkNova"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geist.variable} antialiased`}>
        <AuthSessionProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
