"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  Filter,
  Calendar,
  FileText,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function TransactionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "sent" | "received">("all");
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

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.sender?.name?.toLowerCase().includes(search.toLowerCase()) ||
      tx.receiver?.name?.toLowerCase().includes(search.toLowerCase()) ||
      tx.note?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "sent" && tx.senderId === user?.id) ||
      (filter === "received" && tx.receiverId === user?.id);
    return matchesSearch && matchesFilter;
  });

  const totalSent = transactions
    .filter((t) => t.senderId === user?.id)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalReceived = transactions
    .filter((t) => t.receiverId === user?.id)
    .reduce((sum, t) => sum + t.amount, 0);

  const exportCSV = () => {
    const headers = ["Date", "Type", "Name", "Email", "Amount", "Note"];
    const rows = filtered.map((tx) => {
      const isSent = tx.senderId === user?.id;
      const other = isSent ? tx.receiver : tx.sender;
      return [
        formatDate(tx.createdAt),
        isSent ? "Sent" : "Received",
        other?.name || "",
        other?.email || "",
        `${isSent ? "-" : "+"}${tx.amount.toFixed(2)}`,
        tx.note || "",
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Your complete transaction history</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 self-start rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
        >
          <Download className="h-4 w-4" />
          CSV
        </button>
        <a
          href="/api/statements"
          target="_blank"
          className="flex items-center gap-2 self-start rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
        >
          <FileText className="h-4 w-4" />
          PDF
        </a>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass card-glow rounded-2xl p-5"
        >
          <p className="text-sm text-muted-foreground">Total Sent</p>
          <p className="mt-1 text-2xl font-bold text-rose-500">
            {formatCurrency(totalSent)}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass card-glow rounded-2xl p-5"
        >
          <p className="text-sm text-muted-foreground">Total Received</p>
          <p className="mt-1 text-2xl font-bold text-emerald-500">
            {formatCurrency(totalReceived)}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass card-glow rounded-2xl p-5"
        >
          <p className="text-sm text-muted-foreground">Net Flow</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              totalReceived - totalSent >= 0 ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {formatCurrency(totalReceived - totalSent)}
          </p>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-secondary/50 pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(["all", "sent", "received"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-gradient-to-r from-gradient-start to-gradient-end text-white"
                  : "border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Filter className="h-4 w-4" />
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Transaction List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass card-glow rounded-2xl"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No transactions found
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((tx: any) => {
              const isSent = tx.senderId === user.id;
              const other = isSent ? tx.receiver : tx.sender;
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-secondary/30 sm:px-6 sm:py-4"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 ${
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
                        {isSent ? `To ${other?.name}` : `From ${other?.name}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.note || "Transfer"} · {other?.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        isSent ? "text-rose-500" : "text-emerald-500"
                      }`}
                    >
                      {isSent ? "-" : "+"}
                      {formatCurrency(tx.amount)}
                    </p>
                    <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
