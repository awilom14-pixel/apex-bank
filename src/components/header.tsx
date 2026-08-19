"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Bell } from "lucide-react";
import { motion } from "framer-motion";

export default function Header() {
  const [dark, setDark] = useState(true);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("apex-user") || "{}");
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    // Apply dark mode on mount
    document.documentElement.classList.add("dark");
  }, []);

  const toggleTheme = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-lg">
      <div>
        <p className="text-sm text-muted-foreground">{greeting}</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </motion.button>
      </div>
    </header>
  );
}
