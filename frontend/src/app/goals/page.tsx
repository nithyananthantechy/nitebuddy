"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Target, Plus, BookOpen, MessageSquare, TrendingUp,
  Check, Clock, Trash2, X, ChevronDown, ChevronUp,
  Briefcase, Dumbbell, Book, Heart, DollarSign, Zap, Star
} from "lucide-react";
import { format } from "date-fns";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Sidebar } from "@/components/Sidebar";

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; gradient: string }> = {
  career: { label: "Career", icon: Briefcase, gradient: "from-blue-500 to-cyan-600" },
  fitness: { label: "Fitness", icon: Dumbbell, gradient: "from-emerald-500 to-teal-600" },
  learning: { label: "Learning", icon: Book, gradient: "from-purple-500 to-violet-600" },
  relationship: { label: "Relationship", icon: Heart, gradient: "from-pink-500 to-rose-600" },
  personal: { label: "Personal", icon: Star, gradient: "from-amber-500 to-orange-600" },
  financial: { label: "Financial", icon: DollarSign, gradient: "from-green-500 to-emerald-600" },
  health: { label: "Health", icon: Zap, gradient: "from-red-500 to-pink-600" },
};

function GoalCard({ goal, onUpdate, onDelete }: { goal: any; onUpdate: (id: string, data: any) => void; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const config = CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG.personal;
  const Icon = config.icon;

  const statusColors: Record<string, string> = {
    active: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    completed: "text-blue-400 bg-blue-400/10 border-blue-400/30",
    paused: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    abandoned: "text-red-400 bg-red-400/10 border-red-400/30",
  };
  const statusColor = statusColors[goal.status as string] || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="nb-card p-5 nb-card-hover"
    >
      <div className="flex items-start gap-4">
        {/* Category icon */}
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className="text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-outfit font-bold text-base leading-tight">{goal.title}</h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`nb-badge border text-xs ${statusColor}`}>
                {goal.status}
              </span>
              <button
                onClick={() => onDelete(goal.id)}
                className="text-nb-text-muted hover:text-red-400 transition-colors p-1 rounded"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-nb-text-muted">{Math.round(goal.progress_pct)}% complete</span>
              {goal.target_date && (
                <span className="text-xs text-nb-text-muted flex items-center gap-1">
                  <Clock size={11} />
                  {format(new Date(goal.target_date), "MMM d, yyyy")}
                </span>
              )}
            </div>
            <div className="h-2 bg-nb-surface-3 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, #6c63ff, #a855f7)` }}
                initial={{ width: 0 }}
                animate={{ width: `${goal.progress_pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Quick progress update */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-nb-text-muted hover:text-nb-text-secondary transition-colors flex items-center gap-1"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? "Hide" : "Update Progress"}
            </button>

            {goal.status === "active" && goal.progress_pct >= 100 && (
              <button
                onClick={() => onUpdate(goal.id, { status: "completed" })}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Check size={12} />
                Mark Complete
              </button>
            )}
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    defaultValue={goal.progress_pct}
                    className="flex-1 accent-nb-accent"
                    onChange={(e) => onUpdate(goal.id, { progress_pct: Number(e.target.value) })}
                  />
                  <span className="text-xs text-nb-text-secondary w-10 text-right">
                    {Math.round(goal.progress_pct)}%
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function CreateGoalModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    category: "personal",
    title: "",
    description: "",
    target_date: "",
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.post("/goals/", data).then((r) => r.data),
    onSuccess: () => { onCreated(); onClose(); },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="nb-card p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-outfit font-bold text-xl">New Goal</h2>
          <button onClick={onClose} className="text-nb-text-muted hover:text-nb-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
          <div>
            <label className="block text-sm text-nb-text-secondary mb-2">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, category: key })}
                  className={`p-2 rounded-xl flex flex-col items-center gap-1 text-xs border transition-all ${
                    form.category === key
                      ? "border-nb-accent bg-nb-accent-light text-nb-text-accent"
                      : "border-nb-border bg-nb-surface-2 text-nb-text-muted hover:border-nb-border-2"
                  }`}
                >
                  <cfg.icon size={16} />
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-nb-text-secondary mb-2">Goal title *</label>
            <input
              id="goal-title"
              className="nb-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What do you want to achieve?"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-nb-text-secondary mb-2">Description (optional)</label>
            <textarea
              id="goal-description"
              className="nb-input resize-none min-h-[80px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="More details about this goal..."
            />
          </div>

          <div>
            <label className="block text-sm text-nb-text-secondary mb-2">Target date (optional)</label>
            <input
              id="goal-date"
              type="date"
              className="nb-input"
              value={form.target_date}
              onChange={(e) => setForm({ ...form, target_date: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="nb-btn-secondary flex-1">Cancel</button>
            <button
              id="create-goal-submit"
              type="submit"
              disabled={!form.title || mutation.isPending}
              className="nb-btn-primary flex-1 disabled:opacity-50"
            >
              {mutation.isPending ? "Creating..." : "Create Goal"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function GoalsPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isHydrated, isAuthenticated, router]);

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => api.get("/goals/").then((r) => r.data),
    enabled: isAuthenticated && isHydrated,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/goals/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/goals/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  const filtered = goals.filter((g: any) => filter === "all" || g.status === filter);
  const activeCount = goals.filter((g: any) => g.status === "active").length;
  const completedCount = goals.filter((g: any) => g.status === "completed").length;

  if (!isHydrated || !isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-nb-deep">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="font-outfit text-4xl font-bold mb-1">
                Your <span className="nb-gradient-text">Goals</span>
              </h1>
              <p className="text-nb-text-secondary">
                {activeCount} active · {completedCount} completed
              </p>
            </motion.div>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              id="new-goal-btn"
              onClick={() => setShowModal(true)}
              className="nb-btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              New Goal
            </motion.button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-6">
            {(["all", "active", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize border ${
                  filter === f
                    ? "bg-nb-accent-light text-nb-text-accent border-nb-accent/30"
                    : "border-nb-border text-nb-text-secondary hover:border-nb-border-2"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Goals list */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="nb-card p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-nb-surface-3" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-nb-surface-3 rounded w-1/2" />
                      <div className="h-2 bg-nb-surface-3 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="nb-card p-12 text-center">
              <Target size={40} className="text-nb-text-muted mx-auto mb-4" />
              <h3 className="font-outfit font-bold text-lg mb-2">No goals yet</h3>
              <p className="text-nb-text-secondary mb-6 text-sm">
                Set your first goal and NiteBuddy will reference it during your conversations.
              </p>
              <button
                id="first-goal-btn"
                onClick={() => setShowModal(true)}
                className="nb-btn-primary inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Create your first goal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((goal: any) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onUpdate={(id, data) => updateMutation.mutate({ id, data })}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <CreateGoalModal
            onClose={() => setShowModal(false)}
            onCreated={() => queryClient.invalidateQueries({ queryKey: ["goals"] })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
