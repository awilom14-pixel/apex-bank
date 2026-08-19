"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 animate-pulse" />
        <p className="text-muted-foreground text-sm">Loading Apex Bank...</p>
      </div>
    </div>
  );
}
