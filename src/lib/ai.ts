import OpenAI from "openai";
import { aiConfig } from "@/config";
import type { Knowledge } from "@/feature/knowledge/types";

const client = new OpenAI({ apiKey: aiConfig.OPENAI_API_KEY });

// ─── Capture ─────────────────────────────────────────────────────────────────

export interface CaptureResult {
  title: string;
  tldr: string[];   // 3-5 bullet points
  tags: string[];
}

export async function generateCapture(content: string): Promise<CaptureResult> {
  const completion = await client.chat.completions.create({
    model: aiConfig.MODEL,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a knowledge capture assistant. Given content, extract:\n" +
          "1. A short descriptive title (max 60 chars)\n" +
          "2. 3-5 TL;DR bullet points — key insights, each 1-2 sentences\n" +
          "3. 3-5 lowercase tags (no # symbol)\n\n" +
          'Respond ONLY with JSON: { "title": string, "tldr": string[], "tags": string[] }',
      },
      {
        role: "user",
        content: content.slice(0, 4000),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as Partial<CaptureResult>;

  return {
    title: parsed.title ?? fallbackTitle(content),
    tldr: Array.isArray(parsed.tldr) ? parsed.tldr.slice(0, 5) : [],
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
  };
}

// ─── Ask mode conversation ────────────────────────────────────────────────────

export async function chatAboutCapture(
  content: string,
  userMessage: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<string> {
  const completion = await client.chat.completions.create({
    model: aiConfig.MODEL,
    temperature: 0.7,
    max_tokens: 500,
    messages: [
      {
        role: "system",
        content:
          "You are a thinking partner helping the user reflect on content before saving it to their second brain.\n\n" +
          "The captured content:\n---\n" +
          content.slice(0, 3000) +
          "\n---\n\n" +
          "Help them think critically. Be concise, Socratic, and useful. " +
          "When they seem ready to save, remind them they can type /approve.",
      },
      ...history.map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user" as const, content: userMessage },
    ],
  });

  return completion.choices[0]?.message?.content ?? "Sorry, I couldn't process that.";
}

// ─── Recall ───────────────────────────────────────────────────────────────────

export async function extractSearchKeywords(query: string): Promise<string> {
  const completion = await client.chat.completions.create({
    model: aiConfig.MODEL,
    temperature: 0,
    max_tokens: 60,
    messages: [
      {
        role: "system",
        content:
          "You are a search assistant for a personal knowledge base. Extract English search keywords from the user query.\n\n" +
          "Rules:\n" +
          "- Output ONLY English keywords, space-separated (max 6 words)\n" +
          "- Translate ALL concepts to English, including Vietnamese terms\n" +
          "- Vietnamese tech slang: 'si' or 'cây si' = 'strangler fig', 'vi dịch vụ' = 'microservices', etc.\n" +
          "- Include synonyms and related terms to improve recall\n" +
          "- Strip meta-words: lưu, tìm, gần đây, note, search, find, recently, có, không\n" +
          "- No explanation, no punctuation, just keywords",
      },
      { role: "user", content: query },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() ?? query;
}

export async function recallKnowledge(
  query: string,
  notes: Knowledge[],
): Promise<string> {
  if (!notes.length) {
    return "I didn't find any relevant notes for that query.";
  }

  const context = notes
    .slice(0, 6)
    .map((n, i) => {
      const preview = n.summary ?? n.raw_content.slice(0, 200);
      return `[${i + 1}] ${n.title}\n${preview}`;
    })
    .join("\n\n");

  const completion = await client.chat.completions.create({
    model: aiConfig.MODEL,
    temperature: 0.5,
    max_tokens: 500,
    messages: [
      {
        role: "system",
        content:
          "You are a personal knowledge assistant. The user is searching their second brain with a natural language query. " +
          "Synthesize the most relevant notes into a concise, helpful answer. Reference note numbers when appropriate.",
      },
      {
        role: "user",
        content: `Query: "${query}"\n\nRelevant notes:\n\n${context}`,
      },
    ],
  });

  return completion.choices[0]?.message?.content ?? "Could not synthesize an answer.";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fallbackTitle(text: string): string {
  const first = text.split("\n")[0].trim();
  return first.length > 60 ? first.slice(0, 57) + "..." : first;
}
