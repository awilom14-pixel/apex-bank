"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Camera,
  Sun,
  Moon,
  Bell,
  Shield,
  Save,
  Check,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dark, setDark] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("apex-user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    const userData = JSON.parse(stored);
    setUser(userData);
    setName(userData.name || "");
    setEmail(userData.email || "");
    setDark(document.documentElement.classList.contains("dark"));
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/auth/register", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, name }),
      });
      const updatedUser = { ...user, name };
      localStorage.setItem("apex-user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSaved(true);
      toast.success("Profile updated!");
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error("Failed to save changes");
    }
    setSaving(false);
  };

  const toggleTheme = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </motion.div>

      {/* Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass card-glow rounded-2xl p-6"
      >
        <h2 className="mb-4 text-lg font-semibold">Profile</h2>

        <div className="mb-6 flex items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gradient-start to-gradient-end text-2xl font-bold text-white">
              {name.charAt(0)?.toUpperCase()}
            </div>
            <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Balance: <span className="font-medium text-foreground">{formatCurrency(user.balance)}</span>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-secondary/50 pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                disabled
                className="h-12 w-full rounded-xl border border-border bg-secondary/30 pl-11 pr-4 text-sm text-muted-foreground"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gradient-start to-gradient-end px-6 font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
          >
            {saving ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : saved ? (
              <>
                <Check className="h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass card-glow rounded-2xl p-6"
      >
        <h2 className="mb-4 text-lg font-semibold">Preferences</h2>
        <div className="space-y-4">
          {/* Theme */}
          <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-4">
            <div className="flex items-center gap-3">
              {dark ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-xs text-muted-foreground">
                  {dark ? "Dark theme enabled" : "Light theme enabled"}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                dark ? "bg-primary" : "bg-muted"
              }`}
            >
              <motion.div
                animate={{ x: dark ? 22 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md"
              />
            </button>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Receive transaction alerts
                </p>
              </div>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                notifications ? "bg-primary" : "bg-muted"
              }`}
            >
              <motion.div
                animate={{ x: notifications ? 22 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md"
              />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Security */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass card-glow rounded-2xl p-6"
      >
        <h2 className="mb-4 text-lg font-semibold">Security</h2>
        <div className="space-y-3">
          <button className="flex w-full items-center gap-3 rounded-xl border border-border/50 px-4 py-3 text-left transition-colors hover:bg-secondary/50">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Change Password</p>
              <p className="text-xs text-muted-foreground">
                Update your account password
              </p>
            </div>
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl border border-border/50 px-4 py-3 text-left transition-colors hover:bg-secondary/50">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">
                Add an extra layer of security
              </p>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
