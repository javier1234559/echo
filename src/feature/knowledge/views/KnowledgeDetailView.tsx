"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Pencil, Trash2, Check, X } from "lucide-react";
import { RouteNames } from "@/constants";
import {
  useKnowledgeById,
  useUpdateKnowledge,
  useDeleteKnowledge,
  useUpdateReflection,
} from "@/feature/knowledge/hooks/useKnowledge";
import { REFLECTION_PROMPTS } from "@/feature/knowledge/types";

interface Props {
  id: string;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

function Skeleton() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 h-4 w-16 animate-pulse rounded bg-muted" />
      <div className="space-y-3">
        <div className="h-7 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </main>
  );
}

// ─── Inline editable textarea ─────────────────────────────────────────────────

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
        <div className={className}>{value || <span className="italic text-muted-foreground">{placeholder}</span>}</div>
        <button
          onClick={() => { setDraft(value); setEditing(true); }}
          className="absolute right-0 top-0 hidden rounded p-1 hover:bg-muted group-hover:flex"
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
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
          rows={4}
          className="w-full rounded-lg border border-primary/40 bg-muted/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none"
        />
      ) : (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full rounded-lg border border-primary/40 bg-muted/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
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

// ─── Reflection section card ──────────────────────────────────────────────────

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
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{section}</p>
        {!editing && (
          <button
            onClick={() => { setDraft(answer ?? ""); setEditing(true); }}
            className="rounded p-1 hover:bg-muted"
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
        <p className="text-sm leading-relaxed text-foreground">{answer}</p>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-sm italic text-muted-foreground hover:text-primary transition-colors"
        >
          {prompt} — click to add
        </button>
      )}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function KnowledgeDetailView({ id }: Props) {
  const { data: knowledge, isLoading, isError } = useKnowledgeById(id);
  const updateKnowledge = useUpdateKnowledge();
  const deleteKnowledge = useDeleteKnowledge();
  const updateReflection = useUpdateReflection(id);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    month: "short", day: "numeric", year: "numeric",
  });

  const tldrBullets = knowledge.summary
    ? knowledge.summary.split("\n").filter(Boolean)
    : [];

  const reflectionMap = Object.fromEntries(
    (knowledge.reflection ?? []).map((r) => [r.question, r]),
  );

  const pendingReflections = (knowledge.reflection ?? []).filter((r) => !r.answer).length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Back + Delete */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          href={RouteNames.App}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        {confirmDelete ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-destructive font-medium">Delete this note?</span>
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

      {/* ── Metadata header ── */}
      <div className="mb-8 rounded-xl border border-border bg-muted/20 px-4 py-3 font-mono text-xs text-muted-foreground space-y-1">
        <div className="flex gap-2">
          <span className="text-foreground/50 shrink-0">title:</span>
          <InlineEdit
            value={knowledge.title}
            multiline={false}
            onSave={async (v) => { await updateKnowledge.mutateAsync({ id, data: { title: v } }); }}
            className="text-foreground"
          />
        </div>
        <div><span className="text-foreground/50">source:</span> {knowledge.source_url ?? "—"}</div>
        <div><span className="text-foreground/50">type:</span> {knowledge.source_type}</div>
        <div>
          <span className="text-foreground/50">tags:</span>{" "}
          {knowledge.tags?.length
            ? knowledge.tags.map((t) => `#${t.tag}`).join(" ")
            : "—"}
        </div>
        <div><span className="text-foreground/50">created_at:</span> {date}</div>
        <div className="flex items-center gap-2">
          <span className="text-foreground/50">status:</span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
            knowledge.status === "quick"
              ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
              : pendingReflections > 0
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
              : "bg-green-500/10 text-green-600 dark:text-green-400"
          }`}>
            {knowledge.status === "quick"
              ? "quick"
              : pendingReflections > 0
              ? `pending reflection (${pendingReflections})`
              : "complete"}
          </span>
        </div>
      </div>

      {/* ── TL;DR ── */}
      <section className="mb-8">
        <SectionLabel>TL;DR</SectionLabel>
        {tldrBullets.length > 0 ? (
          <ul className="space-y-2">
            {tldrBullets.map((bullet, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground">
                <span className="mt-0.5 shrink-0 text-primary">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-muted-foreground">No AI summary — quick capture</p>
        )}
      </section>

      {/* ── My Take ── */}
      {knowledge.status !== "quick" && (
        <section className="mb-8">
          <SectionLabel>My Take</SectionLabel>
          <div className="space-y-3">
            {Object.entries(REFLECTION_PROMPTS).map(([section, prompt]) => {
              const reflection = reflectionMap[section];
              return (
                <ReflectionCard
                  key={section}
                  section={section}
                  prompt={prompt}
                  answer={reflection?.answer ?? null}
                  onSave={(answer) =>
                    updateReflection.mutateAsync({ question: section, answer })
                  }
                />
              );
            })}
          </div>
        </section>
      )}

      {/* ── Source link ── */}
      {knowledge.source_url && (
        <section className="mb-8">
          <SectionLabel>Source</SectionLabel>
          <a
            href={knowledge.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline break-all"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            {knowledge.source_url}
          </a>
        </section>
      )}

      {/* ── Raw Note ── */}
      <section>
        <SectionLabel>Raw Note</SectionLabel>
        <InlineEdit
          value={knowledge.raw_content}
          onSave={async (v) => { await updateKnowledge.mutateAsync({ id, data: { raw_content: v } }); }}
          placeholder="No content"
          className="whitespace-pre-wrap rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm leading-relaxed text-foreground"
        />
      </section>
    </main>
  );
}
