export type SourceType = "text" | "url" | "markdown";
export type KnowledgeStatus = "saved" | "quick";

export interface Knowledge {
  id: string;
  title: string;
  summary: string | null;
  raw_content: string;
  source_url: string | null;
  source_type: SourceType;
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
  status?: KnowledgeStatus;
  tags?: string[];
}

export interface UpdateKnowledgeInput {
  title?: string;
  raw_content?: string;
  summary?: string;
  source_url?: string;
  tags?: string[];
}

// Maps reflection question → section prompt shown in UI
export const REFLECTION_PROMPTS: Record<string, string> = {
  Understanding: "Explain in your own words",
  Opinion: "Do you agree or disagree? Why?",
  Application: "Where and when will you use this?",
  Reminder: "One thing your future self should remember",
};
