"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Bell,
  Shield,
  Search,
  Check,
  UserPlus,
  ArrowRightLeft,
  Copy,
  CheckCheck,
  Crown,
  Activity,
} from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "notifications">("overview");
  const [userSearch, setUserSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("apex-user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    const userData = JSON.parse(stored);
    if (!userData.isAdmin) {
      router.replace("/dashboard");
      return;
    }
    setUser(userData);

    Promise.all([
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/notifications").then((r) => r.json()),
    ]).then(([usersData, notifData]) => {
      setUsers(usersData.users || []);
      setNotifications(notifData.notifications || []);
      setUnreadCount(notifData.unreadCount || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router]);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllRead" }),
    });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.id.toLowerCase().includes(userSearch.toLowerCase())
  );

  const totalBalance = users.reduce((sum: number, u: any) => sum + u.balance, 0);
  const signupNotifications = notifications.filter((n) => n.type === "signup");

  if (!user) return null;

  const tabs = [
    { key: "overview" as const, label: "Overview", icon: Activity },
    { key: "users" as const, label: "Users", icon: Users, badge: users.length },
    { key: "notifications" as const, label: "Alerts", icon: Bell, badge: unreadCount },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage users, notifications, and system</p>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-gradient-to-r from-gradient-start to-gradient-end text-white"
                : "border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeTab === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-primary/20 text-primary"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: "Total Users", value: users.length, icon: Users, gradient: "from-violet-500 to-purple-600" },
                  { label: "Total Balance", value: formatCurrency(totalBalance), icon: Crown, gradient: "from-emerald-500 to-teal-500" },
                  { label: "New Signups", value: signupNotifications.length, icon: UserPlus, gradient: "from-blue-500 to-cyan-500" },
                  { label: "Unread Alerts", value: unreadCount, icon: Bell, gradient: "from-amber-500 to-orange-500" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass card-glow rounded-2xl p-4 sm:p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="mt-1 text-xl font-bold sm:text-2xl">{stat.value}</p>
                      </div>
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                        <stat.icon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Recent Users */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass card-glow rounded-2xl p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Recent Users</h2>
                  <button
                    onClick={() => setActiveTab("users")}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {users.slice(0, 5).map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 rounded-xl border border-border/50 px-4 py-3 transition-colors hover:bg-secondary/50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gradient-start to-gradient-end text-sm font-bold text-white">
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{u.name}</p>
                          {u.isAdmin && (
                            <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-500">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(u.balance)}</p>
                        <p className="text-[10px] text-muted-foreground">{timeAgo(u.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Recent Notifications */}
              {notifications.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass card-glow rounded-2xl p-6"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Recent Notifications</h2>
                    <button
                      onClick={() => setActiveTab("notifications")}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-2">
                    {notifications.slice(0, 3).map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 rounded-xl border border-border/50 px-4 py-3 ${
                          !n.read ? "border-l-2 border-l-primary bg-primary/5" : ""
                        }`}
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                          {n.type === "signup" ? (
                            <UserPlus className="h-4 w-4 text-violet-400" />
                          ) : (
                            <Bell className="h-4 w-4 text-blue-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{n.title}</p>
                            {!n.read && (
                              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                NEW
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground/60">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, email, or user ID..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="h-12 w-full rounded-xl border border-border bg-secondary/50 pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="glass card-glow rounded-2xl overflow-hidden">
                {/* Desktop table header */}
                <div className="hidden border-b border-border bg-secondary/30 px-6 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
                  <span className="col-span-3 text-xs font-medium text-muted-foreground">USER</span>
                  <span className="col-span-4 text-xs font-medium text-muted-foreground">USER ID</span>
                  <span className="col-span-2 text-xs font-medium text-muted-foreground">BALANCE</span>
                  <span className="col-span-3 text-xs font-medium text-muted-foreground">JOINED</span>
                </div>

                {filteredUsers.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">No users found</div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {filteredUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-secondary/30 sm:grid sm:grid-cols-12 sm:items-center sm:gap-4 sm:px-6"
                      >
                        {/* User info */}
                        <div className="flex items-center gap-3 sm:col-span-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gradient-start to-gradient-end text-sm font-bold text-white">
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-sm font-medium">{u.name}</p>
                              {u.isAdmin && (
                                <span className="shrink-0 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-500">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>

                        {/* User ID */}
                        <div className="flex items-center gap-2 sm:col-span-4">
                          <span className="font-mono text-xs text-muted-foreground truncate">
                            {u.id}
                          </span>
                          <button
                            onClick={() => copyId(u.id)}
                            className="shrink-0 text-muted-foreground hover:text-primary"
                          >
                            {copiedId === u.id ? (
                              <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Balance */}
                        <div className="sm:col-span-2">
                          <p className="text-sm font-semibold">{formatCurrency(u.balance)}</p>
                        </div>

                        {/* Joined */}
                        <div className="sm:col-span-3">
                          <p className="text-xs text-muted-foreground">{timeAgo(u.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-4">
              {notifications.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Mark all read
                  </button>
                </div>
              )}

              <div className="glass card-glow rounded-2xl overflow-hidden">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">No notifications yet</div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-4 px-4 py-4 transition-colors hover:bg-secondary/30 sm:px-6 ${
                          !n.read ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                          {n.type === "signup" ? (
                            <UserPlus className="h-5 w-5 text-violet-400" />
                          ) : n.type === "transfer" ? (
                            <ArrowRightLeft className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <Bell className="h-5 w-5 text-blue-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{n.title}</p>
                            {!n.read && (
                              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                NEW
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                          <p className="mt-1 text-xs text-muted-foreground/60">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
