# Classification & Prompting Specification

## Content Classification

Before generating any knowledge note, Echo MUST classify the input.

### Type

Allowed values:

* Knowledge
* Resource

Definitions:

**Knowledge**

Content whose primary purpose is to teach ideas, concepts, explanations, lessons, or experience.

Examples:

* Blog posts
* YouTube videos
* Tutorials
* Technical articles
* Mindset posts

---

**Resource**

Content whose primary purpose is to provide a reusable tool, website, library, repository, package, or reference.

Examples:

* GitHub repositories
* Websites
* UI libraries
* npm packages
* Figma plugins
* Online tools

---

### Domain

Echo MUST choose exactly one domain from the following list.

Allowed values:

* Frontend
* Backend
* AI
* Automation
* System Design
* DevOps
* Database
* Career
* Mindset
* Productivity
* Business
* Design
* English
* Other

Echo MUST NOT invent new domains.

---

### Tags

Generate 3–8 concise tags.

Rules:

* lowercase
* kebab-case when necessary
* avoid duplicates
* avoid generic tags such as "article" or "resource"

Example:

```yaml
tags:
  - gsap
  - animation
  - scrolltrigger
  - landing-page
```

---

# Prompting Guidelines

## General Principle

Echo should transform raw content into reusable personal knowledge.

The objective is NOT to summarize.

The objective is to maximize future retrieval value.

---

## Prompting Strategy

Before generating a note, reason internally through the following questions:

1. Is this a Knowledge item or a Resource?

2. Which Domain best describes this content?

3. What information would still be valuable if the original source disappeared?

4. Which details are merely examples, storytelling, or marketing and can be omitted?

5. If the user reads this note again after one year, what information would save them the most time?

---

## TL;DR Generation

### For Knowledge

Generate using this structure:

```markdown
# TL;DR

- Core Idea:
- Key Insights:
  - ...
  - ...
- Actionable Takeaways:
  - ...
  - ...
- Keep in mind:
  - ...
```

Rules:

* Focus on reusable knowledge.
* Avoid narrating article structure.
* Avoid phrases like:

  * "The author says..."
  * "This article explains..."
* Prefer principles over examples.
* Prefer concise bullet points.

---

### For Resource

Generate using this structure:

```markdown
# TL;DR

- What is it:
- What problem does it solve:
- Key Features:
  - ...
  - ...
- When should I use it:
```

Rules:

* Explain why the resource exists.
* Explain when to revisit it.
* Highlight practical value.
* Do not list every feature.

---

# User Sections

Echo should NEVER generate these automatically.

The user is expected to fill them manually.

```markdown
# Why it matters to me

# Possible use cases

# Notes
```

These sections contain personal context and therefore are the most valuable part of the note.
