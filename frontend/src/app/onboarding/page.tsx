"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Moon, ArrowRight, ArrowLeft, User, Briefcase, Heart,
  Target, Sparkles, Check, Coffee, Book, Music, Code,
  Dumbbell, Camera, Palette, Globe, Users, Zap
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

// ── Step Types ──────────────────────────────────────────────────────────────

type PersonalityMode = "friend" | "mentor" | "listener" | "coach";

interface OnboardingData {
  name: string;
  age: string;
  gender: string;
  occupation: string;
  interests: string[];
  hobbies: string[];
  goals_summary: string;
  relationship_status: string;
  personality_mode: PersonalityMode;
  timezone: string;
}

// ── Static options ──────────────────────────────────────────────────────────

const INTEREST_OPTIONS = [
  { label: "Technology", icon: Code },
  { label: "Fitness", icon: Dumbbell },
  { label: "Music", icon: Music },
  { label: "Reading", icon: Book },
  { label: "Travel", icon: Globe },
  { label: "Photography", icon: Camera },
  { label: "Art & Design", icon: Palette },
  { label: "Coffee & Food", icon: Coffee },
  { label: "Social Impact", icon: Users },
  { label: "Science", icon: Sparkles },
  { label: "Entrepreneurship", icon: Zap },
  { label: "Wellness", icon: Heart },
];

const PERSONALITY_MODES: { mode: PersonalityMode; label: string; desc: string; emoji: string; gradient: string }[] = [
  { mode: "friend", label: "Friend", desc: "Warm, casual, and supportive. Talks like a close friend who listens.", emoji: "🤝", gradient: "from-pink-500 to-rose-500" },
  { mode: "mentor", label: "Mentor", desc: "Goal-focused and motivational. Helps you grow with honest perspective.", emoji: "🎯", gradient: "from-blue-500 to-cyan-500" },
  { mode: "listener", label: "Listener", desc: "Calm and patient. Creates a safe space for deep expression.", emoji: "🎧", gradient: "from-emerald-500 to-teal-500" },
  { mode: "coach", label: "Coach", desc: "Accountability-driven. Focused on productivity and habit building.", emoji: "⚡", gradient: "from-orange-500 to-amber-500" },
];

const STEPS = [
  { title: "Let's get to know you", subtitle: "Just the basics to start" },
  { title: "What do you do?", subtitle: "Your world shapes our conversations" },
  { title: "What lights you up?", subtitle: "Pick everything that resonates" },
  { title: "Where are you headed?", subtitle: "Your goals become NiteBuddy's north star" },
  { title: "Choose your companion style", subtitle: "You can change this anytime" },
];

