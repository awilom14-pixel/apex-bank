"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CreditCard,
  Building2,
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  Wallet as WalletIcon,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { fetchSession } from "@/lib/client-auth";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

type Tab = "deposit" | "withdraw";

export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("deposit");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [checkingUrl, setCheckingUrl] = useState(true);

  useEffect(() => {
    fetchSession().then((u) => {
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser(u);
    });
  }, [router]);

  useEffect(() => {
    // Check URL params for Stripe return
    const params = new URLSearchParams(window.location.search);
    if (params.get("deposit") === "success") {
      toast.success("Deposit successful! Your balance has been updated.");
      router.replace("/wallet");
    } else if (params.get("deposit") === "cancelled") {
      toast.info("Deposit cancelled.");
      router.replace("/wallet");
    } else if (params.get("stripe") === "success") {
      toast.success("Bank account connected! You can now make withdrawals.");
      setOnboardingComplete(true);
      router.replace("/wallet");
    } else if (params.get("stripe") === "refresh") {
      toast.info("Please complete the bank account setup.");
    }
    setCheckingUrl(false);
  }, [router]);

  useEffect(() => {
    if (!user) return;

    fetch("/api/stripe/config")
      .then((res) => res.json())
      .then((data) => {
        setStripeReady(!!data.publishableKey);
        setOnboardingComplete(data.stripeOnboarding);
      })
      .catch(() => {});

    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => {
        setDeposits(data.deposits || []);
        setWithdrawals(data.withdrawals || []);
      })
      .catch(() => {});
  }, [user]);

  const handleDeposit = async () => {
    const value = parseFloat(amount);
    if (!value || value < 10) {
      toast.error("Minimum deposit is $10");
      return;
    }
    if (value > 10000) {
      toast.error("Maximum deposit is $10,000");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to create deposit");
      }
    } catch {
      toast.error("Network error");
    }
    setLoading(false);
  };

  const handleWithdraw = async () => {
    const value = parseFloat(amount);
    if (!value || value < 10) {
      toast.error("Minimum withdrawal is $10");
      return;
    }
    if (value > (user?.balance || 0)) {
      toast.error("Insufficient balance");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setUser({ ...user, balance: user.balance - value });
        setAmount("");
      } else {
        toast.error(data.error || "Failed to withdraw");
      }
    } catch {
      toast.error("Network error");
    }
    setLoading(false);
  };

  const handleConnectBank = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.alreadyOnboarded) {
        toast.success("Bank account already connected!");
        setOnboardingComplete(true);
      } else {
        toast.error(data.error || "Failed to start bank setup");
      }
    } catch {
      toast.error("Network error");
    }
    setLoading(false);
  };

  if (!user || checkingUrl) return null;

  const quickAmounts = [25, 50, 100, 250, 500, 1000];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="text-muted-foreground">Deposit and withdraw real money</p>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass card-glow rounded-2xl p-6"
      >
        <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
          <WalletIcon className="h-4 w-4" />
          Available Balance
        </div>
        <div className="text-4xl font-bold">{formatCurrency(user.balance)}</div>
        <p className="mt-2 text-xs text-muted-foreground">
          Internal balance for transfers between Apex Bank users
        </p>
      </motion.div>

      {/* Bank Account Setup */}
      {!onboardingComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6"
        >
          <div className="mb-3 flex items-center gap-3">
            <Building2 className="h-6 w-6 text-amber-500" />
            <div>
              <h3 className="font-semibold">Connect Your Bank Account</h3>
              <p className="text-sm text-muted-foreground">
                Link a bank account to withdraw funds
              </p>
            </div>
          </div>
          <button
            onClick={handleConnectBank}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-medium text-black transition-all hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            {loading ? "Setting up..." : "Connect Bank via Stripe"}
          </button>
        </motion.div>
      )}

      {onboardingComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <p className="text-sm text-emerald-500">Bank account verified and ready</p>
        </motion.div>
      )}

      {/* Deposit / Withdraw Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass card-glow rounded-2xl overflow-hidden"
      >
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab("deposit")}
            className={`flex flex-1 items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
              tab === "deposit"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowDownToLine className="h-4 w-4" />
            Deposit
          </button>
          <button
            onClick={() => setTab("withdraw")}
            className={`flex flex-1 items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
              tab === "withdraw"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowUpFromLine className="h-4 w-4" />
            Withdraw
          </button>
        </div>

        <div className="p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            {tab === "deposit"
              ? "Add funds to your Apex Bank account via card payment"
              : "Transfer funds from Apex Bank to your linked bank account"}
          </p>

          {/* Quick amounts */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            {quickAmounts.map((q) => (
              <button
                key={q}
                onClick={() => setAmount(q.toString())}
                className={`rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                  amount === q.toString()
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-secondary"
                }`}
              >
                ${q}
              </button>
            ))}
          </div>

          {/* Amount input */}
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
              $
            </span>
            <input
              type="number"
              min="10"
              max="10000"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-border bg-secondary/50 py-4 pl-8 pr-4 text-2xl font-bold outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <p className="mb-4 text-xs text-muted-foreground">
            Min $10 · Max $10,000 · {tab === "deposit" ? "Funds available instantly" : "Funds arrive in 1-2 business days"}
          </p>

          {/* Action button */}
          <button
            onClick={tab === "deposit" ? handleDeposit : handleWithdraw}
            disabled={loading || !amount || parseFloat(amount) < 10}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 ${
              tab === "deposit"
                ? "bg-gradient-to-r from-gradient-start to-gradient-end text-white"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : tab === "deposit" ? (
              <CreditCard className="h-4 w-4" />
            ) : (
              <ArrowUpFromLine className="h-4 w-4" />
            )}
            {loading
              ? "Processing..."
              : tab === "deposit"
              ? `Deposit $${parseFloat(amount || "0").toFixed(2)}`
              : `Withdraw $${parseFloat(amount || "0").toFixed(2)}`}
          </button>
        </div>
      </motion.div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass card-glow rounded-2xl p-6"
      >
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <Shield className="h-5 w-5 text-primary" />
          How It Works
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
            <p><strong className="text-foreground">Deposit:</strong> Pay with your card via Stripe. Funds appear instantly in your Apex balance.</p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
            <p><strong className="text-foreground">Transfer:</strong> Send money to other Apex Bank users instantly.</p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
            <p><strong className="text-foreground">Withdraw:</strong> Connect your bank account, then withdraw to it via ACH (1-2 days).</p>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      {(deposits.length > 0 || withdrawals.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass card-glow rounded-2xl p-6"
        >
          <h3 className="mb-4 font-semibold">Recent Activity</h3>
          <div className="space-y-2">
            {deposits.slice(0, 5).map((d: any) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <ArrowDownToLine className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium">Deposit</p>
                    <p className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-500">+{formatCurrency(d.amount)}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    {d.status === "completed" ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Clock className="h-3 w-3" />}
                    {d.status}
                  </p>
                </div>
              </div>
            ))}
            {withdrawals.slice(0, 5).map((w: any) => (
              <div key={w.id} className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <ArrowUpFromLine className="h-4 w-4 text-rose-500" />
                  <div>
                    <p className="text-sm font-medium">Withdrawal</p>
                    <p className="text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-rose-500">-{formatCurrency(w.amount)}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    {w.status === "completed" ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : w.status === "failed" ? <XCircle className="h-3 w-3 text-rose-500" /> : <Clock className="h-3 w-3" />}
                    {w.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
