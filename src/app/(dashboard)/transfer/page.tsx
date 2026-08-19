"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Send,
  Check,
  ArrowRight,
  User,
  X,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function TransferPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"search" | "amount" | "confirm" | "success">("search");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("apex-user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(JSON.parse(stored));

    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []));
  }, [router]);

  const filteredUsers = users.filter(
    (u) =>
      u.id !== user?.id &&
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSend = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: selectedUser.id,
          amount: parseFloat(amount),
          note,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Update local storage with new balance
      const updatedUser = { ...user, balance: data.sender.balance };
      localStorage.setItem("apex-user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSuccessMsg(data.message);
      setStep("success");
      setLoading(false);
    } catch {
      setError("Transfer failed");
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Send Money</h1>
        <p className="text-muted-foreground">
          Transfer funds to other users instantly
        </p>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass card-glow rounded-2xl p-6"
      >
        <p className="text-sm text-muted-foreground">Available Balance</p>
        <p className="mt-1 text-3xl font-bold gradient-text">
          {formatCurrency(user.balance)}
        </p>
      </motion.div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {["search", "amount", "confirm"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                step === s || (step === "success" && i < 3)
                  ? "bg-gradient-to-br from-gradient-start to-gradient-end text-white"
                  : i <
                    ["search", "amount", "confirm"].indexOf(step)
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {step === "success" || i < ["search", "amount", "confirm"].indexOf(step) ? (
                <Check className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 2 && (
              <div
                className={`h-px w-12 ${
                  i < ["search", "amount", "confirm"].indexOf(step)
                    ? "bg-primary"
                    : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {step === "search" && (
          <motion.div
            key="search"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="glass card-glow rounded-2xl p-6"
          >
            <h2 className="mb-4 text-lg font-semibold">Select Recipient</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-secondary/50 pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {search ? "No users found" : "No other users yet. Ask friends to register!"}
                </p>
              ) : (
                filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelectedUser(u);
                      setStep("amount");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-border/50 px-4 py-3 transition-all hover:border-primary/50 hover:bg-secondary/50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gradient-start to-gradient-end text-sm font-bold text-white">
                      {u.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}

        {step === "amount" && selectedUser && (
          <motion.div
            key="amount"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="glass card-glow rounded-2xl p-6"
          >
            <h2 className="mb-4 text-lg font-semibold">Enter Amount</h2>
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gradient-start to-gradient-end text-sm font-bold text-white">
                {selectedUser.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{selectedUser.name}</p>
                <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setStep("search");
                }}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                $
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                className="h-20 w-full rounded-xl border border-border bg-secondary/50 pl-10 pr-4 text-4xl font-bold outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            </div>

            {amount && parseFloat(amount) > user.balance && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4" />
                Insufficient balance
              </motion.div>
            )}

            <div className="mb-4">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (optional)"
                className="h-12 w-full rounded-xl border border-border bg-secondary/50 px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("search")}
                className="h-12 flex-1 rounded-xl border border-border bg-secondary/50 font-medium transition-colors hover:bg-secondary"
              >
                Back
              </button>
              <button
                onClick={() => setStep("confirm")}
                disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > user.balance}
                className="h-12 flex-1 rounded-xl bg-gradient-to-r from-gradient-start to-gradient-end font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              >
                Review Transfer
              </button>
            </div>
          </motion.div>
        )}

        {step === "confirm" && selectedUser && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="glass card-glow rounded-2xl p-6"
          >
            <h2 className="mb-6 text-lg font-semibold">Confirm Transfer</h2>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="space-y-4 rounded-xl border border-border/50 p-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Recipient</span>
                <span className="text-sm font-medium">{selectedUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-sm font-bold text-primary">
                  {formatCurrency(parseFloat(amount))}
                </span>
              </div>
              {note && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Note</span>
                  <span className="text-sm">{note}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Your Balance After</span>
                <span className="text-sm font-medium">
                  {formatCurrency(user.balance - parseFloat(amount))}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep("amount")}
                className="h-12 flex-1 rounded-xl border border-border bg-secondary/50 font-medium transition-colors hover:bg-secondary"
              >
                Back
              </button>
              <button
                onClick={handleSend}
                disabled={loading}
                className="group flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gradient-start to-gradient-end font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Send Money
                    <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass card-glow rounded-2xl p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500"
            >
              <Check className="h-10 w-10 text-white" />
            </motion.div>
            <h2 className="mb-2 text-2xl font-bold">Transfer Successful!</h2>
            <p className="mb-6 text-muted-foreground">{successMsg}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep("search");
                  setSelectedUser(null);
                  setAmount("");
                  setNote("");
                  setError("");
                }}
                className="h-12 flex-1 rounded-xl border border-border bg-secondary/50 font-medium transition-colors hover:bg-secondary"
              >
                Send Again
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="h-12 flex-1 rounded-xl bg-gradient-to-r from-gradient-start to-gradient-end font-medium text-white transition-all hover:opacity-90"
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