// ── Component ───────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { userName, setOnboardingComplete } = useAuthStore();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: userName || "",
    age: "",
    gender: "",
    occupation: "",
    interests: [],
    hobbies: [],
    goals_summary: "",
    relationship_status: "",
    personality_mode: "friend",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const totalSteps = STEPS.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const toggleItem = (list: "interests" | "hobbies", item: string) => {
    setData((prev) => ({
      ...prev,
      [list]: prev[list].includes(item)
        ? prev[list].filter((i) => i !== item)
        : [...prev[list], item],
    }));
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await api.post("/profile/onboarding", {
        name: data.name,
        age: data.age ? parseInt(data.age) : null,
        gender: data.gender || null,
        occupation: data.occupation || null,
        interests: data.interests,
        hobbies: data.hobbies,
        goals_summary: data.goals_summary || null,
        relationship_status: data.relationship_status || null,
        personality_mode: data.personality_mode,
        timezone: data.timezone,
      });
      setOnboardingComplete();
      router.push("/chat");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return data.name.trim().length > 0;
    if (step === 1) return true;
    if (step === 2) return data.interests.length > 0;
    if (step === 3) return true;
    if (step === 4) return true;
    return true;
  };

  return (
    <div className="min-h-screen nb-hero-bg flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-15"
          style={{ background: "radial-gradient(circle, #6c63ff, transparent)" }} />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nb-accent to-nb-purple flex items-center justify-center">
              <Moon size={14} className="text-white" />
            </div>
            <span className="font-outfit font-bold text-lg nb-gradient-text">NiteBuddy</span>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-xs mx-auto">
            <div className="flex justify-between text-xs text-nb-text-muted mb-2">
              <span>Step {step + 1} of {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-nb-surface-3 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #6c63ff, #a855f7)" }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Step Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="nb-card p-8"
          >
            <h2 className="font-outfit text-3xl font-bold mb-1">{STEPS[step].title}</h2>
            <p className="text-nb-text-secondary mb-8">{STEPS[step].subtitle}</p>

            {/* Step 0: Basic info */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-nb-text-secondary mb-2">Your name *</label>
                  <input
                    id="onboard-name"
                    className="nb-input"
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    placeholder="What should NiteBuddy call you?"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-nb-text-secondary mb-2">Age (optional)</label>
                    <input
                      id="onboard-age"
                      className="nb-input"
                      type="number"
                      min="13"
                      max="120"
                      value={data.age}
                      onChange={(e) => setData({ ...data, age: e.target.value })}
                      placeholder="Your age"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-nb-text-secondary mb-2">Gender (optional)</label>
                    <select
                      id="onboard-gender"
                      className="nb-input"
                      value={data.gender}
                      onChange={(e) => setData({ ...data, gender: e.target.value })}
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-nb-text-secondary mb-2">Relationship status (optional)</label>
                  <select
                    id="onboard-relationship"
                    className="nb-input"
                    value={data.relationship_status}
                    onChange={(e) => setData({ ...data, relationship_status: e.target.value })}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="single">Single</option>
                    <option value="in_relationship">In a relationship</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 1: Occupation */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-nb-text-secondary mb-2">Occupation (optional)</label>
                  <div className="relative">
                    <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-nb-text-muted" />
                    <input
                      id="onboard-occupation"
                      className="nb-input-icon-left"
                      value={data.occupation}
                      onChange={(e) => setData({ ...data, occupation: e.target.value })}
                      placeholder="e.g. Software Engineer, Student, Designer..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {["Student", "Engineer", "Designer", "Entrepreneur", "Doctor", "Teacher", "Freelancer", "Manager", "Artist"].map((occ) => (
                    <button
                      key={occ}
                      type="button"
                      onClick={() => setData({ ...data, occupation: occ })}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all border ${
                        data.occupation === occ
                          ? "border-nb-accent bg-nb-accent-light text-nb-text-accent"
                          : "border-nb-border bg-nb-surface-2 text-nb-text-secondary hover:border-nb-border-2"
                      }`}
                    >
                      {occ}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Interests */}
            {step === 2 && (
              <div>
                <p className="text-nb-text-muted text-sm mb-4">Select all that apply — NiteBuddy will remember these.</p>
                <div className="grid grid-cols-3 gap-3">
                  {INTEREST_OPTIONS.map(({ label, icon: Icon }) => {
                    const selected = data.interests.includes(label);
                    return (
                      <motion.button
                        key={label}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleItem("interests", label)}
                        className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl text-sm font-medium transition-all border ${
                          selected
                            ? "border-nb-accent bg-nb-accent-light text-nb-text-accent"
                            : "border-nb-border bg-nb-surface-2 text-nb-text-secondary hover:border-nb-border-2"
                        }`}
                      >
                        <Icon size={20} className={selected ? "text-nb-accent" : "text-nb-text-muted"} />
                        <span className="text-xs">{label}</span>
                        {selected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-4 h-4 rounded-full bg-nb-accent flex items-center justify-center"
                          >
                            <Check size={10} className="text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Goals */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-nb-text-secondary mb-2">
                    What are you working towards? (optional)
                  </label>
                  <div className="relative">
                    <Target size={16} className="absolute left-4 top-4 text-nb-text-muted" />
                    <textarea
                      id="onboard-goals"
                      className="nb-input pl-11 min-h-[120px] resize-none"
                      value={data.goals_summary}
                      onChange={(e) => setData({ ...data, goals_summary: e.target.value })}
                      placeholder="e.g. Get promoted this year, run a 5K, learn Spanish, launch my startup, improve my work-life balance..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "Career growth", "Better fitness", "Learning new skills",
                    "Work-life balance", "Starting a business", "Mental wellness",
                    "Stronger relationships", "Financial freedom"
                  ].map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setData({ ...data, goals_summary: data.goals_summary ? `${data.goals_summary}, ${goal}` : goal })}
                      className="py-2.5 px-4 rounded-xl text-sm text-left border border-nb-border bg-nb-surface-2 text-nb-text-secondary hover:border-nb-accent hover:text-nb-text-accent transition-all"
                    >
                      + {goal}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Personality mode */}
            {step === 4 && (
              <div className="grid grid-cols-2 gap-4">
                {PERSONALITY_MODES.map((mode) => (
                  <motion.button
                    key={mode.mode}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setData({ ...data, personality_mode: mode.mode })}
                    className={`p-5 rounded-2xl text-left transition-all border ${
                      data.personality_mode === mode.mode
                        ? "border-nb-accent bg-nb-accent-light"
                        : "border-nb-border bg-nb-surface-2 hover:border-nb-border-2"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center text-xl mb-3`}>
                      {mode.emoji}
                    </div>
                    <h3 className="font-outfit font-bold text-base mb-1">{mode.label}</h3>
                    <p className="text-nb-text-muted text-xs leading-relaxed">{mode.desc}</p>
                    {data.personality_mode === mode.mode && (
                      <div className="mt-3 flex items-center gap-1.5 text-nb-text-accent text-xs font-medium">
                        <Check size={12} />
                        Selected
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="nb-btn-ghost flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {step < totalSteps - 1 ? (
            <button
              id={`onboard-next-${step}`}
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="nb-btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              id="onboard-finish"
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="nb-btn-primary flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={16} />
                  Meet NiteBuddy
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
