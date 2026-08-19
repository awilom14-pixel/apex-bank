"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Snowflake,
  Sun,
  Eye,
  EyeOff,
  Copy,
  Check,
  Wifi,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function CardsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showCVV, setShowCVV] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("apex-user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!user) return null;

  // Generate pseudo card number from user ID
  const cardNumber = `4532 ${user.id?.slice(0, 4)} ${user.id?.slice(4, 8)} 7891`;
  const cardExpiry = "12/28";
  const cardCVV = "482";
  const cardHolder = user.name?.toUpperCase() || "CARD HOLDER";

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">My Cards</h1>
        <p className="text-muted-foreground">Manage your virtual and physical cards</p>
      </motion.div>

      {/* 3D Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="perspective-1000 flex justify-center px-2"
      >
        <div
          className={`bank-card relative h-[220px] w-full max-w-[420px] rounded-3xl bg-gradient-to-br from-gradient-start via-purple-600 to-gradient-end p-5 text-white shadow-2xl sm:h-[280px] sm:p-6 ${
            frozen ? "opacity-60 grayscale" : ""
          }`}
        >
          {/* Decorative elements */}
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

          {/* Header */}
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              <span className="text-sm font-medium tracking-wider opacity-80">
                APEX BANK
              </span>
            </div>
            <Wifi className="h-6 w-6 rotate-90 opacity-80" />
          </div>

          {/* Card Number */}
          <div className="relative mt-6 sm:mt-8">
            <p className="font-mono text-lg tracking-widest sm:text-2xl">{cardNumber}</p>
          </div>

          {/* Footer */}
          <div className="relative mt-auto flex items-end justify-between">
            <div>
              <p className="text-xs opacity-60">CARD HOLDER</p>
              <p className="mt-0.5 text-sm font-medium tracking-wider">
                {cardHolder}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-60">EXPIRES</p>
              <p className="mt-0.5 text-sm font-medium">{cardExpiry}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-60">CVV</p>
              <p className="mt-0.5 font-mono text-sm font-medium">
                {showCVV ? cardCVV : "•••"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Card Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mx-auto max-w-[420px] space-y-4"
      >
        {/* Card Details */}
        <div className="glass card-glow rounded-2xl p-6">
          <h2 className="mb-4 text-lg font-semibold">Card Details</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">Card Number</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{cardNumber}</span>
                <button
                  onClick={() => copyToClipboard(cardNumber.replace(/\s/g, ""), "number")}
                  className="text-muted-foreground hover:text-primary"
                >
                  {copied === "number" ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">Expiry Date</span>
              <span className="text-sm">{cardExpiry}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">CVV</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">
                  {showCVV ? cardCVV : "•••"}
                </span>
                <button
                  onClick={() => setShowCVV(!showCVV)}
                  className="text-muted-foreground hover:text-primary"
                >
                  {showCVV ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">Status</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  frozen
                    ? "bg-blue-500/10 text-blue-500"
                    : "bg-emerald-500/10 text-emerald-500"
                }`}
              >
                {frozen ? "Frozen" : "Active"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">Balance</span>
              <span className="text-sm font-semibold">
                {formatCurrency(user.balance)}
              </span>
            </div>
          </div>
        </div>

        {/* Freeze/Unfreeze */}
        <button
          onClick={() => setFrozen(!frozen)}
          className={`flex h-14 w-full items-center justify-center gap-3 rounded-2xl font-medium transition-all ${
            frozen
              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90"
              : "glass border border-border bg-card text-foreground hover:bg-secondary"
          }`}
        >
          {frozen ? (
            <>
              <Sun className="h-5 w-5" />
              Unfreeze Card
            </>
          ) : (
            <>
              <Snowflake className="h-5 w-5 text-blue-500" />
              Freeze Card
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
