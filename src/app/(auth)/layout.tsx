import { Zap } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <Link href="/" className="flex items-center gap-2 font-bold text-2xl mb-8">
        <Zap className="h-7 w-7 text-blue-500" fill="currentColor" />
        <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
          SparkNova School
        </span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
