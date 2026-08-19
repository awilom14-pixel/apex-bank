"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Receipt,
  CreditCard,
  Settings,
  LogOut,
  Shield,
  X,
} from "lucide-react";
import { logout } from "@/lib/client-auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transfer", label: "Transfer", icon: ArrowLeftRight },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/cards", label: "Cards", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("apex-user") || "{}")
      : {};

  const allNavItems = user.isAdmin
    ? [...navItems, { href: "/admin", label: "Admin", icon: Shield }]
    : navItems;

  const handleNav = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleLogout = () => {
    logout();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-border bg-sidebar-bg">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gradient-start to-gradient-end">
            <span className="text-lg font-bold text-white">A</span>
          </div>
          <span className="text-lg font-bold">Apex Bank</span>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3">
        {allNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => handleNav(item.href)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-gradient-start/10 to-gradient-end/10 text-primary"
                  : "text-muted-foreground hover:bg-sidebar-hover hover:text-foreground"
              }`}
            >
              <item.icon
                className={`h-5 w-5 shrink-0 ${isActive ? "text-primary" : ""}`}
              />
              <span className="overflow-hidden whitespace-nowrap">
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 h-6 w-1 rounded-r-full bg-gradient-to-b from-gradient-start to-gradient-end"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-border p-3">
        {user.name && (
          <div className="mb-3 flex items-center gap-3 rounded-xl px-3 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gradient-start to-gradient-end text-sm font-bold text-white">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar - always visible on lg+ */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed left-0 top-0 z-50 h-screen w-[280px] lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
