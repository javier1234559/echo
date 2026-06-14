# Personal AI Brain - MVP Specification

## 1. Vision

Echo — Remember Less. Think More.

Build a personal AI-powered knowledge management system that acts as a "Second Brain".

The primary goal is **not to store information**, but to **help the user capture, organize, retrieve, and reason with personal knowledge** accumulated over time.

The system should become an AI assistant that understands the user's own experiences and thinking patterns rather than relying only on public knowledge.

---

# 2. Goals

## Primary Goals

* Capture valuable knowledge with minimal friction.
* Organize notes into a structured format.
* Allow natural language search over personal knowledge.
* Let AI reason based on personal notes.
* Keep infrastructure simple and inexpensive.
* Be maintainable for years with minimal operational cost.

## Secondary Goals

* Support future expansion into an AI Interest Radar.
* Support semantic search.
* Support knowledge graph and note relationships.
* Support reflection and learning loops.

---

# 3. Non Goals (MVP)

The first version should NOT include:

* Multi-user support
* Authentication
* Team collaboration
* Knowledge graph visualization
* Automatic internet crawling
* Agent frameworks (CrewAI, LangGraph, AutoGen)
* Complex workflows
* Vector search (unless necessary)

Keep MVP extremely simple.

---

# 4. Tech Stack

## Frontend

* Next.js
* React
* TypeScript

## Backend

* Next.js API Routes

## Deployment

* Vercel

## Database

* Supabase PostgreSQL

(Currently use normal relational tables and Full Text Search.)

Future:

* pgvector

## Messaging

* Telegram Bot API

## AI

Provider abstraction.

Default:

* Gemini Flash

Future:

* OpenAI
* Claude
* DeepSeek

Changing provider should require only configuration changes.

---

# 5. High Level Architecture

```
Telegram

        │

        ▼

Next.js API

        │

 ┌──────┴─────────┐

 │                │

 ▼                ▼

Supabase      LLM Provider

        │

        ▼

 Web Dashboard
```

Telegram is only the input interface.

Knowledge lives inside Supabase.

---

# 6. Core Concepts

## Knowledge

A single unit of information.

Example:

* Blog
* YouTube transcript
* Idea
* Personal lesson
* Meeting note

Every knowledge object should exist independently.

---

## Reflection

AI asks follow-up questions to force active thinking.

Example:

* What is the main takeaway?
* Do you agree or disagree?
* When will you use this?
* What should your future self remember?

Reflection is more valuable than summary.

---

## Natural Language Assistant

Instead of traditional commands, users can ask naturally.

Example:

```
What have I learned about GSAP?

Find my notes about monitoring.

Summarize everything about automation.

Did I ever save anything about delegation?
```

---

# 7. Telegram Commands

## /capture

Capture structured knowledge.

Input:

* URL
* Text
* Markdown

Pipeline:

```
Extract

↓

Summary

↓

Generate tags

↓

Store
```

---

## /quick

Fast capture.

No AI processing.

Store raw content only.

Useful when user is busy.

---

## /search

Keyword search.

Uses database search only.

No LLM involved.

---

## /recent

List recently created notes.

No AI.

---

## /pending

List notes waiting for reflection.

No AI.

---

## /ai

Natural language interface.

Uses LLM Function Calling.

AI decides which tool to invoke.

---

# 8. AI Philosophy

AI should NOT contain business logic.

AI should NOT manipulate the database directly.

AI should only:

* reason
* summarize
* synthesize
* choose tools

Business logic always belongs to deterministic backend code.

---

# 9. Tool Design

Expose a small number of tools to the LLM.

Example:

```
searchKnowledge(query)

createKnowledge(data)

updateKnowledge(id, data)

getRecentKnowledge(limit)

listPendingReflection()

searchByTag(tag)
```

The LLM should never execute SQL.

The LLM only requests tools.

Backend executes them safely.

---

# 10. /ai Flow

```
User

↓

Telegram

↓

Next.js API

↓

LLM

↓

Function Calling

↓

Backend Tool

↓

Supabase

↓

Backend

↓

LLM

↓

Final Answer

↓

Telegram
```

---

# 11. Database Design (Initial)

## knowledge

* id
* title
* summary
* raw_content
* source_url
* source_type
* created_at
* updated_at

---

## reflection

* id
* knowledge_id
* question
* answer

---

## tags

* id
* knowledge_id
* tag

---

Future:

embedding

relations

knowledge graph

---

# 12. Search Strategy

Phase 1:

* PostgreSQL Full Text Search
* ILIKE
* Tag search

Phase 2:

* pgvector
* semantic search

Do NOT implement vector search until necessary.

---

# 13. AI Cost Optimization

Avoid using LLM unless reasoning is required.

Examples:

## No AI

* /search
* /recent
* /pending
* /stats

Use deterministic backend.

---

## AI Required

* summary
* reasoning
* compare notes
* answer questions
* synthesis

---

## Default Model

Gemini Flash

---

## Future

Allow stronger models only for expensive reasoning tasks.

---

# 14. Design Principles

* Simplicity first.
* Avoid over-engineering.
* Prefer deterministic code over AI.
* AI augments logic, not replaces it.
* Keep provider abstraction.
* Every feature should remain replaceable.
* Optimize for long-term maintainability.
* Optimize for low operational cost.
* Keep Telegram as the primary input interface.
* Keep the Web App as the primary viewing interface.

---

# 15. Future Roadmap

## Phase 1

* Telegram capture
* Web dashboard
* Search
* AI assistant
* Reflection

## Phase 2

* Semantic search
* pgvector
* Related notes
* Knowledge graph

## Phase 3

* Interest Radar
* Automatic content crawling
* AI-generated daily briefs
* Trend detection
* Personalized recommendations

---

# 16. Development Milestones

## Milestone 1

* Telegram Bot
* Webhook
* `/ping`

---

## Milestone 2

* Supabase integration
* Knowledge table

---

## Milestone 3

* `/capture`

---

## Milestone 4

* Web UI
* View notes

---

## Milestone 5

* AI summary

---

## Milestone 6

* `/ai`
* Function Calling

---

## Milestone 7

* Reflection system

---

## Milestone 8

* Full Text Search improvements

---

## Milestone 9

* Optional pgvector integration
