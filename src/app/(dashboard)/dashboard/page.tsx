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
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { useRouter } from "next/navigation";

const monthlyData = [
  { month: "Jan", income: 4200, expenses: 2800 },
  { month: "Feb", income: 3800, expenses: 3100 },
  { month: "Mar", income: 5100, expenses: 2600 },
  { month: "Apr", income: 4500, expenses: 3400 },
  { month: "May", income: 5800, expenses: 2900 },
  { month: "Jun", income: 6200, expenses: 3200 },
  { month: "Jul", income: 5400, expenses: 2700 },
  { month: "Aug", income: 8200, expenses: 3400 },
];

const spendingCategories = [
  { name: "Food", amount: 820, color: "#a78bfa" },
  { name: "Transport", amount: 420, color: "#60a5fa" },
  { name: "Shopping", amount: 1200, color: "#f472b6" },
  { name: "Bills", amount: 650, color: "#34d399" },
  { name: "Other", amount: 330, color: "#fbbf24" },
];

const quickActions = [
  { label: "Send Money", icon: Send, href: "/transfer", gradient: "from-violet-500 to-purple-600" },
  { label: "Transactions", icon: Receipt, href: "/transactions", gradient: "from-blue-500 to-cyan-500" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
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
  }, [router]);

  if (!user) return null;

  const totalSent = transactions
    .filter((t) => t.senderId === user.id)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalReceived = transactions
    .filter((t) => t.receiverId === user.id)
    .reduce((sum, t) => sum + t.amount, 0);
  const recentTransactions = transactions.slice(0, 5);

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
        <p className="text-muted-foreground">Here&apos;s your financial overview</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            label: "Income This Month",
            value: totalReceived || 8200,
            icon: TrendingUp,
            change: "+8.2%",
            positive: true,
            gradient: "from-emerald-500 to-teal-500",
          },
          {
            label: "Expenses This Month",
            value: totalSent || 3421,
            icon: TrendingDown,
            change: "-3.1%",
            positive: false,
            gradient: "from-rose-500 to-pink-500",
          },
          {
            label: "Total Transactions",
            value: transactions.length || 47,
            icon: Receipt,
            change: "+5",
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
            className="glass card-glow rounded-2xl p-5"
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
          <div className="h-64">
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
          {/* Quick Actions */}
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

          {/* Spending Breakdown */}
          <div className="glass card-glow rounded-2xl p-6">
            <h2 className="mb-4 text-lg font-semibold">Spending Breakdown</h2>
            <div className="space-y-3">
              {spendingCategories.map((cat) => (
                <div key={cat.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{cat.name}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(cat.amount / 1200) * 100}%`,
                      }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
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
