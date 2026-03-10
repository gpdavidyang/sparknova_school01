import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthSessionProvider } from "@/components/shared/session-provider";
import { ThemeProvider } from "@/components/shared/theme-provider";

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
      <body className="antialiased">
        <ThemeProvider>
          <AuthSessionProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
