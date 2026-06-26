"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  MessageSquare, TrendingUp, BookOpen, Target, User, Moon,
  ChevronRight, X, Plus, LogOut, Settings, MessageCircle
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useSidebarStore } from "@/store/sidebar";
import { useChatStore } from "@/store/chat";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Conversation {
  id: string;
  started_at: string;
  message_count: number;
  summary: string | null;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { collapsed, toggle } = useSidebarStore();
  const { userName, logout, isAuthenticated, isHydrated } = useAuthStore();
  const lastActiveConversationId = useChatStore((state) => state.lastActiveConversationId);
  const clearChatState = useChatStore((state) => state.clearChatState);
  const activeConvId = searchParams.get("id");

  // Fetch recent conversations
  const { data: convsData, refetch } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.get("/chat/conversations").then((r) => r.data),
    enabled: isHydrated && isAuthenticated,
  });

  const conversations: Conversation[] = convsData?.conversations || [];

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    clearChatState();
    logout();
    router.push("/");
  };

  const handleNewChat = () => {
    router.push("/chat?new=true");
  };

  // Refetch conversations when entering the chat page or when a new chat starts
  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      refetch();
    }
  }, [pathname, activeConvId, isHydrated, isAuthenticated, refetch]);

  const chatHref = lastActiveConversationId ? `/chat?id=${lastActiveConversationId}` : "/chat";

  const navItems = [
    { href: chatHref, icon: MessageSquare, label: "Chat" },
    { href: "/dashboard", icon: TrendingUp, label: "Dashboard" },
    { href: "/journal", icon: BookOpen, label: "Journal" },
    { href: "/goals", icon: Target, label: "Goals" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  // Hydration gate: render a skeleton matching placeholder until hydrated
  if (!isHydrated) {
    return (
      <div 
        className="nb-sidebar flex-shrink-0 border-r border-nb-border bg-nb-surface"
        style={{ width: collapsed ? 72 : 260 }}
      />
    );
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="nb-sidebar flex flex-col py-4 overflow-hidden flex-shrink-0 border-r border-nb-border bg-nb-surface"
    >
      {/* Logo + Toggle */}
      <div className="flex items-center justify-between px-4 mb-6">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#6c63ff] via-[#8b5cf6] to-[#ec4899] flex items-center justify-center flex-shrink-0 shadow-md shadow-[#6c63ff]/30 border border-white/20">
                <Moon size={13} className="text-white" />
              </div>
              <span className="font-outfit font-bold text-lg nb-gradient-text whitespace-nowrap">NiteBuddy</span>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#6c63ff] via-[#8b5cf6] to-[#ec4899] flex items-center justify-center mx-auto shadow-md shadow-[#6c63ff]/30 border border-white/20">
            <Moon size={13} className="text-white" />
          </div>
        )}
        <button
          onClick={toggle}
          className="ml-auto nb-btn-ghost p-2 rounded-lg"
        >
          {collapsed ? <ChevronRight size={16} /> : <X size={16} />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 mb-4">
        <button
          id="new-chat-btn"
          onClick={handleNewChat}
          className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl border border-nb-border bg-nb-surface-2 hover:bg-nb-surface-3 transition-all text-nb-text-secondary hover:text-nb-text-primary ${collapsed ? "justify-center" : ""}`}
        >
          <Plus size={16} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">New Chat</span>}
        </button>
      </div>

      {/* Nav Link Items */}
      <nav className="px-3 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              id={`nav-${label.toLowerCase()}`}
              className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-all group ${
                active
                  ? "bg-nb-accent-light text-nb-text-accent border border-nb-accent/20"
                  : "text-nb-text-secondary hover:bg-nb-surface-2 hover:text-nb-text-primary"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon size={18} className={`flex-shrink-0 ${active ? "text-nb-accent" : "group-hover:text-nb-text-primary"}`} />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
              {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-nb-accent" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Recent Chats Section */}
      {!collapsed && conversations.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0 mt-6 px-3">
          <div className="px-3 mb-2">
            <span className="text-[10px] font-bold text-nb-text-muted uppercase tracking-wider">Recent Conversations</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {conversations.map((conv) => {
              const active = activeConvId === conv.id;
              return (
                <Link
                  key={conv.id}
                  href={`/chat?id=${conv.id}`}
                  className={`flex items-center gap-2.5 py-2 px-3 rounded-lg text-xs transition-all ${
                    active
                      ? "bg-nb-surface-3 text-nb-text-primary font-medium border border-nb-border"
                      : "text-nb-text-secondary hover:bg-nb-surface-2 hover:text-nb-text-primary"
                  }`}
                >
                  <MessageCircle size={13} className={active ? "text-nb-accent" : "text-nb-text-muted"} />
                  <span className="truncate flex-1">
                    {conv.summary || `Conversation (${new Date(conv.started_at).toLocaleDateString()})`}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Spacing for collapsed or empty list */}
      {(collapsed || conversations.length === 0) && <div className="flex-1" />}

      {/* Bottom: User + Settings + Logout */}
      <div className="px-3 pt-4 border-t border-nb-border space-y-1">
        <Link
          href="/settings"
          id="nav-settings"
          className={`flex items-center gap-3 py-2 px-3 rounded-xl text-nb-text-secondary hover:bg-nb-surface-2 hover:text-nb-text-primary transition-all ${
            pathname === "/settings" ? "bg-nb-accent-light text-nb-text-accent" : ""
          } ${collapsed ? "justify-center" : ""}`}
        >
          <Settings size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
        </Link>

        <button
          id="logout-btn"
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl text-nb-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-all ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Log Out</span>}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-3 mt-2 border-t border-nb-border/40">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nb-accent to-nb-purple flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {userName?.[0]?.toUpperCase() || "N"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{userName || "User"}</p>
              <p className="text-[10px] text-nb-text-muted truncate">NiteBuddy member</p>
            </div>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="pt-3 pb-1 px-6 text-center">
          <p className="text-[9px] text-nb-text-muted">
            © NiteBuddy. All rights reserved by NSK Groups.
          </p>
        </div>
      )}
    </motion.aside>
  );
}
