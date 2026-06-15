import { supabase } from "@/lib/supabase";
import type { Knowledge, CreateKnowledgeInput, UpdateKnowledgeInput } from "@/feature/knowledge/types";

// User section names — must match REFLECTION_PROMPTS keys in types.ts
const REFLECTION_SECTIONS = ["Why it matters to me", "Possible use cases", "Notes"];

export const knowledgeRepository = {
  async create(input: CreateKnowledgeInput): Promise<Knowledge> {
    const { tags, ...data } = input;

    const { data: row, error } = await supabase
      .from("knowledge")
      .insert({
        title: data.title,
        raw_content: data.raw_content,
        summary: data.summary ?? null,
        source_url: data.source_url ?? null,
        source_type: data.source_type ?? "text",
        content_type: data.content_type ?? "knowledge",
        domain: data.domain ?? "Other",
        status: data.status ?? "saved",
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create knowledge: ${error.message}`);

    if (tags && tags.length > 0) {
      await supabase.from("tags").insert(
        tags.map((tag) => ({ knowledge_id: row.id, tag })),
      );
    }

    return row as Knowledge;
  },

  async createWithReflections(input: CreateKnowledgeInput): Promise<Knowledge> {
    const knowledge = await knowledgeRepository.create({
      ...input,
      status: "saved",
    });

    await supabase.from("reflection").insert(
      REFLECTION_SECTIONS.map((section) => ({
        knowledge_id: knowledge.id,
        question: section,
      })),
    );

    return knowledge;
  },

  async getRecent(limit = 10): Promise<Knowledge[]> {
    const { data, error } = await supabase
      .from("knowledge")
      .select("*, tags(*)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch recent: ${error.message}`);
    return (data ?? []) as Knowledge[];
  },

  async getRecentPaginated(
    page = 1,
    limit = 12,
    tag?: string,
    domain?: string,
  ): Promise<{ items: Knowledge[]; total: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    if (tag) {
      const { data: tagRows } = await supabase
        .from("tags")
        .select("knowledge_id")
        .eq("tag", tag.toLowerCase());

      const ids = [...new Set((tagRows ?? []).map((r) => r.knowledge_id as string))];
      if (!ids.length) return { items: [], total: 0 };

      let q = supabase
        .from("knowledge")
        .select("*, tags(*)", { count: "exact" })
        .in("id", ids)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (domain) q = q.eq("domain", domain);

      const { data, error, count } = await q;
      if (error) throw new Error(`Fetch failed: ${error.message}`);
      return { items: (data ?? []) as Knowledge[], total: count ?? 0 };
    }

    let q = supabase
      .from("knowledge")
      .select("*, tags(*)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (domain) q = q.eq("domain", domain);

    const { data, error, count } = await q;
    if (error) throw new Error(`Fetch failed: ${error.message}`);
    return { items: (data ?? []) as Knowledge[], total: count ?? 0 };
  },

  async getDomains(): Promise<{ domain: string; count: number }[]> {
    const { data, error } = await supabase.from("knowledge").select("domain");
    if (error || !data) return [];

    const counts: Record<string, number> = {};
    for (const { domain } of data) {
      if (domain) counts[domain] = (counts[domain] ?? 0) + 1;
    }

    return Object.entries(counts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count);
  },

  async getAllTags(): Promise<{ tag: string; count: number }[]> {
    const { data, error } = await supabase.from("tags").select("tag");
    if (error || !data) return [];

    const counts: Record<string, number> = {};
    for (const { tag } of data) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }

    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  },

  async getById(id: string): Promise<Knowledge | null> {
    const { data, error } = await supabase
      .from("knowledge")
      .select("*, tags(*), reflection(*)")
      .eq("id", id)
      .single();

    if (error) return null;
    return data as Knowledge;
  },

  async search(query: string): Promise<Knowledge[]> {
    const { data, error } = await supabase
      .from("knowledge")
      .select("*, tags(*)")
      .or(
        `title.ilike.%${query}%,summary.ilike.%${query}%,raw_content.ilike.%${query}%`,
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw new Error(`Search failed: ${error.message}`);
    return (data ?? []) as Knowledge[];
  },

  async searchByTag(tag: string): Promise<Knowledge[]> {
    const { data, error } = await supabase
      .from("tags")
      .select("knowledge_id")
      .eq("tag", tag.toLowerCase());

    if (error || !data?.length) return [];

    const ids = data.map((r) => r.knowledge_id);
    const { data: rows } = await supabase
      .from("knowledge")
      .select("*, tags(*)")
      .in("id", ids)
      .order("created_at", { ascending: false });

    return (rows ?? []) as Knowledge[];
  },

  async getRelated(excludeId: string, tags: string[], limit = 4): Promise<Knowledge[]> {
    if (!tags.length) return [];

    const { data: tagRows } = await supabase
      .from("tags")
      .select("knowledge_id")
      .in("tag", tags);

    const ids = [...new Set((tagRows ?? []).map((r) => r.knowledge_id as string))].filter(
      (id) => id !== excludeId,
    );

    if (!ids.length) return [];

    const { data } = await supabase
      .from("knowledge")
      .select("*, tags(*)")
      .in("id", ids)
      .order("created_at", { ascending: false })
      .limit(limit);

    return (data ?? []) as Knowledge[];
  },

  async getPendingReflections(): Promise<Knowledge[]> {
    const { data, error } = await supabase
      .from("reflection")
      .select("knowledge_id")
      .is("answer", null);

    if (error || !data?.length) return [];

    const ids = [...new Set(data.map((r) => r.knowledge_id))];
    const { data: rows } = await supabase
      .from("knowledge")
      .select("*, tags(*)")
      .in("id", ids)
      .order("created_at", { ascending: false });

    return (rows ?? []) as Knowledge[];
  },

  async update(id: string, input: UpdateKnowledgeInput): Promise<Knowledge> {
    const { tags, ...fields } = input;

    const { data, error } = await supabase
      .from("knowledge")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update: ${error.message}`);

    if (tags !== undefined) {
      await supabase.from("tags").delete().eq("knowledge_id", id);
      if (tags.length > 0) {
        await supabase.from("tags").insert(tags.map((tag) => ({ knowledge_id: id, tag })));
      }
    }

    return data as Knowledge;
  },

  async updateReflectionByQuestion(
    knowledgeId: string,
    question: string,
    answer: string,
  ): Promise<void> {
    const { error } = await supabase
      .from("reflection")
      .update({ answer, answered_at: new Date().toISOString() })
      .eq("knowledge_id", knowledgeId)
      .eq("question", question);

    if (error) throw new Error(`Failed to update reflection: ${error.message}`);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("knowledge").delete().eq("id", id);
    if (error) throw new Error(`Failed to delete: ${error.message}`);
  },
};
