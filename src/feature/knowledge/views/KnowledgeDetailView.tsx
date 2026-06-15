"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Pencil, Trash2, Check, X } from "lucide-react";
import { RouteNames } from "@/constants";
import {
  useKnowledgeById,
  useUpdateKnowledge,
  useDeleteKnowledge,
  useUpdateReflection,
  useRelatedKnowledge,
} from "@/feature/knowledge/hooks/useKnowledge";
import { REFLECTION_PROMPTS, CONTENT_TYPE_COLORS, DOMAINS } from "@/feature/knowledge/types";
import type { Domain } from "@/feature/knowledge/types";
import { useKnowledgeTags } from "@/feature/knowledge/hooks/useKnowledge";
import type { Knowledge } from "@/feature/knowledge/types";

interface Props {
  id: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
      {children}
    </p>
  );
}

function Divider() {
  return <hr className="border-border" />;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 h-4 w-16 animate-pulse rounded bg-muted" />
      <div className="space-y-3">
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </main>
  );
}

// ─── Inline editable field ───────────────────────────────────────────────────

function InlineEdit({
  value,
  onSave,
  multiline = true,
  placeholder,
  className,
}: {
  value: string;
  onSave: (v: string) => Promise<void>;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  }

  function cancel() { setDraft(value); setEditing(false); }

  if (!editing) {
    return (
      <div className="group relative">
        <div className={className}>
          {value || <span className="italic text-muted-foreground">{placeholder}</span>}
        </div>
        <button
          onClick={() => { setDraft(value); setEditing(true); }}
          className="absolute -right-6 top-0 hidden rounded p-1 hover:bg-muted group-hover:flex"
          title="Edit"
        >
          <Pencil className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {multiline ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-primary/40 bg-muted/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none"
        />
      ) : (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full rounded-lg border border-primary/40 bg-muted/30 px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-primary"
        />
      )}
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          <Check className="h-3 w-3" />
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={cancel}
          className="flex items-center gap-1 rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Tag editor ──────────────────────────────────────────────────────────────

function TagEditor({
  tags,
  onSave,
}: {
  tags: string[];
  onSave: (tags: string[]) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>(tags);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const allTagsQuery = useKnowledgeTags();

  // Debounced input for suggestions
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(input), 200);
    return () => clearTimeout(t);
  }, [input]);

  const suggestions = debounced.length >= 1
    ? (allTagsQuery.data ?? [])
        .map((r) => r.tag)
        .filter((t) => t.includes(debounced.toLowerCase()) && !draft.includes(t))
        .slice(0, 6)
    : [];

  function addTag(tag?: string) {
    const t = (tag ?? input).trim().toLowerCase().replace(/^#+/, "");
    if (t && !draft.includes(t)) setDraft((prev) => [...prev, t]);
    setInput("");
    setDebounced("");
    setShowSuggestions(false);
  }

  function removeTag(tag: string) {
    setDraft((prev) => prev.filter((t) => t !== tag));
  }

  async function save() {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  }

  function cancel() {
    setDraft(tags);
    setInput("");
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="group flex items-start gap-3">
        <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 pt-0.5">Tags</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.length > 0
            ? tags.map((t) => (
                <span key={t} className="text-xs font-medium text-primary/70">#{t}</span>
              ))
            : <span className="text-xs italic text-muted-foreground/50">none</span>
          }
          <button
            onClick={() => { setDraft(tags); setEditing(true); }}
            className="hidden rounded p-0.5 hover:bg-muted group-hover:block"
            title="Edit tags"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 pt-2">Tags</span>
      <div className="flex-1 space-y-2">
        {/* Current tags */}
        {draft.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {draft.map((t) => (
              <span key={t} className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                #{t}
                <button onClick={() => removeTag(t)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input + suggestions */}
        <div className="relative">
          <input
            value={input}
            onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
              if (e.key === "Escape") { setShowSuggestions(false); }
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Type to search or add…"
            className="w-full rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
          />

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-md border border-border bg-card shadow-md">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted"
                >
                  <span className="text-primary/70">#{s}</span>
                  <span className="ml-auto text-muted-foreground/50">
                    {allTagsQuery.data?.find((r) => r.tag === s)?.count ?? 0}×
                  </span>
                </button>
              ))}
              {input.trim() && !suggestions.includes(input.trim().toLowerCase()) && (
                <button
                  onMouseDown={(e) => { e.preventDefault(); addTag(); }}
                  className="flex w-full items-center gap-2 border-t border-border px-3 py-1.5 text-left text-xs hover:bg-muted"
                >
                  <span className="text-muted-foreground">Add</span>
                  <span className="font-medium text-foreground">#{input.trim().toLowerCase()}</span>
                </button>
              )}
            </div>
          )}

          {/* "Add new" when no suggestions */}
          {showSuggestions && debounced.length >= 1 && suggestions.length === 0 && input.trim() && (
            <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-md border border-border bg-card shadow-md">
              <button
                onMouseDown={(e) => { e.preventDefault(); addTag(); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted"
              >
                <span className="text-muted-foreground">Add new</span>
                <span className="font-medium text-foreground">#{input.trim().toLowerCase()}</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            <Check className="h-3 w-3" />
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={cancel}
            className="flex items-center gap-1 rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TL;DR editor ─────────────────────────────────────────────────────────────

function TldrEditor({
  bullets,
  onSave,
}: {
  bullets: string[];
  onSave: (summary: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bullets.join("\n"));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave(draft.trim());
    setSaving(false);
    setEditing(false);
  }

  function cancel() {
    setDraft(bullets.join("\n"));
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="group relative">
        {bullets.length > 0 ? (
          <ul className="space-y-2">
            {bullets.map((bullet, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/80">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-muted-foreground/60">No summary yet</p>
        )}
        <button
          onClick={() => { setDraft(bullets.join("\n")); setEditing(true); }}
          className="absolute right-0 top-0 hidden rounded p-1 hover:bg-muted group-hover:flex"
          title="Edit TL;DR"
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">One bullet per line</p>
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={bullets.length > 0 ? bullets.length + 1 : 4}
        className="w-full rounded-lg border border-primary/40 bg-muted/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          <Check className="h-3 w-3" />
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={cancel}
          className="flex items-center gap-1 rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Domain editor ───────────────────────────────────────────────────────────

function DomainEditor({
  value,
  onSave,
}: {
  value: Domain;
  onSave: (domain: Domain) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState<string>(value);
  const [saving, setSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [debounced, setDebounced] = useState<string>("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(input), 150);
    return () => clearTimeout(t);
  }, [input]);

  const suggestions = DOMAINS.filter((d) =>
    d.toLowerCase().includes(debounced.toLowerCase()),
  );

  async function select(domain: Domain) {
    setSaving(true);
    await onSave(domain);
    setSaving(false);
    setEditing(false);
    setShowSuggestions(false);
  }

  function cancel() {
    setInput(value);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="group flex items-center gap-3">
        <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Domain</span>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-foreground/80">{value}</span>
          <button
            onClick={() => { setInput(value); setEditing(true); }}
            className="hidden rounded p-0.5 hover:bg-muted group-hover:block"
            title="Edit domain"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 pt-2">Domain</span>
      <div className="flex-1 space-y-2">
        <div className="relative">
          <input
            autoFocus
            value={input}
            onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
            onFocus={() => { setInput(""); setShowSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => { if (e.key === "Escape") cancel(); }}
            placeholder="Search domain…"
            className="w-full rounded-md border border-primary/40 bg-muted/30 px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-md border border-border bg-card shadow-md">
              {suggestions.map((d) => (
                <button
                  key={d}
                  onMouseDown={(e) => { e.preventDefault(); select(d); }}
                  disabled={saving}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted ${d === value ? "font-semibold text-primary" : "text-foreground"}`}
                >
                  {d}
                  {d === value && <span className="ml-auto text-[10px] text-muted-foreground">current</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={cancel}
          className="flex items-center gap-1 rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Reflection card ─────────────────────────────────────────────────────────

function ReflectionCard({
  section,
  prompt,
  answer,
  onSave,
}: {
  section: string;
  prompt: string;
  answer: string | null;
  onSave: (answer: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(answer ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!draft.trim()) return;
    setSaving(true);
    await onSave(draft.trim());
    setSaving(false);
    setEditing(false);
  }

  function cancel() { setDraft(answer ?? ""); setEditing(false); }

  return (
    <div className="group rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{section}</p>
        {!editing && (
          <button
            onClick={() => { setDraft(answer ?? ""); setEditing(true); }}
            className="hidden rounded p-1 hover:bg-muted group-hover:block"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={prompt}
            rows={3}
            className="w-full rounded-lg border border-primary/40 bg-muted/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving || !draft.trim()}
              className="flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={cancel}
              className="flex items-center gap-1 rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          </div>
        </div>
      ) : answer ? (
        <p className="text-sm leading-relaxed text-foreground/80">{answer}</p>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-sm italic text-muted-foreground/60 hover:text-primary transition-colors"
        >
          {prompt}
        </button>
      )}
    </div>
  );
}

// ─── Related note row (LinkedIn-style minimalist) ────────────────────────────

function RelatedNoteRow({ note, isLast }: { note: Knowledge; isLast: boolean }) {
  const date = new Date(note.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const preview = note.summary
    ? note.summary.split("\n").find((l) => l.trim()) ?? ""
    : note.raw_content.slice(0, 100);

  const cleanPreview = preview.replace(/^(Core Idea:|Key Insight:|Takeaway:|Remember:|What it is:|Problem solved:|Key Feature:|When to use:)\s*/i, "");

  return (
    <>
      <Link
        href={`${RouteNames.App}/${note.id}`}
        className="group flex flex-col gap-1 py-3 transition-colors hover:text-primary"
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-semibold text-foreground group-hover:text-primary line-clamp-1 leading-snug">
            {note.title}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">{date}</span>
        </div>
        {cleanPreview && (
          <p className="text-sm text-muted-foreground line-clamp-1 leading-relaxed">
            {cleanPreview}
          </p>
        )}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {note.tags.slice(0, 4).map((t) => (
              <span key={t.id} className="text-xs text-primary/60">
                #{t.tag}
              </span>
            ))}
            {note.tags.length > 4 && (
              <span className="text-xs text-muted-foreground">+{note.tags.length - 4}</span>
            )}
          </div>
        )}
      </Link>
      {!isLast && <Divider />}
    </>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function KnowledgeDetailView({ id }: Props) {
  const { data: knowledge, isLoading, isError } = useKnowledgeById(id);
  const updateKnowledge = useUpdateKnowledge();
  const deleteKnowledge = useDeleteKnowledge();
  const updateReflection = useUpdateReflection(id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const tagNames = (knowledge?.tags ?? []).map((t) => t.tag);
  const relatedQuery = useRelatedKnowledge(id, tagNames);

  if (isLoading) return <Skeleton />;

  if (isError || !knowledge) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 text-center">
        <p className="text-muted-foreground">Note not found.</p>
        <Link href={RouteNames.App} className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Back
        </Link>
      </main>
    );
  }

  const date = new Date(knowledge.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const tldrBullets = knowledge.summary
    ? knowledge.summary.split("\n").filter(Boolean)
    : [];

  const reflectionMap = Object.fromEntries(
    (knowledge.reflection ?? []).map((r) => [r.question, r]),
  );

  const pendingCount = (knowledge.reflection ?? []).filter((r) => !r.answer).length;
  const typeColor = CONTENT_TYPE_COLORS[knowledge.content_type ?? "knowledge"];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href={RouteNames.App}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        {confirmDelete ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-destructive font-medium text-xs">Delete this note?</span>
            <button
              onClick={() => deleteKnowledge.mutate(id)}
              disabled={deleteKnowledge.isPending}
              className="rounded-md bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground disabled:opacity-50"
            >
              {deleteKnowledge.isPending ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        )}
      </div>

      {/* ── Title + meta header ── */}
      <div className="space-y-4">
        <InlineEdit
          value={knowledge.title}
          multiline={false}
          onSave={async (v) => { await updateKnowledge.mutateAsync({ id, data: { title: v } }); }}
          className="text-2xl font-bold leading-snug text-foreground pr-8"
        />

        {/* Meta rows — each field on its own line */}
        <div className="space-y-1.5">
          {/* Type */}
          <div className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Type</span>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typeColor}`}>
              {knowledge.content_type ?? "knowledge"}
            </span>
          </div>

          {/* Domain — editable */}
          <DomainEditor
            value={knowledge.domain ?? "Other"}
            onSave={async (domain) => { await updateKnowledge.mutateAsync({ id, data: { domain } }); }}
          />

          {/* Date */}
          <div className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Date</span>
            <span className="text-sm text-foreground/80">{date}</span>
          </div>

          {/* Tags — editable */}
          <TagEditor
            tags={tagNames}
            onSave={async (tags) => { await updateKnowledge.mutateAsync({ id, data: { tags } }); }}
          />

          {/* Status */}
          {knowledge.status === "quick" ? (
            <div className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Status</span>
              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">quick</span>
            </div>
          ) : pendingCount > 0 ? (
            <div className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Status</span>
              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                {pendingCount} pending
              </span>
            </div>
          ) : null}

          {/* Source */}
          {knowledge.source_url && (
            <div className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Source</span>
              <a
                href={knowledge.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-xs">{knowledge.source_url}</span>
              </a>
            </div>
          )}
        </div>
      </div>

      <Divider />

      {/* ── TL;DR — editable ── */}
      <section>
        <SectionLabel>TL;DR</SectionLabel>
        <TldrEditor
          bullets={tldrBullets}
          onSave={async (summary) => { await updateKnowledge.mutateAsync({ id, data: { summary } }); }}
        />
      </section>

      {/* ── Personal Notes ── */}
      {knowledge.status !== "quick" && (
        <>
          <Divider />
          <section>
            <SectionLabel>Personal Notes</SectionLabel>
            <div className="space-y-3">
              {Object.entries(REFLECTION_PROMPTS).map(([section, prompt]) => {
                const reflection = reflectionMap[section];
                return (
                  <ReflectionCard
                    key={section}
                    section={section}
                    prompt={prompt}
                    answer={reflection?.answer ?? null}
                    onSave={(answer) => updateReflection.mutateAsync({ question: section, answer })}
                  />
                );
              })}
            </div>
          </section>
        </>
      )}

      <Divider />

      {/* ── Raw Note ── */}
      <section>
        <SectionLabel>Raw Note</SectionLabel>
        <InlineEdit
          value={knowledge.raw_content}
          onSave={async (v) => { await updateKnowledge.mutateAsync({ id, data: { raw_content: v } }); }}
          placeholder="No content"
          className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80"
        />
      </section>

      {/* ── Related Notes ── */}
      {tagNames.length > 0 && (
        <>
          <Divider />
          <section>
            <SectionLabel>Related Notes</SectionLabel>
            {relatedQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="py-3 space-y-1.5">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : (relatedQuery.data?.length ?? 0) === 0 ? (
              <p className="text-sm italic text-muted-foreground/60">No related notes found.</p>
            ) : (
              <div>
                {relatedQuery.data!.map((note, i) => (
                  <RelatedNoteRow
                    key={note.id}
                    note={note}
                    isLast={i === relatedQuery.data!.length - 1}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
