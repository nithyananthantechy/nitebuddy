"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Briefcase, Heart, Target, Sparkles, Check, Save } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Sidebar } from "@/components/Sidebar";

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isHydrated } = useAuthStore();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    occupation: "",
    relationship_status: "",
    interests: [] as string[],
    hobbies: [] as string[],
    goals_summary: "",
  });

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isHydrated, isAuthenticated, router]);

  // Fetch current profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get("/profile/me").then((r) => r.data),
    enabled: isAuthenticated && isHydrated,
  });

  // Populate form when data is loaded
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        age: profile.age ? String(profile.age) : "",
        gender: profile.gender || "",
        occupation: profile.occupation || "",
        relationship_status: profile.relationship_status || "",
        interests: profile.interests || [],
        hobbies: profile.hobbies || [],
        goals_summary: profile.goals_summary || "",
      });
    }
  }, [profile]);

  // Mutation to update profile
  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put("/profile/me", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: form.name,
      age: form.age ? parseInt(form.age) : null,
      gender: form.gender || null,
      occupation: form.occupation || null,
      relationship_status: form.relationship_status || null,
      interests: form.interests,
      hobbies: form.hobbies,
      goals_summary: form.goals_summary || null,
    });
  };

  const handleInterestToggle = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  if (!isHydrated || !isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-nb-deep text-nb-text-secondary">
        <div className="w-8 h-8 border-2 border-nb-accent/30 border-t-nb-accent rounded-full animate-spin" />
      </div>
    );
  }

  const INTEREST_OPTIONS = [
    "Technology", "Fitness", "Music", "Reading", "Travel",
    "Photography", "Art & Design", "Coffee & Food", "Social Impact",
    "Science", "Entrepreneurship", "Wellness"
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-nb-deep">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="font-outfit text-4xl font-bold mb-1">
              Your <span className="nb-gradient-text">Profile</span>
            </h1>
            <p className="text-nb-text-secondary">
              Personalize the baseline facts NiteBuddy remembers about you
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6 pb-12">
            <div className="nb-card p-6 space-y-5">
              <h2 className="font-outfit font-bold text-lg border-b border-nb-border pb-3 flex items-center gap-2">
                <User size={18} className="text-nb-accent" /> Basic Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-nb-text-muted mb-2 uppercase tracking-wider">Name</label>
                  <input
                    type="text"
                    className="nb-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-nb-text-muted mb-2 uppercase tracking-wider">Age</label>
                  <input
                    type="number"
                    min="13"
                    max="120"
                    className="nb-input"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-nb-text-muted mb-2 uppercase tracking-wider">Gender</label>
                  <select
                    className="nb-input"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-nb-text-muted mb-2 uppercase tracking-wider">Relationship Status</label>
                  <select
                    className="nb-input"
                    value={form.relationship_status}
                    onChange={(e) => setForm({ ...form, relationship_status: e.target.value })}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="single">Single</option>
                    <option value="in_relationship">In a relationship</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="nb-card p-6 space-y-5">
              <h2 className="font-outfit font-bold text-lg border-b border-nb-border pb-3 flex items-center gap-2">
                <Briefcase size={18} className="text-nb-purple" /> Work & Goals
              </h2>
              <div>
                <label className="block text-xs font-semibold text-nb-text-muted mb-2 uppercase tracking-wider">Occupation</label>
                <input
                  type="text"
                  className="nb-input"
                  placeholder="e.g. Student, Designer, Developer..."
                  value={form.occupation}
                  onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-nb-text-muted mb-2 uppercase tracking-wider">What are you working towards?</label>
                <textarea
                  className="nb-input min-h-[100px] py-3 resize-none"
                  placeholder="Summarize your main goals..."
                  value={form.goals_summary}
                  onChange={(e) => setForm({ ...form, goals_summary: e.target.value })}
                />
              </div>
            </div>

            <div className="nb-card p-6 space-y-5">
              <h2 className="font-outfit font-bold text-lg border-b border-nb-border pb-3 flex items-center gap-2">
                <Sparkles size={18} className="text-nb-teal" /> Interests
              </h2>
              <div className="grid grid-cols-3 gap-2.5">
                {INTEREST_OPTIONS.map((interest) => {
                  const selected = form.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                        selected
                          ? "border-nb-accent bg-nb-accent-light text-nb-text-accent"
                          : "border-nb-border bg-nb-surface-2 text-nb-text-secondary hover:border-nb-border-2"
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
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
                    <Check size={16} /> Saved successfully!
                  </motion.span>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="nb-btn-primary px-6 flex items-center gap-2"
              >
                {updateMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={16} /> Save Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
