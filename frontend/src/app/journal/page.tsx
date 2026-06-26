"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, MessageSquare, TrendingUp, Target, Calendar, Sparkles, Heart } from "lucide-react";
import { format } from "date-fns";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Sidebar } from "@/components/Sidebar";

function JournalCard({ entry, delay }: { entry: any; delay: number }) {
  const emotionEmoji = (score: number) =>
    score >= 70 ? "😊" : score >= 45 ? "😐" : "😔";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="nb-card p-6 nb-card-hover"
    >
      {/* Date + Wellbeing */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-nb-text-muted" />
          <span className="text-nb-text-muted text-sm font-medium">
            {format(new Date(entry.entry_date), "EEEE, MMMM d, yyyy")}
          </span>
        </div>
        {entry.emotion_summary?.wellbeing_score && (
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{emotionEmoji(entry.emotion_summary.wellbeing_score)}</span>
            <span className="text-xs text-nb-text-muted">
              {Math.round(entry.emotion_summary.wellbeing_score)}/100
            </span>
          </div>
        )}
      </div>

      {/* Highlights */}
      {entry.highlights && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={13} className="text-nb-emotion-happy" />
            <span className="text-xs font-semibold text-nb-text-secondary uppercase tracking-wide">Highlights</span>
          </div>
          <p className="text-nb-text-primary text-sm leading-relaxed">{entry.highlights}</p>
        </div>
      )}

      {/* Achievements */}
      {entry.achievements && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={13} className="text-emerald-400" />
            <span className="text-xs font-semibold text-nb-text-secondary uppercase tracking-wide">Achievements</span>
          </div>
          <p className="text-nb-text-primary text-sm leading-relaxed">{entry.achievements}</p>
        </div>
      )}

      {/* Emotional Changes */}
      {entry.emotional_changes && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={13} className="text-nb-purple" />
            <span className="text-xs font-semibold text-nb-text-secondary uppercase tracking-wide">Emotional Shifts</span>
          </div>
          <p className="text-nb-text-secondary text-sm leading-relaxed">{entry.emotional_changes}</p>
        </div>
      )}

      {/* Reflection */}
      {entry.reflection_notes && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={13} className="text-nb-teal" />
            <span className="text-xs font-semibold text-nb-text-secondary uppercase tracking-wide">Reflection</span>
          </div>
          <p className="text-nb-text-secondary text-sm leading-relaxed italic">"{entry.reflection_notes}"</p>
        </div>
      )}

      {/* Growth Insights */}
      {entry.growth_insights && (
        <div className="pt-4 border-t border-nb-border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={13} className="text-nb-accent" />
            <span className="text-xs font-semibold text-nb-text-accent uppercase tracking-wide">Growth Insight</span>
          </div>
          <p className="text-nb-text-accent text-sm leading-relaxed">{entry.growth_insights}</p>
        </div>
      )}
    </motion.div>
  );
}

export default function JournalPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isHydrated, isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["journal-entries"],
    queryFn: () => api.get("/journal/list").then((r) => r.data),
    enabled: isAuthenticated && isHydrated,
  });

  const entries = data?.entries || [];

  if (!isHydrated || !isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-nb-deep">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="font-outfit text-4xl font-bold mb-1">
              Your <span className="nb-gradient-text">Journal</span>
            </h1>
            <p className="text-nb-text-secondary">
              Auto-generated from your conversations — your emotional story, written by you.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="nb-card p-6 animate-pulse">
                  <div className="h-4 bg-nb-surface-3 rounded w-1/3 mb-4" />
                  <div className="space-y-2">
                    <div className="h-3 bg-nb-surface-3 rounded w-full" />
                    <div className="h-3 bg-nb-surface-3 rounded w-4/5" />
                    <div className="h-3 bg-nb-surface-3 rounded w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="nb-card p-16 text-center"
            >
              <BookOpen size={48} className="text-nb-text-muted mx-auto mb-4" />
              <h3 className="font-outfit font-bold text-xl mb-2">Your journal is waiting</h3>
              <p className="text-nb-text-secondary mb-6">
                Journal entries are automatically generated from your conversations.
                Start chatting with NiteBuddy, and your first entry will appear here.
              </p>
              <a href="/chat" className="nb-btn-primary inline-flex items-center gap-2">
                Start a conversation
              </a>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {entries.map((entry: any, i: number) => (
                <JournalCard key={entry.id} entry={entry} delay={i * 0.1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
