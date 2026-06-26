"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Brain, Heart, MessageCircle, Sparkles, Shield, TrendingUp,
  Star, ArrowRight, Moon, Users, Target, Zap
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "Understands You",
    desc: "Infers your emotional state from language patterns — never asks 'how are you feeling?'",
    gradient: "from-violet-500 to-purple-600",
    glow: "rgba(139,92,246,0.3)",
  },
  {
    icon: Heart,
    title: "Remembers Everything",
    desc: "5 layers of memory — your goals, relationships, feelings, and conversations persist forever.",
    gradient: "from-pink-500 to-rose-600",
    glow: "rgba(236,72,153,0.3)",
  },
  {
    icon: MessageCircle,
    title: "Genuinely Companion",
    desc: "Celebrates your wins, follows up on your goals, and references past conversations naturally.",
    gradient: "from-blue-500 to-cyan-600",
    glow: "rgba(59,130,246,0.3)",
  },
  {
    icon: TrendingUp,
    title: "Emotional Dashboard",
    desc: "Track mood trends, stress levels, and emotional health with beautiful analytics.",
    gradient: "from-emerald-500 to-teal-600",
    glow: "rgba(16,185,129,0.3)",
  },
  {
    icon: Shield,
    title: "Privacy-First Safety",
    desc: "Crisis detection with WHO safe messaging guidelines. Your data stays yours.",
    gradient: "from-orange-500 to-amber-600",
    glow: "rgba(249,115,22,0.3)",
  },
  {
    icon: Sparkles,
    title: "4 Personality Modes",
    desc: "Choose your companion: Friend, Mentor, Listener, or Coach — switch anytime.",
    gradient: "from-indigo-500 to-violet-600",
    glow: "rgba(99,102,241,0.3)",
  },
];

const PERSONAS = [
  { icon: Users, label: "Students", desc: "Academic stress & motivation" },
  { icon: Target, label: "Professionals", desc: "Burnout & career support" },
  { icon: Zap, label: "Entrepreneurs", desc: "Decision fatigue & accountability" },
  { icon: Moon, label: "Remote Workers", desc: "Social isolation support" },
];

