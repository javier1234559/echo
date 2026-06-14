"use client";

import { useState, useEffect } from "react";
import { Search, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { KnowledgeCard } from "@/feature/knowledge/components/knowledge-card";
import {
  useKnowledgePage,
  useKnowledgeTags,
  useSearchKnowledge,
} from "@/feature/knowledge/hooks/useKnowledge";

const PAGE_SIZE = 12;

function useDebounce(value: string, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-10 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-3 w-16 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function DashboardView() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [activeTag, setActiveTag] = useState<string | undefined>();
  const debouncedQuery = useDebounce(query);

  const isSearching = debouncedQuery.length >= 2;

  const tagsQuery = useKnowledgeTags();
  const pageQuery = useKnowledgePage(page, PAGE_SIZE, activeTag);
  const searchQuery = useSearchKnowledge(debouncedQuery);

  const items = isSearching ? searchQuery.data : pageQuery.data?.items;
  const isLoading = isSearching ? searchQuery.isLoading : pageQuery.isLoading;
  const totalPages = isSearching ? 1 : (pageQuery.data?.totalPages ?? 1);
  const total = isSearching ? (searchQuery.data?.length ?? 0) : (pageQuery.data?.total ?? 0);

  // Reset page when tag or search changes
  useEffect(() => { setPage(1); }, [activeTag, debouncedQuery]);

  function toggleTag(tag: string) {
    setActiveTag((prev) => (prev === tag ? undefined : tag));
    setQuery("");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-foreground">My Brain</h1>
        <p className="text-sm text-muted-foreground">
          {total === 0 ? "No notes yet" : `${total} note${total !== 1 ? "s" : ""} total`}
        </p>
      </div>

      {/* Tag chips */}
      {(tagsQuery.data?.length ?? 0) > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {tagsQuery.data!.map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`rounded-full border px-3 py-0.5 text-xs font-medium transition-colors ${
                activeTag === tag
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              #{tag}
              <span className="ml-1 opacity-60">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActiveTag(undefined); }}
          placeholder="Search notes..."
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-colors"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (items?.length ?? 0) === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
          <MessageCircle className="h-8 w-8 text-muted-foreground/50" />
          <div>
            <p className="font-medium text-muted-foreground">
              {isSearching
                ? `No results for "${debouncedQuery}"`
                : activeTag
                ? `No notes tagged #${activeTag}`
                : "No notes yet"}
            </p>
            {!isSearching && !activeTag && (
              <p className="mt-1 text-sm text-muted-foreground/70">
                Send{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">/capture</code>{" "}
                to your Telegram bot to get started
              </p>
            )}
          </div>
        </div>
      )}

      {/* Note list */}
      {!isLoading && items && items.length > 0 && (
        <>
          {isSearching && (
            <p className="mb-3 text-xs text-muted-foreground">
              {items.length} result{items.length !== 1 ? "s" : ""} for &quot;{debouncedQuery}&quot;
            </p>
          )}
          {activeTag && !isSearching && (
            <p className="mb-3 text-xs text-muted-foreground">
              Filtered by <span className="font-medium text-foreground">#{activeTag}</span>
              <button
                onClick={() => setActiveTag(undefined)}
                className="ml-2 text-primary hover:underline"
              >
                clear
              </button>
            </p>
          )}
          <div className="space-y-3">
            {items.map((k) => (
              <KnowledgeCard key={k.id} knowledge={k} />
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {!isSearching && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                p === page
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </main>
  );
}
