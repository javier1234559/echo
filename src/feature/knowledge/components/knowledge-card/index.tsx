"use client";

import Link from "next/link";
import { RouteNames } from "@/constants";
import type { Knowledge } from "@/feature/knowledge/types";

const SOURCE_LABELS: Record<string, string> = {
  url: "Link",
  text: "Note",
  markdown: "MD",
};

interface Props {
  knowledge: Knowledge;
}

export function KnowledgeCard({ knowledge }: Props) {
  const date = new Date(knowledge.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const preview = knowledge.summary ?? knowledge.raw_content;

  return (
    <Link
      href={`${RouteNames.App}/${knowledge.id}`}
      className="group flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium leading-snug text-foreground group-hover:text-primary line-clamp-2">
          {knowledge.title}
        </h3>
        <span className="mt-0.5 shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
          {SOURCE_LABELS[knowledge.source_type] ?? knowledge.source_type}
        </span>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
        {preview}
      </p>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{date}</span>
        {knowledge.tags && knowledge.tags.length > 0 && (
          <>
            <span className="text-xs text-muted-foreground">·</span>
            <div className="flex flex-wrap gap-1">
              {knowledge.tags.slice(0, 3).map((t) => (
                <span
                  key={t.id}
                  className="text-xs text-primary/70"
                >
                  #{t.tag}
                </span>
              ))}
              {knowledge.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{knowledge.tags.length - 3}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
