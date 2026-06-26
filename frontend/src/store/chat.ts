import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ChatState {
  lastActiveConversationId: string | null;
  setLastActiveConversationId: (id: string | null) => void;
  clearChatState: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      lastActiveConversationId: null,
      setLastActiveConversationId: (id) => set({ lastActiveConversationId: id }),
      clearChatState: () => set({ lastActiveConversationId: null }),
    }),
    {
      name: "nitebuddy-chat",
    }
  )
);
