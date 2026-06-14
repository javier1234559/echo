# Database Setup — Supabase

Paste each block into the **Supabase SQL Editor** in order.

---

## 1. knowledge

```sql
create table public.knowledge (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  summary     text,
  raw_content text not null,
  source_url  text,
  source_type text not null default 'text',
  -- source_type values: 'text' | 'url' | 'markdown'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at on row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger knowledge_set_updated_at
  before update on public.knowledge
  for each row execute procedure public.set_updated_at();

-- Full Text Search index (title + summary + raw_content)
create index knowledge_fts_idx on public.knowledge
  using gin (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(summary, '') || ' ' ||
      coalesce(raw_content, '')
    )
  );
```

---

## 2. tags

```sql
create table public.tags (
  id           uuid primary key default gen_random_uuid(),
  knowledge_id uuid not null references public.knowledge(id) on delete cascade,
  tag          text not null,
  created_at   timestamptz not null default now(),
  unique (knowledge_id, tag)
);

create index tags_knowledge_id_idx on public.tags(knowledge_id);
create index tags_tag_idx on public.tags(tag);
```

---

## 3. reflection

```sql
create table public.reflection (
  id           uuid primary key default gen_random_uuid(),
  knowledge_id uuid not null references public.knowledge(id) on delete cascade,
  question     text not null,
  answer       text,
  -- answer is null until the user replies
  created_at   timestamptz not null default now(),
  answered_at  timestamptz
);

create index reflection_knowledge_id_idx on public.reflection(knowledge_id);
create index reflection_unanswered_idx on public.reflection(knowledge_id) where answer is null;
```

---

## 4. Row Level Security

This is a single-user app with no auth. Disable RLS so the service role key
can read/write freely from the API routes.

```sql
alter table public.knowledge  disable row level security;
alter table public.tags       disable row level security;
alter table public.reflection disable row level security;
```

---

## 5. Verify

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
-- Should return: knowledge, reflection, tags
```
