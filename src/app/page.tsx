"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState<"loading" | "done">("loading");

  useEffect(() => {
    try {
      const user = localStorage.getItem("apex-user");
      if (user) {
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/login";
      }
    } catch {
      window.location.href = "/login";
    }
    // Fallback in case redirect fails
    setTimeout(() => setStatus("done"), 3000);
  }, []);

  if (status === "done") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <p className="text-muted-foreground text-sm mb-4">Apex Bank</p>
          <a href="/login" className="text-primary hover:underline text-sm font-medium">
            Go to Login
          </a>
          <br />
          <a href="/register" className="text-primary hover:underline text-sm font-medium mt-2 inline-block">
            Create Account
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 animate-pulse" />
        <p className="text-muted-foreground text-sm">Loading Apex Bank...</p>
      </div>
    </div>
  );
}
