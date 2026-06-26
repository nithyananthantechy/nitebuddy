"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, TrendingDown, Minus, MessageSquare,
  Target, BookOpen, Flame, Heart, Sparkles, Award
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, Legend
} from "recharts";
import { format } from "date-fns";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Sidebar } from "@/components/Sidebar";

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  title, value, subtitle, icon: Icon, gradient, delay = 0
}: {
  title: string; value: string | number; subtitle?: string;
  icon: any; gradient: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="nb-card p-6 nb-card-hover"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-nb-text-muted text-sm mb-1">{title}</p>
          <p className="font-outfit font-bold text-3xl text-nb-text-primary">{value}</p>
          {subtitle && <p className="text-nb-text-muted text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
}

// ── Trend Icon ────────────────────────────────────────────────────────────────

function TrendIndicator({ trend }: { trend: string }) {
  if (trend === "improving") return (
    <span className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
      <TrendingUp size={14} /> Improving
    </span>
  );
  if (trend === "declining") return (
    <span className="flex items-center gap-1 text-red-400 text-sm font-medium">
      <TrendingDown size={14} /> Needs attention
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-nb-text-muted text-sm font-medium">
      <Minus size={14} /> Stable
    </span>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="nb-card p-3 border border-nb-border-2 text-xs min-w-[140px]">
      <p className="text-nb-text-muted mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4 mb-1">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-nb-text-primary font-medium">{Math.round(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, userName } = useAuthStore();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isHydrated, isAuthenticated, router]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get("/dashboard/stats").then((r) => r.data),
    enabled: isAuthenticated && isHydrated,
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ["emotion-trends", "weekly"],
    queryFn: () => api.get("/emotion/trends?period=weekly").then((r) => r.data),
    enabled: isAuthenticated && isHydrated,
  });

  const trendData = trends?.data?.map((d: any) => ({
    time: format(new Date(d.date), "EEE HH:mm"),
    Wellbeing: Math.round(d.wellbeing_score),
    Happiness: Math.round(d.happiness),
    Stress: Math.round(d.stress),
    Motivation: Math.round(d.motivation),
  })) || [];

  if (!isHydrated || !isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-nb-deep">
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-outfit text-4xl font-bold mb-1">
              Your{" "}
              <span className="nb-gradient-text">emotional journey</span>
            </h1>
            <p className="text-nb-text-secondary">
              Insights from your conversations with NiteBuddy
            </p>
          </motion.div>

          {/* Stats Grid */}
          {!statsLoading && stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Wellbeing Score"
                value={`${stats.avg_wellbeing_score}/100`}
                subtitle={stats.wellbeing_trend}
                icon={Heart}
                gradient="from-pink-500 to-rose-600"
                delay={0}
              />
              <StatCard
                title="Days Active"
                value={stats.days_active}
                subtitle="Streak building"
                icon={Flame}
                gradient="from-orange-500 to-amber-600"
                delay={0.1}
              />
              <StatCard
                title="Conversations"
                value={stats.total_conversations}
                subtitle={`${stats.total_messages} messages total`}
                icon={MessageSquare}
                gradient="from-blue-500 to-cyan-600"
                delay={0.2}
              />
              <StatCard
                title="Active Goals"
                value={stats.active_goals_count}
                subtitle={`${stats.completed_goals_count} completed`}
                icon={Target}
                gradient="from-emerald-500 to-teal-600"
                delay={0.3}
              />
            </div>
          )}

          {statsLoading && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="nb-card p-6 animate-pulse">
                  <div className="h-4 bg-nb-surface-3 rounded w-2/3 mb-3" />
                  <div className="h-8 bg-nb-surface-3 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Charts Row */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Wellbeing Trend Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2 nb-card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-outfit font-bold text-lg">Emotional Trends</h3>
                  <p className="text-nb-text-muted text-sm">Last 7 days</p>
                </div>
                {stats && <TrendIndicator trend={stats.wellbeing_trend} />}
              </div>

              {trendsLoading ? (
                <div className="h-48 bg-nb-surface-2 rounded-xl animate-pulse" />
              ) : trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="wellbeingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
                    <XAxis dataKey="time" tick={{ fill: "#4a556e", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#4a556e", fontSize: 11 }} domain={[0, 100]} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Wellbeing" stroke="#6c63ff" strokeWidth={2} fill="url(#wellbeingGrad)" name="Wellbeing" dot={false} />
                    <Area type="monotone" dataKey="Stress" stroke="#f87171" strokeWidth={1.5} fill="url(#stressGrad)" name="Stress" dot={false} />
                    <Area type="monotone" dataKey="Motivation" stroke="#60a5fa" strokeWidth={1.5} fill="none" name="Motivation" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare size={32} className="text-nb-text-muted mx-auto mb-2" />
                    <p className="text-nb-text-muted text-sm">Start chatting to see your trends</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Top Emotions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="nb-card p-6"
            >
              <h3 className="font-outfit font-bold text-lg mb-4">This Week</h3>
              {stats?.top_emotions && Object.keys(stats.top_emotions).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(stats.top_emotions as Record<string, number>).map(([emotion, value]) => {
                    const colors: Record<string, string> = {
                      happiness: "#fbbf24",
                      stress: "#f87171",
                      motivation: "#60a5fa",
                      loneliness: "#c084fc",
                      anxiety: "#fb923c",
                    };
                    const color = colors[emotion] || "#6c63ff";
                    return (
                      <div key={emotion}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm text-nb-text-secondary capitalize">{emotion}</span>
                          <span className="text-sm font-bold" style={{ color }}>{Math.round(value)}</span>
                        </div>
                        <div className="nb-emotion-bar">
                          <motion.div
                            className="nb-emotion-bar-fill"
                            style={{ background: color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-nb-text-muted text-sm">No data yet — start chatting!</p>
              )}
            </motion.div>
          </div>

          {/* Recent Achievements */}
          {stats?.recent_achievements?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="nb-card p-6 mb-8"
            >
              <div className="flex items-center gap-2 mb-5">
                <Award size={18} className="text-nb-emotion-happy" />
                <h3 className="font-outfit font-bold text-lg">Recent Achievements</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {stats.recent_achievements.map((ach: any, i: number) => (
                  <div key={i} className="bg-nb-surface-2 border border-nb-border rounded-xl p-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nb-emotion-happy to-orange-500 flex items-center justify-center mb-3">
                      <Award size={16} className="text-white" />
                    </div>
                    <h4 className="font-medium text-sm mb-1">{ach.title}</h4>
                    <p className="text-nb-text-muted text-xs">{ach.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Wellbeing insight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="nb-card p-6 relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-48 h-48 opacity-10"
              style={{ background: "radial-gradient(circle, #6c63ff, transparent)" }} />
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nb-accent to-nb-purple flex items-center justify-center flex-shrink-0">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-outfit font-bold text-lg mb-1">NiteBuddy's Insight</h3>
                {stats ? (
                  <p className="text-nb-text-secondary text-sm leading-relaxed">
                    {stats.avg_wellbeing_score >= 70
                      ? `You've been doing well this week, ${userName}. Your wellbeing score of ${stats.avg_wellbeing_score} reflects positive patterns in your conversations. Keep going.`
                      : stats.avg_wellbeing_score >= 45
                      ? `Your wellbeing has been around ${stats.avg_wellbeing_score} this week, ${userName}. There's room to grow — let's talk about what's been weighing on you.`
                      : `${userName}, I've noticed you've been carrying something heavy lately. Your wellbeing score is ${stats.avg_wellbeing_score}. You don't have to navigate this alone.`}
                  </p>
                ) : (
                  <p className="text-nb-text-secondary text-sm">Start chatting to receive personalized insights.</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
