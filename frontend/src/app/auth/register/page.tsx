"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Moon, Mail, Lock, User, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p: string) => /[0-9]/.test(p), label: "One number" },
];

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showStrength, setShowStrength] = useState(false);

  const strengthScore = PASSWORD_RULES.filter((r) => r.test(password)).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/register", { email, password, name });
      const data = res.data;

      setAuth({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        userId: data.user_id,
        userName: data.name,
        onboardingComplete: false,
      });

      router.push("/onboarding");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen nb-hero-bg flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #6c63ff, transparent)" }} />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full blur-3xl opacity-15"
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
          <h1 className="font-outfit text-3xl font-bold text-nb-text-primary">Begin your journey</h1>
          <p className="text-nb-text-secondary mt-2">Your companion is ready to meet you</p>
        </div>

        <div className="nb-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-nb-text-secondary mb-2">Your name</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-nb-text-muted" />
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should NiteBuddy call you?"
                  className="nb-input-icon-left"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-nb-text-secondary mb-2">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-nb-text-muted" />
                <input
                  id="register-email"
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
              <label className="block text-sm font-medium text-nb-text-secondary mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-nb-text-muted" />
                <input
                  id="register-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setShowStrength(true); }}
                  placeholder="Create a strong password"
                  className="nb-input-icon-both"
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-nb-text-muted hover:text-nb-text-secondary transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength */}
              <AnimatePresence>
                {showStrength && password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-2"
                  >
                    {/* Strength bar */}
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{
                            background: strengthScore >= level
                              ? level === 1 ? "#f87171" : level === 2 ? "#fbbf24" : "#34d399"
                              : "var(--nb-surface-3)",
                          }}
                        />
                      ))}
                    </div>
                    {/* Rules */}
                    <div className="space-y-1">
                      {PASSWORD_RULES.map((rule) => (
                        <div key={rule.label} className="flex items-center gap-2 text-xs">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${rule.test(password) ? "bg-emerald-500/20 text-emerald-400" : "bg-nb-surface-3 text-nb-text-muted"}`}>
                            <Check size={10} />
                          </div>
                          <span className={rule.test(password) ? "text-nb-text-secondary" : "text-nb-text-muted"}>
                            {rule.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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

            {/* Terms */}
            <p className="text-nb-text-muted text-xs leading-relaxed">
              By creating an account, you agree to our{" "}
              <span className="text-nb-text-accent cursor-pointer hover:underline">Terms of Service</span>{" "}
              and{" "}
              <span className="text-nb-text-accent cursor-pointer hover:underline">Privacy Policy</span>.
            </p>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={loading || strengthScore < 2}
              className="nb-btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-nb-border" />
            <span className="text-nb-text-muted text-xs">already have an account?</span>
            <div className="flex-1 h-px bg-nb-border" />
          </div>

          <Link
            href="/auth/login"
            id="goto-login"
            className="nb-btn-secondary w-full flex items-center justify-center gap-2 py-3"
          >
            Sign In Instead
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
