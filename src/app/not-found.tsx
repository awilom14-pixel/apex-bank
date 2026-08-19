"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass card-glow max-w-md rounded-3xl p-12 text-center"
      >
        <div className="mb-6 text-8xl font-bold text-primary/20">404</div>
        <h1 className="mb-3 text-2xl font-bold">Page Not Found</h1>
        <p className="mb-8 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-all hover:scale-105 active:scale-95"
        >
          Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
