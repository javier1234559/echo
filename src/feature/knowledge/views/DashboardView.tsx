"use client";

import { useState, useEffect } from "react";
import { Search, MessageCircle, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { KnowledgeCard } from "@/feature/knowledge/components/knowledge-card";
import {
  useKnowledgePage,
  useKnowledgeTags,
  useKnowledgeDomains,
  useSearchKnowledge,
} from "@/feature/knowledge/hooks/useKnowledge";
import { DOMAINS } from "@/feature/knowledge/types";

const PAGE_SIZE = 12;
const TAGS_INITIAL = 10;
const TAGS_STEP = 10;

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

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-0.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function DashboardView() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [activeTag, setActiveTag] = useState<string | undefined>();
  const [activeDomain, setActiveDomain] = useState<string | undefined>();
  const [tagLimit, setTagLimit] = useState(TAGS_INITIAL);
  const debouncedQuery = useDebounce(query);

  const isSearching = debouncedQuery.length >= 2;

  const tagsQuery = useKnowledgeTags();
  const domainsQuery = useKnowledgeDomains();
  const pageQuery = useKnowledgePage(page, PAGE_SIZE, activeTag, activeDomain);
  const searchQuery = useSearchKnowledge(debouncedQuery);

  const items = isSearching ? searchQuery.data : pageQuery.data?.items;
  const isLoading = isSearching ? searchQuery.isLoading : pageQuery.isLoading;
  const totalPages = isSearching ? 1 : (pageQuery.data?.totalPages ?? 1);
  const total = isSearching ? (searchQuery.data?.length ?? 0) : (pageQuery.data?.total ?? 0);

  useEffect(() => { setPage(1); }, [activeTag, activeDomain, debouncedQuery]);

  function toggleTag(tag: string) {
    setActiveTag((prev) => (prev === tag ? undefined : tag));
    setActiveDomain(undefined);
    setQuery("");
  }

  function toggleDomain(domain: string) {
    setActiveDomain((prev) => (prev === domain ? undefined : domain));
    setActiveTag(undefined);
    setQuery("");
  }

  const allTags = tagsQuery.data ?? [];
  const visibleTags = allTags.slice(0, tagLimit);
  const hiddenCount = allTags.length - visibleTags.length;

  // Merge fixed DOMAINS list with actual counts — always show all 14
  const domainCounts = Object.fromEntries(
    (domainsQuery.data ?? []).map(({ domain, count }) => [domain, count]),
  );
  const domains = DOMAINS.map((d) => ({ domain: d, count: domainCounts[d] ?? 0 }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">My Brain</h1>
        <p className="text-sm text-muted-foreground">
          {total === 0 ? "No notes yet" : `${total} note${total !== 1 ? "s" : ""} total`}
        </p>
      </div>

      {/* Filter sections */}
      {(domains.length > 0 || allTags.length > 0) && (
        <div className="mb-5 space-y-3">
          {/* Domain section — always show all 14 */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Domain
            </p>
            <div className="flex flex-wrap gap-1.5">
              {domains.map(({ domain, count }) =>
                count === 0 ? (
                  <span
                    key={domain}
                    className="rounded-full border border-border/40 px-3 py-0.5 text-xs font-medium text-muted-foreground/30 select-none"
                  >
                    {domain}
                    <span className="ml-1">0</span>
                  </span>
                ) : (
                  <Chip key={domain} active={activeDomain === domain} onClick={() => toggleDomain(domain)}>
                    {domain}
                    <span className="ml-1 opacity-60">{count}</span>
                  </Chip>
                )
              )}
            </div>
          </div>

          {/* Free-form tags section */}
          {allTags.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {visibleTags.map(({ tag, count }) => (
                  <Chip key={tag} active={activeTag === tag} onClick={() => toggleTag(tag)}>
                    #{tag}
                    <span className="ml-1 opacity-60">{count}</span>
                  </Chip>
                ))}
                {hiddenCount > 0 && (
                  <button
                    onClick={() => setTagLimit((prev) => prev + TAGS_STEP)}
                    className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    <ChevronDown className="h-3 w-3" />
                    +{hiddenCount} more
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActiveTag(undefined); setActiveDomain(undefined); }}
          placeholder="Search notes..."
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-colors"
        />
      </div>

      {/* Active filter hint */}
      {!isSearching && (activeTag || activeDomain) && (
        <p className="mb-3 text-xs text-muted-foreground">
          Filtered by{" "}
          <span className="font-medium text-foreground">
            {activeTag ? `#${activeTag}` : activeDomain}
          </span>
          <button
            onClick={() => { setActiveTag(undefined); setActiveDomain(undefined); }}
            className="ml-2 text-primary hover:underline"
          >
            clear
          </button>
        </p>
      )}

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
                : activeDomain
                ? `No notes in ${activeDomain}`
                : "No notes yet"}
            </p>
            {!isSearching && !activeTag && !activeDomain && (
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
