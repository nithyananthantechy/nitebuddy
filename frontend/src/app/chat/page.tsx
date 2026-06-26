"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Moon, LayoutDashboard, BookOpen, Target, User,
  Settings, LogOut, Sparkles, Menu, X, MessageSquare,
  TrendingUp, Heart, Plus, ChevronRight, Mic
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useChatStore } from "@/store/chat";
import { Sidebar } from "@/components/Sidebar";
import api from "@/lib/api";
import { format } from "date-fns";

// ── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  emotion_snapshot?: Record<string, number>;
  created_at: string;
}

interface EmotionState {
  happiness: number;
  sadness: number;
  anxiety: number;
  stress: number;
  motivation: number;
  loneliness: number;
  wellbeing_score: number;
}

const DEFAULT_EMOTIONS: EmotionState = {
  happiness: 50,
  motivation: 50,
  stress: 0,
  loneliness: 0,
  anxiety: 0,
  sadness: 0,
  wellbeing_score: 50,
};



// ── Emotion Panel Component ──────────────────────────────────────────────────

const EMOTION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  happiness: { label: "Happiness", color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
  motivation: { label: "Motivation", color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
  stress: { label: "Stress", color: "#f87171", bg: "rgba(248,113,113,0.15)" },
  loneliness: { label: "Loneliness", color: "#c084fc", bg: "rgba(192,132,252,0.15)" },
  anxiety: { label: "Anxiety", color: "#fb923c", bg: "rgba(251,146,60,0.15)" },
};

function EmotionPanel({ emotions }: { emotions: Partial<EmotionState> }) {
  const wellbeing = emotions.wellbeing_score ?? 50;
  const circumference = 2 * Math.PI * 32;
  const offset = circumference - (wellbeing / 100) * circumference;

  const getWellbeingColor = (score: number) => {
    if (score >= 70) return "#34d399";
    if (score >= 45) return "#fbbf24";
    return "#f87171";
  };

  return (
    <div className="w-72 border-l border-nb-border bg-nb-surface p-5 flex flex-col gap-5 overflow-y-auto">
      <div className="flex items-center gap-2">
        <Heart size={14} className="text-nb-purple" />
        <h3 className="font-outfit font-bold text-sm text-nb-text-primary">Emotional State</h3>
      </div>

      {/* Wellbeing Ring */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <svg width="88" height="88" className="-rotate-90">
            <circle cx="44" cy="44" r="32" className="nb-ring-track" />
            <motion.circle
              cx="44" cy="44" r="32"
              className="nb-ring-fill"
              stroke={getWellbeingColor(wellbeing)}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-outfit font-bold text-lg" style={{ color: getWellbeingColor(wellbeing) }}>
              {Math.round(wellbeing)}
            </span>
            <span className="text-nb-text-muted text-xs">/ 100</span>
          </div>
        </div>
        <p className="text-nb-text-secondary text-xs font-medium">Wellbeing Score</p>
      </div>

      {/* Emotion bars */}
      <div className="space-y-3">
        {Object.entries(EMOTION_CONFIG).map(([key, config]) => {
          const value = (emotions as any)[key] ?? 0;
          return (
            <div key={key}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-nb-text-secondary">{config.label}</span>
                <span className="text-xs font-medium" style={{ color: config.color }}>{Math.round(value)}</span>
              </div>
              <div className="nb-emotion-bar">
                <motion.div
                  className="nb-emotion-bar-fill"
                  style={{ background: config.color, width: `${value}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Note */}
      <p className="text-nb-text-muted text-xs leading-relaxed mt-auto pt-3 border-t border-nb-border">
        Scores inferred from your conversations — never from direct questions.
      </p>
    </div>
  );
}

// ── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-nb-accent to-nb-purple flex items-center justify-center flex-shrink-0">
        <Moon size={12} className="text-white" />
      </div>
      <div className="nb-bubble-ai flex items-center gap-1.5 py-3 px-4">
        <div className="nb-typing-dot" />
        <div className="nb-typing-dot" />
        <div className="nb-typing-dot" />
      </div>
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-end gap-3 mb-6 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nb-accent to-nb-purple flex items-center justify-center flex-shrink-0 mb-6 shadow-lg shadow-nb-accent/20 border border-white/10">
          <Moon size={14} className="text-white" />
        </div>
      )}
      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div className={isUser ? "nb-bubble-user" : "nb-bubble-ai"}>
          <p className="text-[15px] leading-[1.6] whitespace-pre-wrap font-medium">{message.content}</p>
        </div>
        <p className={`text-[11px] mt-2 font-medium tracking-wide ${isUser ? "text-nb-text-muted mr-1" : "text-nb-text-muted ml-1"}`}>
          {format(new Date(message.created_at), "h:mm a")}
        </p>
      </div>
    </motion.div>
  );
}

// ── Welcome Message ──────────────────────────────────────────────────────────

function WelcomeScreen({ name }: { name: string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const starters = [
    "Tell me about your day",
    "What's been on your mind lately?",
    "How did that thing go you were working on?",
    "What are you looking forward to this week?",
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "backOut" }}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-nb-accent to-nb-purple flex items-center justify-center mb-6 nb-pulse-glow"
      >
        <Moon size={36} className="text-white" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="font-outfit text-3xl font-bold mb-2">
          {greeting}, <span className="nb-gradient-text">{name}</span> 👋
        </h2>
        <p className="text-nb-text-secondary mb-8 max-w-md">
          I'm here and ready to listen. What's on your mind today?
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 gap-3 max-w-lg w-full"
      >
        {starters.map((s, i) => (
          <motion.button
            key={s}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="nb-card py-3 px-4 text-sm text-nb-text-secondary hover:text-nb-text-primary hover:border-nb-accent transition-all text-left rounded-xl"
            onClick={() => {
              const textarea = document.getElementById("chat-input") as HTMLTextAreaElement;
              if (textarea) { textarea.value = s; textarea.focus(); }
            }}
          >
            "{s}"
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

// ── Main Chat Page ────────────────────────────────────────────────────────────

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeConvId = searchParams.get("id");
  const isNewChat = searchParams.get("new");

  const { isAuthenticated, isHydrated, userName, accessToken } = useAuthStore();
  const setLastActiveConversationId = useChatStore((state) => state.setLastActiveConversationId);

  const [showEmotions, setShowEmotions] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [emotions, setEmotions] = useState<Partial<EmotionState>>(DEFAULT_EMOTIONS);
  const [streamingContent, setStreamingContent] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Sync conversation ID with chat store for persistence
  useEffect(() => {
    if (isHydrated) {
      setLastActiveConversationId(conversationId);
    }
  }, [conversationId, isHydrated, setLastActiveConversationId]);

  // Auth guard
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isHydrated, isAuthenticated, router]);

  // Load conversation history when activeConvId changes
  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;

    const loadHistory = async () => {
      if (activeConvId) {
        try {
          const res = await api.get(`/chat/history/${activeConvId}`);
          const data = res.data;
          setConversationId(activeConvId);
          
          // Map backend message schema to frontend Message type
          const formattedMessages = (data.messages || []).map((m: any) => ({
            id: m.id || crypto.randomUUID(),
            role: m.role,
            content: m.content,
            created_at: m.created_at,
            emotion_snapshot: m.emotion_snapshot,
          }));

          setMessages(formattedMessages);
          
          // Set emotions sidebar based on the last message's snapshot if available
          if (formattedMessages.length > 0) {
            const lastUserMsg = [...formattedMessages].reverse().find(m => m.role === "user");
            if (lastUserMsg && lastUserMsg.emotion_snapshot) {
              setEmotions({
                ...DEFAULT_EMOTIONS,
                ...lastUserMsg.emotion_snapshot,
              });
            } else {
              const lastMsg = formattedMessages[formattedMessages.length - 1];
              if (lastMsg.emotion_snapshot) {
                setEmotions({
                  ...DEFAULT_EMOTIONS,
                  ...lastMsg.emotion_snapshot,
                });
              } else {
                setEmotions(DEFAULT_EMOTIONS);
              }
            }
          } else {
            setEmotions(DEFAULT_EMOTIONS);
          }
        } catch (err) {
          console.error("Error loading chat history:", err);
        }
      } else {
        setConversationId(null);
        setMessages([]);
        setEmotions(DEFAULT_EMOTIONS);
      }
    };

    loadHistory();
  }, [activeConvId, isAuthenticated, isHydrated]);

  // Handle ?new=true query param
  useEffect(() => {
    if (isNewChat) {
      setConversationId(null);
      setMessages([]);
      setEmotions(DEFAULT_EMOTIONS);
      // Clear query params
      router.replace("/chat");
    }
  }, [isNewChat, router]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  const sendMessage = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || isStreaming) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsStreaming(true);
    setStreamingContent("");

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    abortRef.current = new AbortController();

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/v1/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content, conversation_id: conversationId }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";
      let newConvId = conversationId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n").filter(Boolean);

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === "conversation_id") {
              newConvId = data.conversation_id;
              setConversationId(data.conversation_id);
            } else if (data.type === "token") {
              aiContent += data.content;
              setStreamingContent(aiContent);
            } else if (data.type === "done") {
              if (data.emotion_snapshot) {
                setEmotions({
                  ...data.emotion_snapshot,
                  wellbeing_score: data.wellbeing_score,
                });
              }
            }
          } catch {}
        }
      }

      // Commit streamed message
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: aiContent,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setStreamingContent("");

    } catch (err: any) {
      if (err.name !== "AbortError") {
        const errMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I'm here with you — something went a bit sideways on my end. Want to try again?",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
        setStreamingContent("");
      }
    } finally {
      setIsStreaming(false);
    }
  }, [inputValue, isStreaming, conversationId, accessToken]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isHydrated || !isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-nb-deep">
      {/* Sidebar */}
      <Sidebar />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-14 border-b border-nb-border flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-nb-text-secondary font-medium">NiteBuddy</span>
            </div>
            {conversationId && (
              <span className="text-xs text-nb-text-muted bg-nb-surface-2 px-2 py-0.5 rounded-full">
                Active session
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="toggle-emotions"
              onClick={() => setShowEmotions(!showEmotions)}
              className={`nb-btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg ${showEmotions ? "text-nb-text-accent bg-nb-accent-light" : ""}`}
            >
              <Heart size={14} />
              Emotions
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {messages.length === 0 && !isStreaming ? (
            <WelcomeScreen name={userName || "there"} />
          ) : (
            <div className="max-w-3xl mx-auto">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {/* Streaming bubble */}
              {isStreaming && streamingContent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-end gap-2 mb-4"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-nb-accent to-nb-purple flex items-center justify-center flex-shrink-0 mb-1">
                    <Moon size={12} className="text-white" />
                  </div>
                  <div className="nb-bubble-ai">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{streamingContent}</p>
                  </div>
                </motion.div>
              )}

              {/* Typing indicator (before first token) */}
              {isStreaming && !streamingContent && <TypingIndicator />}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-nb-border/40 bg-nb-deep/80 backdrop-blur-xl px-6 py-5 flex-shrink-0 relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-3 bg-nb-surface/40 backdrop-blur-md border border-nb-border/60 rounded-[24px] px-5 py-4 focus-within:border-nb-accent/60 focus-within:shadow-[0_8px_32px_rgba(108,99,255,0.15)] transition-all duration-300 shadow-xl shadow-black/20">
              <textarea
                id="chat-input"
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Share what's on your mind... (Enter to send, Shift+Enter for new line)"
                className="flex-1 bg-transparent text-nb-text-primary text-[15px] resize-none outline-none placeholder:text-nb-text-muted max-h-40 leading-relaxed py-1"
                rows={1}
                disabled={isStreaming}
              />
              <div className="flex items-center gap-2 flex-shrink-0 mb-0.5">
                <button
                  id="voice-btn"
                  className="nb-btn-ghost p-2 rounded-xl text-nb-text-muted hover:text-nb-text-primary transition-colors"
                  title="Voice input (coming soon)"
                >
                  <Mic size={20} />
                </button>
                <motion.button
                  id="send-btn"
                  whileTap={{ scale: 0.92 }}
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isStreaming}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-nb-accent to-nb-purple flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-lg shadow-nb-accent/20"
                >
                  {isStreaming ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={16} className="text-white" />
                  )}
                </motion.button>
              </div>
            </div>
            <p className="text-center text-nb-text-muted text-xs mt-2 leading-relaxed">
              NiteBuddy is not a substitute for professional mental health care.<br/>
              © NiteBuddy. All rights reserved by NSK Groups.
            </p>
          </div>
        </div>
      </div>

      {/* Emotion Panel */}
      <AnimatePresence>
        {showEmotions && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <EmotionPanel emotions={emotions} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageContent />
    </Suspense>
  );
}
