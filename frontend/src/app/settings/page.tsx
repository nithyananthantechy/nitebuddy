"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Heart, Check, Save, Sparkles, MessageCircle } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Sidebar } from "@/components/Sidebar";

type PersonalityMode = "friend" | "mentor" | "listener" | "coach";

const PERSONALITY_MODES: { mode: PersonalityMode; label: string; desc: string; emoji: string; gradient: string }[] = [
  { mode: "friend", label: "Friend", desc: "Warm, casual, and supportive. Talks like a close friend who listens.", emoji: "🤝", gradient: "from-pink-500 to-rose-500" },
  { mode: "mentor", label: "Mentor", desc: "Goal-focused and motivational. Helps you grow with honest perspective.", emoji: "🎯", gradient: "from-blue-500 to-cyan-500" },
  { mode: "listener", label: "Listener", desc: "Calm and patient. Creates a safe space for deep expression.", emoji: "🎧", gradient: "from-emerald-500 to-teal-500" },
  { mode: "coach", label: "Coach", desc: "Accountability-driven. Focused on productivity and habit building.", emoji: "⚡", gradient: "from-orange-500 to-amber-500" },
];

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isHydrated } = useAuthStore();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeMode, setActiveMode] = useState<PersonalityMode>("friend");

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isHydrated, isAuthenticated, router]);

  // Fetch current profile for settings
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get("/profile/me").then((r) => r.data),
    enabled: isAuthenticated && isHydrated,
  });

  // Populate activeMode when profile is loaded
  useEffect(() => {
    if (profile) {
      setActiveMode(profile.personality_mode || "friend");
    }
  }, [profile]);

  // Mutation to update profile settings
  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put("/profile/me", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleSaveSettings = () => {
    updateMutation.mutate({
      personality_mode: activeMode,
    });
  };

  if (!isHydrated || !isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-nb-deep text-nb-text-secondary">
        <div className="w-8 h-8 border-2 border-nb-accent/30 border-t-nb-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-nb-deep">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="font-outfit text-4xl font-bold mb-1">
              Your <span className="nb-gradient-text">Settings</span>
            </h1>
            <p className="text-nb-text-secondary">
              Customize NiteBuddy's behavior and personality settings
            </p>
          </motion.div>

          <div className="space-y-6">
            <div className="nb-card p-6 space-y-6">
              <h2 className="font-outfit font-bold text-lg border-b border-nb-border pb-3 flex items-center gap-2">
                <Sparkles size={18} className="text-nb-accent" /> Companion Personality Style
              </h2>
              <p className="text-sm text-nb-text-secondary">
                Select how NiteBuddy responds to you. You can switch this style at any time and it will immediately adapt.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {PERSONALITY_MODES.map((mode) => (
                  <button
                    key={mode.mode}
                    type="button"
                    onClick={() => setActiveMode(mode.mode)}
                    className={`p-5 rounded-2xl text-left transition-all border ${
                      activeMode === mode.mode
                        ? "border-nb-accent bg-nb-accent-light"
                        : "border-nb-border bg-nb-surface-2 hover:border-nb-border-2"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center text-xl mb-3`}>
                      {mode.emoji}
                    </div>
                    <h3 className="font-outfit font-bold text-base mb-1">{mode.label}</h3>
                    <p className="text-nb-text-muted text-xs leading-relaxed">{mode.desc}</p>
                    {activeMode === mode.mode && (
                      <div className="mt-3 flex items-center gap-1.5 text-nb-text-accent text-xs font-medium">
                        <Check size={12} />
                        Active Style
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="nb-card p-6 space-y-4">
              <h2 className="font-outfit font-bold text-lg border-b border-nb-border pb-3 flex items-center gap-2">
                <Settings size={18} className="text-nb-purple" /> General Info
              </h2>
              <div className="space-y-3 text-sm text-nb-text-secondary">
                <div className="flex justify-between py-1 border-b border-nb-border/40">
                  <span className="text-nb-text-muted">Account Timezone</span>
                  <span className="font-medium text-nb-text-primary">{profile?.timezone || "UTC"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-nb-text-muted">Database Connection</span>
                  <span className="font-medium text-emerald-400">Local (Healthy)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4">
              <AnimatePresence>
                {saveSuccess && (
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-emerald-400 flex items-center gap-1.5 font-medium"
                  >
                    <Check size={16} /> Settings saved successfully!
                  </motion.span>
                )}
              </AnimatePresence>

              <button
                onClick={handleSaveSettings}
                disabled={updateMutation.isPending}
                className="nb-btn-primary px-6 flex items-center gap-2"
              >
                {updateMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={16} /> Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
