"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Receipt,
  UserPlus,
  Bell,
  Check,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { useRouter } from "next/navigation";

const quickActions = [
  { label: "Send Money", icon: Send, href: "/transfer", gradient: "from-violet-500 to-purple-600" },
  { label: "Transactions", icon: Receipt, href: "/transactions", gradient: "from-blue-500 to-cyan-500" },
];

function computeMonthlyData(transactions: any[], userId: string) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const data: { month: string; income: number; expenses: number }[] = [];

  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthIdx = d.getMonth();
    const year = d.getFullYear();

    const monthTx = transactions.filter((t) => {
      const tDate = new Date(t.createdAt);
      return tDate.getMonth() === monthIdx && tDate.getFullYear() === year;
    });

    data.push({
      month: months[monthIdx],
      income: monthTx
        .filter((t) => t.receiverId === userId)
        .reduce((sum, t) => sum + t.amount, 0),
      expenses: monthTx
        .filter((t) => t.senderId === userId)
        .reduce((sum, t) => sum + t.amount, 0),
    });
  }
  return data;
}

function computeSpendingBreakdown(transactions: any[], userId: string) {
  const colors = ["#a78bfa", "#60a5fa", "#f472b6", "#34d399", "#fbbf24", "#f87171"];
  const outflows = transactions.filter((t) => t.senderId === userId);

  if (outflows.length === 0) {
    return [
      { name: "Transfers Sent", amount: 0, color: colors[0] },
    ];
  }

  // Group by note (as a proxy for category), or show "Transfer" if no note
  const categories: Record<string, number> = {};
  outflows.forEach((t) => {
    const cat = t.note || "Transfers";
    categories[cat] = (categories[cat] || 0) + t.amount;
  });

  return Object.entries(categories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, amount], i) => ({
      name,
      amount,
      color: colors[i % colors.length],
    }));
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("apex-user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    const userData = JSON.parse(stored);
    setUser(userData);

    fetch(`/api/transactions?userId=${userData.id}`)
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data.transactions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    if (userData.isAdmin) {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => setNotifications(data.notifications || []))
        .catch(() => {});
    }
  }, [router]);

  if (!user) return null;

  const totalSent = transactions
    .filter((t) => t.senderId === user.id)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalReceived = transactions
    .filter((t) => t.receiverId === user.id)
    .reduce((sum, t) => sum + t.amount, 0);
  const recentTransactions = transactions.slice(0, 5);
  const monthlyData = computeMonthlyData(transactions, user.id);
  const spendingCategories = computeSpendingBreakdown(transactions, user.id);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">
          Welcome, <span className="gradient-text">{user.name}</span>
        </h1>
        <p className="text-muted-foreground">
          {user.isAdmin ? "Admin Dashboard — You're the boss!" : "Here's your financial overview"}
        </p>
      </motion.div>

      {/* Admin Notifications Panel */}
      {user.isAdmin && notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass card-glow rounded-2xl p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                <Bell className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold">Admin Notifications</h2>
            </div>
            <button
              onClick={async () => {
                await fetch("/api/notifications", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "markAllRead" }),
                });
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
              }}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Check className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>
          <div className="space-y-2">
            {notifications.slice(0, 5).map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-xl border border-border/50 px-4 py-3 transition-colors hover:bg-secondary/30 ${
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
                  <p className="mt-1 text-[10px] text-muted-foreground/60">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total Balance",
            value: user.balance,
            icon: Wallet,
            change: "+12.5%",
            positive: true,
            gradient: "from-gradient-start to-gradient-end",
          },
          {
            label: "Income",
            value: totalReceived,
            icon: TrendingUp,
            change: "",
            positive: true,
            gradient: "from-emerald-500 to-teal-500",
          },
          {
            label: "Expenses",
            value: totalSent,
            icon: TrendingDown,
            change: "",
            positive: false,
            gradient: "from-rose-500 to-pink-500",
          },
          {
            label: "Transactions",
            value: transactions.length,
            icon: Receipt,
            change: "",
            positive: true,
            gradient: "from-amber-500 to-orange-500",
            isCount: true,
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass card-glow rounded-2xl p-3 sm:p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className="mt-1 text-2xl font-bold">
                  {kpi.isCount ? kpi.value : formatCurrency(kpi.value)}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.gradient}`}
              >
                <kpi.icon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1">
              <span
                className={`text-xs font-medium ${
                  kpi.positive ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {kpi.change}
              </span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass card-glow rounded-2xl p-6 lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Income vs Expenses</h2>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
              Last 8 months
            </span>
          </div>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    color: "var(--foreground)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#incomeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#expenseGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Quick Actions + Spending */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <div className="glass card-glow rounded-2xl p-6">
            <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className={`flex flex-col items-center gap-2 rounded-xl bg-gradient-to-br ${action.gradient} p-4 text-white transition-all hover:scale-105 hover:shadow-lg`}
                >
                  <action.icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass card-glow rounded-2xl p-6">
            <h2 className="mb-4 text-lg font-semibold">Spending Breakdown</h2>
            <div className="space-y-3">
              {spendingCategories.map((cat) => {
                const maxAmount = Math.max(...spendingCategories.map((c) => c.amount), 1);
                return (
                <div key={cat.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="truncate">{cat.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(cat.amount / maxAmount) * 100}%`,
                      }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass card-glow rounded-2xl p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <button
            onClick={() => router.push("/transactions")}
            className="text-sm font-medium text-primary hover:underline"
          >
            View All
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No transactions yet. Send some money to get started!
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((tx: any) => {
              const isSent = tx.senderId === user.id;
              const otherUser = isSent ? tx.receiver : tx.sender;
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isSent ? "bg-rose-500/10" : "bg-emerald-500/10"
                      }`}
                    >
                      {isSent ? (
                        <ArrowUpRight className="h-5 w-5 text-rose-500" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {isSent ? `To ${otherUser?.name}` : `From ${otherUser?.name}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.note || "Transfer"} · {timeAgo(tx.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      isSent ? "text-rose-500" : "text-emerald-500"
                    }`}
                  >
                    {isSent ? "-" : "+"}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
