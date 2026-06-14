import type { SourceType } from "@/feature/knowledge/types";

export interface PendingCapture {
  id: string;
  chatId: number;
  content: string;
  title: string;
  tldr: string[];
  tags: string[];
  sourceType: SourceType;
  sourceUrl?: string;
  inAskMode: boolean;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  // Reflection mode: set after note is approved and saved
  knowledgeId?: string;
  reflectionStep?: number; // 0-3, undefined = not in reflection mode
}

// Module-level maps — survive across requests in the same process
const captures = new Map<string, PendingCapture>();
const chatToCapture = new Map<number, string>();

export const captureState = {
  create(data: Omit<PendingCapture, "id" | "inAskMode" | "history">): PendingCapture {
    // Clear any previous pending capture for this chat
    const prevId = chatToCapture.get(data.chatId);
    if (prevId) captures.delete(prevId);

    const id = Math.random().toString(36).slice(2, 10);
    const capture: PendingCapture = { ...data, id, inAskMode: false, history: [] };
    captures.set(id, capture);
    chatToCapture.set(data.chatId, id);
    return capture;
  },
  get(id: string): PendingCapture | undefined {
    return captures.get(id);
  },
  getByChat(chatId: number): PendingCapture | undefined {
    const id = chatToCapture.get(chatId);
    return id ? captures.get(id) : undefined;
  },
  update(id: string, patch: Partial<PendingCapture>): void {
    const existing = captures.get(id);
    if (existing) captures.set(id, { ...existing, ...patch });
  },
  delete(id: string): void {
    const c = captures.get(id);
    if (c) chatToCapture.delete(c.chatId);
    captures.delete(id);
  },
};