const TESTIMONIALS = [
  {
    text: "It remembered I had a job interview three weeks ago and asked how it went. No other app has ever done that.",
    name: "Priya K.",
    role: "Software Engineer",
    avatar: "P",
  },
  {
    text: "I said 'I'm fine' but NiteBuddy picked up that I wasn't. It gently pivoted the conversation. I felt truly heard.",
    name: "Marcus T.",
    role: "Entrepreneur",
    avatar: "M",
  },
  {
    text: "The emotional dashboard showed me I was consistently stressed on Sunday evenings. That pattern changed everything.",
    name: "Sofia R.",
    role: "PhD Student",
    avatar: "S",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen nb-hero-bg overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-nb-deep/80 backdrop-blur-xl border-b border-nb-border/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6c63ff] via-[#8b5cf6] to-[#ec4899] flex items-center justify-center shadow-lg shadow-[#6c63ff]/30 border border-white/20">
              <Moon size={16} className="text-white" />
            </div>
            <span className="font-outfit font-bold text-xl nb-gradient-text">NiteBuddy</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden md:flex items-center gap-8"
          >
            {["Features", "How it Works", "Testimonials"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-nb-text-secondary hover:text-nb-text-primary transition-colors text-sm font-medium"
              >
                {item}
              </a>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <Link href="/auth/login" className="nb-btn-ghost text-sm">
              Sign In
            </Link>
            <Link href="/auth/register" className="nb-btn-primary text-sm px-5 py-2.5">
              Get Started Free
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-10 overflow-hidden">
        {/* Ambient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(108,99,255,0.2) 0%, transparent 70%)" }}
          />
          <motion.div
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)" }}
          />
        </div>

        <motion.div
          className="text-center max-w-5xl mx-auto relative z-10 flex-1 flex flex-col justify-center mt-10"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 nb-badge nb-badge-accent mb-8"
          >
            <Sparkles size={12} />
            Emotionally Intelligent AI Companion
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="font-outfit text-6xl md:text-8xl font-bold leading-none mb-6"
          >
            Most AI assistants
            <br />
            <span className="nb-gradient-text">answer questions.</span>
            <br />
            <span className="text-nb-text-primary">NiteBuddy</span>
            <br />
            <span className="nb-gradient-text">understands you.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-nb-text-secondary text-xl md:text-2xl max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            An AI companion that infers your emotional state through language patterns,
            remembers your life story, and provides meaningful companionship — without ever asking
            <em className="text-nb-text-accent"> "how are you feeling?"</em>
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/auth/register"
              id="hero-cta-primary"
              className="nb-btn-primary flex items-center gap-2 text-base px-8 py-4 nb-pulse-glow"
            >
              Start Your Journey
              <ArrowRight size={18} />
            </Link>
            <Link
              href="#features"
              id="hero-cta-secondary"
              className="nb-btn-secondary flex items-center gap-2 text-base"
            >
              See How It Works
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-12 flex items-center justify-center gap-6 text-nb-text-muted text-sm"
          >
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="text-nb-emotion-happy fill-nb-emotion-happy" />
                ))}
              </div>
              <span>4.9/5 rating</span>
            </div>
            <span>·</span>
            <span>Free to get started</span>
            <span>·</span>
            <span>No credit card required</span>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="relative z-10 flex flex-col items-center gap-2 mt-8"
        >
          <span className="text-nb-text-muted text-xs">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border border-nb-border flex items-start justify-center p-1"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-nb-accent" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 nb-badge nb-badge-accent mb-6">
              <Sparkles size={12} />
              Core Capabilities
            </div>
            <h2 className="font-outfit text-5xl md:text-6xl font-bold mb-6">
              Built to truly{" "}
              <span className="nb-gradient-text">understand people</span>
            </h2>
            <p className="text-nb-text-secondary text-xl max-w-2xl mx-auto">
              Every feature is designed around one core mission: understanding you deeply,
              not just processing your words.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="nb-card p-6 nb-card-hover group cursor-default"
                style={{
                  boxShadow: `0 0 0 rgba(0,0,0,0)`,
                  transition: "box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 8px 32px ${feature.glow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 0 rgba(0,0,0,0)";
                }}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon size={22} className="text-white" />
                </div>
                <h3 className="font-outfit font-bold text-lg mb-2 text-nb-text-primary">
                  {feature.title}
                </h3>
                <p className="text-nb-text-secondary text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent, rgba(108,99,255,0.03) 50%, transparent)" }} />
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-outfit text-5xl font-bold mb-4">
              For everyone who needs to feel{" "}
              <span className="nb-gradient-text">understood</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PERSONAS.map((p, i) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="nb-card p-6 text-center nb-card-hover"
              >
                <div className="w-12 h-12 rounded-full mx-auto mb-3 bg-nb-accent-light flex items-center justify-center">
                  <p.icon size={22} className="text-nb-text-accent" />
                </div>
                <h3 className="font-outfit font-bold text-base mb-1">{p.label}</h3>
                <p className="text-nb-text-muted text-xs">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="font-outfit text-5xl md:text-6xl font-bold mb-6">
              How NiteBuddy <span className="nb-gradient-text">thinks</span>
            </h2>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                step: "01",
                title: "You talk. NiteBuddy listens — deeply.",
                desc: "Every message is analyzed for emotional signals — explicit and hidden. When you say 'I'm fine' after a rough week, NiteBuddy notices the subtle shift in your language.",
              },
              {
                step: "02",
                title: "5 memory layers capture your life.",
                desc: "Profile, relationships, goals, emotional events, and conversations — all stored and retrieved semantically. NiteBuddy connects the dots across weeks and months.",
              },
              {
                step: "03",
                title: "Context-aware, never generic.",
                desc: "Your response is crafted with your full emotional context, memory, and personality mode in mind. No scripted empathy. No repetitive phrases. Just genuine understanding.",
              },
              {
                step: "04",
                title: "Your emotional journey, visualized.",
                desc: "Track mood trends, wellbeing scores, and behavioral patterns on your dashboard. Auto-generated journals capture your growth.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="nb-card p-8 flex gap-6 items-start nb-card-hover"
              >
                <div className="w-12 h-12 rounded-xl bg-nb-accent-light flex items-center justify-center flex-shrink-0">
                  <span className="font-outfit font-bold text-nb-text-accent text-sm">{item.step}</span>
                </div>
                <div>
                  <h3 className="font-outfit font-bold text-xl mb-2">{item.title}</h3>
                  <p className="text-nb-text-secondary leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-outfit text-5xl font-bold mb-4">
              People who feel <span className="nb-gradient-text">understood</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="nb-card p-6 nb-card-hover"
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} className="text-nb-emotion-happy fill-nb-emotion-happy" />
                  ))}
                </div>
                <p className="text-nb-text-secondary leading-relaxed mb-6 text-sm">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nb-accent to-nb-purple flex items-center justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-nb-text-muted text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="nb-card p-16 relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-30" style={{ background: "var(--nb-gradient-glow)" }} />
            <div className="relative z-10">
              <h2 className="font-outfit text-5xl font-bold mb-6">
                Ready to be{" "}
                <span className="nb-gradient-text">truly understood?</span>
              </h2>
              <p className="text-nb-text-secondary text-xl mb-10">
                Start your journey with NiteBuddy today. Free to begin, no credit card required.
              </p>
              <Link
                href="/auth/register"
                id="footer-cta"
                className="nb-btn-primary inline-flex items-center gap-2 text-lg px-10 py-4"
              >
                Begin Your Journey
                <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-nb-border py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#6c63ff] via-[#8b5cf6] to-[#ec4899] flex items-center justify-center shadow-md shadow-[#6c63ff]/30 border border-white/20">
              <Moon size={14} className="text-white" />
            </div>
            <span className="font-outfit font-bold nb-gradient-text">NiteBuddy</span>
          </div>
          <p className="text-nb-text-muted text-sm text-center">
            NiteBuddy is not a substitute for professional mental health care.
            If you're in crisis, please reach out to a professional.
          </p>
          <p className="text-nb-text-muted text-sm">© NiteBuddy. All rights reserved by NSK Groups.</p>
        </div>
      </footer>
    </main>
  );
}
