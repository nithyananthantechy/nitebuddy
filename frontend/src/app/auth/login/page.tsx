"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Moon, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      const data = res.data;

      setAuth({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        userId: data.user_id,
        userName: data.name,
        onboardingComplete: data.onboarding_complete,
      });

      if (!data.onboarding_complete) {
        router.push("/onboarding");
      } else {
        router.push("/chat");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen nb-hero-bg flex items-center justify-center px-4 py-12">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #6c63ff, transparent)" }} />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-15"
          style={{ background: "radial-gradient(circle, #a855f7, transparent)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nb-accent to-nb-purple flex items-center justify-center">
              <Moon size={18} className="text-white" />
            </div>
            <span className="font-outfit font-bold text-2xl nb-gradient-text">NiteBuddy</span>
          </Link>
          <h1 className="font-outfit text-3xl font-bold text-nb-text-primary">Welcome back</h1>
          <p className="text-nb-text-secondary mt-2">Your companion has been waiting</p>
        </div>

        {/* Card */}
        <div className="nb-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-nb-text-secondary mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-nb-text-muted" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="nb-input-icon-left"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-nb-text-secondary">Password</label>
                <Link href="#" className="text-xs text-nb-text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-nb-text-muted" />
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="nb-input-icon-both"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-nb-text-muted hover:text-nb-text-secondary transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="nb-btn-primary w-full flex items-center justify-center gap-2 py-3.5"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-nb-border" />
            <span className="text-nb-text-muted text-xs">or</span>
            <div className="flex-1 h-px bg-nb-border" />
          </div>

          {/* Register link */}
          <p className="text-center text-nb-text-secondary text-sm">
            New to NiteBuddy?{" "}
            <Link href="/auth/register" className="text-nb-text-accent hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 text-nb-text-muted text-xs">
            <Sparkles size={12} className="text-nb-accent" />
            <span>Your emotions are not a burden. They're data points for understanding yourself.</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
