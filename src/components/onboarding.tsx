"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, CreditCard, Send, Shield, ChevronRight, Check } from "lucide-react";
import Link from "next/link";

const steps = [
  {
    icon: User,
    title: "Welcome to Apex Bank",
    description: "Your premium digital banking experience. Let us show you around.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: CreditCard,
    title: "Your Account",
    description: "View your balance, transaction history, and card details on the dashboard.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Send,
    title: "Send Money",
    description: "Transfer funds instantly to other users. Set up recurring payments with a few taps.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Shield,
    title: "Security First",
    description: "Your account is protected with JWT auth, MFA, rate limiting, and audit logging.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onboarding = localStorage.getItem("apex-onboarding");
    if (!onboarding) {
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const complete = () => {
    localStorage.setItem("apex-onboarding", "done");
    setShow(false);
  };

  if (!show) return null;

  const current = steps[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="glass card-glow w-full max-w-sm rounded-3xl p-8 text-center"
          >
            <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${current.bg}`}>
              <Icon className={`h-8 w-8 ${current.color}`} />
            </div>

            <h2 className="mb-2 text-xl font-bold">{current.title}</h2>
            <p className="mb-8 text-sm text-muted-foreground">{current.description}</p>

            <div className="mb-6 flex justify-center gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted"
                  }`}
                />
              ))}
            </div>

            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={complete}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Check className="h-4 w-4" />
                  Get Started
                </button>
                <Link
                  href="/dashboard"
                  onClick={complete}
                  className="block w-full rounded-xl border border-border px-6 py-3 text-center text-sm text-muted-foreground transition-colors hover:bg-secondary"
                >
                  Skip for now
                </Link>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
