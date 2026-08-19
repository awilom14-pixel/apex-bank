"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Receipt,
  CreditCard,
  Settings,
  Shield,
} from "lucide-react";
import { fetchSession } from "@/lib/client-auth";
import ErrorBoundary from "@/components/error-boundary";

const mobileNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/transfer", label: "Transfer", icon: ArrowLeftRight },
  { href: "/transactions", label: "History", icon: Receipt },
  { href: "/cards", label: "Cards", icon: CreditCard },
  { href: "/settings", label: "More", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchSession().then((user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      // Sync localStorage with server-verified session
      localStorage.setItem(
        "apex-user",
        JSON.stringify({
          id: user.userId,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
          balance: user.balance,
        })
      );
      setIsAdmin(user.isAdmin);
      setReady(true);
    });
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-1 flex-col lg:ml-[260px]">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 pb-20 sm:p-6 sm:pb-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-lg lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
          {isAdmin && (
            <button
              onClick={() => router.push("/admin")}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors ${
                pathname === "/admin" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Shield className={`h-5 w-5 ${pathname === "/admin" ? "text-primary" : ""}`} />
              <span className="text-[10px] font-medium">Admin</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
