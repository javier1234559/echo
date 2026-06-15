"use client";

import Link from "next/link";
import { RouteNames } from "@/constants";
import type { Knowledge } from "@/feature/knowledge/types";
import { CONTENT_TYPE_COLORS } from "@/feature/knowledge/types";

interface Props {
  knowledge: Knowledge;
}

export function KnowledgeCard({ knowledge }: Props) {
  const date = new Date(knowledge.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // Show first line of TL;DR as preview (structured format)
  const firstLine = knowledge.summary?.split("\n").find((l) => l.trim()) ?? knowledge.raw_content;
  const preview = firstLine.length > 120 ? firstLine.slice(0, 117) + "…" : firstLine;

  const typeColor = CONTENT_TYPE_COLORS[knowledge.content_type ?? "knowledge"];

  return (
    <Link
      href={`${RouteNames.App}/${knowledge.id}`}
      className="group flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium leading-snug text-foreground group-hover:text-primary line-clamp-2">
          {knowledge.title}
        </h3>
        <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typeColor}`}>
            {knowledge.content_type ?? "knowledge"}
          </span>
        </div>
      </div>

      {/* Preview */}
      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
        {preview}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">{date}</span>
        {knowledge.domain && (
          <>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs font-medium text-muted-foreground">{knowledge.domain}</span>
          </>
        )}
        {knowledge.tags && knowledge.tags.length > 0 && (
          <>
            <span className="text-xs text-muted-foreground">·</span>
            <div className="flex flex-wrap gap-1">
              {knowledge.tags.slice(0, 3).map((t) => (
                <span key={t.id} className="text-xs text-primary/70">
                  #{t.tag}
                </span>
              ))}
              {knowledge.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">+{knowledge.tags.length - 3}</span>
              )}
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
