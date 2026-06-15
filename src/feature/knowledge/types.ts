export type SourceType = "text" | "url" | "markdown";
export type KnowledgeStatus = "saved" | "quick";
export type ContentType = "knowledge" | "resource";

export const DOMAINS = [
  "Engineering",
  "AI",
  "Automation",
  "Design",
  "Business",
  "Finance",
  "Productivity",
  "Mindset",
  "Learning",
  "Language",
  "Career",
  "Health",
  "Lifestyle",
  "Other",
] as const;

export type Domain = (typeof DOMAINS)[number];

export interface Knowledge {
  id: string;
  title: string;
  summary: string | null;
  raw_content: string;
  source_url: string | null;
  source_type: SourceType;
  content_type: ContentType;
  domain: Domain;
  status: KnowledgeStatus;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
  reflection?: Reflection[];
}

export interface Tag {
  id: string;
  knowledge_id: string;
  tag: string;
  created_at: string;
}

export interface Reflection {
  id: string;
  knowledge_id: string;
  question: string;
  answer: string | null;
  created_at: string;
  answered_at: string | null;
}

export interface CreateKnowledgeInput {
  title: string;
  raw_content: string;
  summary?: string;
  source_url?: string;
  source_type?: SourceType;
  content_type?: ContentType;
  domain?: Domain;
  status?: KnowledgeStatus;
  tags?: string[];
}

export interface UpdateKnowledgeInput {
  title?: string;
  raw_content?: string;
  summary?: string;
  source_url?: string;
  domain?: Domain;
  tags?: string[];
}

// User sections — manually filled, never AI-generated
export const REFLECTION_PROMPTS: Record<string, string> = {
  "Why it matters to me": "How does this connect to your goals or current work?",
  "Possible use cases": "Where could you apply this? What problems could it solve?",
  Notes: "Any additional thoughts, links, or context to remember?",
};

// Content type display helpers
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  knowledge: "Knowledge",
  resource: "Resource",
};

export const CONTENT_TYPE_COLORS: Record<ContentType, string> = {
  knowledge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  resource: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
};
