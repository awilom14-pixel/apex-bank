"use client";

import { useState, useRef, useCallback } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const controls = useAnimationControls();
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0 && diff < 150) {
      currentY.current = diff * 0.5;
      controls.set({ y: diff * 0.5 });
    }
  }, [pulling, controls]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;
    if (currentY.current > 50) {
      setRefreshing(true);
      controls.set({ y: 60 });
      await onRefresh();
      setRefreshing(false);
    }
    currentY.current = 0;
    controls.set({ y: 0 });
    setPulling(false);
  }, [pulling, controls, onRefresh]);

  return (
    <div
      className="relative min-h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {(pulling || refreshing) && (
        <motion.div
          animate={controls}
          className="absolute left-0 right-0 top-0 z-10 flex justify-center py-4"
        >
          <motion.div
            animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={refreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? "text-primary" : "text-muted-foreground"}`} />
          </motion.div>
        </motion.div>
      )}
      <motion.div animate={controls}>{children}</motion.div>
    </div>
  );
}
