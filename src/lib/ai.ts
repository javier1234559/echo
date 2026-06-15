import OpenAI from "openai";
import { aiConfig } from "@/config";
import type { Knowledge, ContentType, Domain } from "@/feature/knowledge/types";
import { DOMAINS } from "@/feature/knowledge/types";

const client = new OpenAI({ apiKey: aiConfig.OPENAI_API_KEY });

// ─── Capture ─────────────────────────────────────────────────────────────────

export interface CaptureResult {
  title: string;
  content_type: ContentType;
  domain: Domain;
  tldr: string[];  // structured lines, rendered as bullets
  tags: string[];
}

const DOMAIN_LIST = DOMAINS.join(", ");

const DOMAIN_GUIDE = `
Domain selection guide (pick the SINGLE best fit):
- Engineering   → software dev, system design, DevOps, databases, backend, frontend, infra, APIs, architecture
- AI            → machine learning, LLMs, prompt engineering, embeddings, AI tools, neural networks, agents
- Automation    → workflow automation, scripting, bots, CI/CD pipelines, n8n, Zapier, RPA
- Design        → UI/UX, product design, visual design, Figma, design systems, typography, color
- Business      → startups, strategy, marketing, sales, growth, management, leadership, product
- Finance       → investing, personal finance, crypto, economics, budgeting, taxes, stocks
- Productivity  → time management, tools, systems, habits for getting things done, note-taking, PKM
- Mindset       → mental models, psychology, philosophy, cognitive biases, decision-making, focus
- Learning      → study techniques, learning science, memory, skill acquisition, courses, education
- Language      → English, Vietnamese, writing, communication, grammar, vocabulary, language learning
- Career        → job search, interviews, salary, freelancing, networking, performance, growth
- Health        → physical health, exercise, nutrition, sleep, mental health, wellness
- Lifestyle     → hobbies, travel, relationships, culture, personal development not covered above
- Other         → use ONLY when none of the above clearly fit`;

const SYSTEM_PROMPT = `You are Echo, a personal knowledge assistant that transforms raw content into structured, reusable notes.

STEP 1 — Classify content_type:
- "knowledge": teaches concepts, ideas, lessons, explanations (articles, tutorials, videos, essays, mindset posts)
- "resource": provides a reusable tool/reference to come back to (GitHub repos, npm packages, SaaS tools, Figma plugins, UI libraries, cheat sheets)

STEP 2 — Choose domain:
${DOMAIN_GUIDE}
Do NOT invent new domains. When unsure between two, pick the more specific one.

STEP 3 — Generate title (max 60 chars, specific and descriptive — avoid generic words like "Guide" or "Introduction")

STEP 4 — Generate TL;DR as an array of concise lines:

For "knowledge":
[
  "Core Idea: <the single most important idea in one sentence>",
  "Key Insight: <non-obvious insight 1>",
  "Key Insight: <non-obvious insight 2>",
  "Takeaway: <concrete action or change in behavior>",
  "Remember: <one thing worth keeping in mind long-term>"
]

For "resource":
[
  "What it is: <one sentence>",
  "Problem solved: <what pain point this addresses>",
  "Key Feature: <standout feature 1>",
  "Key Feature: <standout feature 2>",
  "When to use: <specific situation to reach for this>"
]

Rules:
- Write as if for your future self — extract the essence, not the structure
- NO "The author says..." or "This article explains..."
- Prefer principles and insights over summaries of examples
- 4-6 lines total

STEP 5 — Tags: 3-6 tags, lowercase, kebab-case, specific (e.g. "react-hooks" not "react"), no generic tags like "article", "guide", "resource", "tip"

Respond ONLY with valid JSON (no markdown):
{
  "title": string,
  "content_type": "knowledge" | "resource",
  "domain": string,
  "tldr": string[],
  "tags": string[]
}`;

export async function generateCapture(content: string): Promise<CaptureResult> {
  const completion = await client.chat.completions.create({
    model: aiConfig.MODEL,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: content.slice(0, 4000) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as Partial<CaptureResult>;

  const content_type: ContentType =
    parsed.content_type === "resource" ? "resource" : "knowledge";

  const domain: Domain = DOMAINS.includes(parsed.domain as Domain)
    ? (parsed.domain as Domain)
    : "Other";

  return {
    title: parsed.title ?? fallbackTitle(content),
    content_type,
    domain,
    tldr: Array.isArray(parsed.tldr) ? parsed.tldr.slice(0, 8) : [],
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
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
      return `[${i + 1}] ${n.title} [${n.content_type} / ${n.domain}]\n${preview}`;
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
