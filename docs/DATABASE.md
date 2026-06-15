# Database Setup — Supabase

## Migration: update domain taxonomy (run this to keep existing data)

Paste into **Supabase SQL Editor** and run once. Does NOT delete any rows.

```sql
-- ─── Drop old domain CHECK constraint ────────────────────────────────────────
ALTER TABLE public.knowledge DROP CONSTRAINT IF EXISTS knowledge_domain_check;

-- ─── Migrate old domain values → new taxonomy ────────────────────────────────
-- Frontend / Backend / System Design / DevOps / Database → Engineering
UPDATE public.knowledge
SET domain = 'Engineering'
WHERE domain IN ('Frontend', 'Backend', 'System Design', 'DevOps', 'Database');

-- English → Language
UPDATE public.knowledge
SET domain = 'Language'
WHERE domain = 'English';

-- AI, Automation, Design, Business, Mindset, Productivity, Career, Other → unchanged

-- ─── Add new CHECK constraint ─────────────────────────────────────────────────
ALTER TABLE public.knowledge
  ADD CONSTRAINT knowledge_domain_check
  CHECK (domain IN (
    'Engineering', 'AI', 'Automation', 'Design', 'Business',
    'Finance', 'Productivity', 'Mindset', 'Learning', 'Language',
    'Career', 'Health', 'Lifestyle', 'Other'
  ));
```

---

## Full reset (fresh project only — deletes all data)

> ⚠️ This drops all existing tables. Safe to re-run on a fresh project.

```sql
-- ─── Drop existing tables (safe reset) ───────────────────────────────────────
DROP TABLE IF EXISTS public.reflection CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.knowledge CASCADE;

-- ─── knowledge ────────────────────────────────────────────────────────────────
CREATE TABLE public.knowledge (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL,
  summary      text,
  raw_content  text        NOT NULL,
  source_url   text,
  source_type  text        NOT NULL DEFAULT 'text'
               CHECK (source_type IN ('text', 'url', 'markdown')),
  content_type text        NOT NULL DEFAULT 'knowledge'
               CHECK (content_type IN ('knowledge', 'resource')),
  domain       text        NOT NULL DEFAULT 'Other'
               CHECK (domain IN (
                 'Engineering', 'AI', 'Automation', 'Design', 'Business',
                 'Finance', 'Productivity', 'Mindset', 'Learning', 'Language',
                 'Career', 'Health', 'Lifestyle', 'Other'
               )),
  status       text        NOT NULL DEFAULT 'saved'
               CHECK (status IN ('saved', 'quick')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── tags ─────────────────────────────────────────────────────────────────────
CREATE TABLE public.tags (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_id uuid        NOT NULL REFERENCES public.knowledge(id) ON DELETE CASCADE,
  tag          text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── reflection (user personal sections — manually filled) ───────────────────
-- Sections: "Why it matters to me" | "Possible use cases" | "Notes"
CREATE TABLE public.reflection (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_id uuid        NOT NULL REFERENCES public.knowledge(id) ON DELETE CASCADE,
  question     text        NOT NULL,
  answer       text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  answered_at  timestamptz
);

-- ─── Disable RLS (single-user app, no auth) ───────────────────────────────────
ALTER TABLE public.knowledge  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflection DISABLE ROW LEVEL SECURITY;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX ON public.knowledge (created_at DESC);
CREATE INDEX ON public.tags (knowledge_id);
CREATE INDEX ON public.tags (tag);
CREATE INDEX ON public.reflection (knowledge_id);
```
