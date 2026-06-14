# Frontend Convention (Next.js)

This document describes the frontend architecture, conventions, and where to add or change UI, features, and routes. Follow it when contributing to the frontend.

---

## Overview

The frontend is a **Next.js** app using the **App Router**. Shared code (components, lib, service, config, constants) lives at the top level of `src/`. Feature-specific logic and UI live inside `src/feature/<feature-name>/`. Each feature has **services** (API), **hooks** (React Query), **components** (e.g. forms), and **views** (page-level composition). App routes in `src/app/` only import and render **views**—no business logic in `page.tsx`. This keeps the codebase easy to scale and makes it clear where to find or add feature logic and UI.

---

## Tech Stack

- **Next.js** — React framework, App Router, API routes
- **React** — UI
- **Tailwind CSS** (v4) — Styling
- **TypeScript** — Type safety
- **shadcn/ui** — UI primitives (Button, Input, Form, etc.); add via CLI
- **Lucide React** — Icons (paired with shadcn)
- **React Query** (`@tanstack/react-query`) — Server state, caching, mutations
- **react-hook-form** + **yup** — Forms and validation
- **axios** — HTTP client (shared instance in `src/service/baseApi.ts`)
- **next-themes** — Theme (light/dark) with class-based Tailwind dark mode

---

## File Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router (routes only)
│   │   ├── api/                # API route handlers (e.g. /api/auth/login)
│   │   ├── login/
│   │   │   └── page.tsx        # Imports LoginView only
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/              # Shared components (singular: components)
│   │   ├── common/             # Global reusable (app-icon, pagination, breadcrumb)
│   │   ├── layout/             # header, footer, sidebar, theme-provider, providers
│   │   ├── ui/                 # shadcn primitives (button, input, form, label)
│   │   └── custom/             # One-off (editors, animations)
│   ├── feature/                # Feature-based modules
│   │   └── auth/
│   │       ├── components/      # sign-in-form (form + schema.ts)
│   │       ├── hooks/         # useAuth, useUser, AUTH_KEY_FACTORY
│   │       ├── service/       # authApi (login, getMe, ...)
│   │       ├── views/         # LoginView (page-level composition)
│   │       └── types.ts
│   ├── lib/                    # Reusable utils (handleApiError, etc.)
│   ├── service/                # Global API client (baseApi.ts → axiosInstance)
│   ├── utils/                  # Helpers (e.g. cn)
│   ├── config.ts               # Single config source (env + fixed)
│   └── constants.ts            # Route names, other constants
├── public/
├── .env.example
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 1. `src/components/` (four subfolders)


| Folder     | Purpose                                                                | Examples                                                     |
| ---------- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| **common** | Global reusable components, often with custom styling (e.g. SVG/icons) | `app-icon`, `app-pagination`, `app-bread-crumb`              |
| **layout** | Layout and providers                                                   | `header`, `footer`, `sidebar`, `theme-provider`, `providers` |
| **ui**     | UI primitives from a design system (shadcn)                            | `button`, `input`, `form`, `label`                           |
| **custom** | Hard-to-categorize (editors, animations)                               | custom editor, streaming text                                |


**UI components:** Use the **shadcn CLI** instead of writing by hand:

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add form
```

**Icons:** Use **Lucide React** ([lucide.dev/icons](https://lucide.dev/icons/)). Install: `npm install lucide-react`. Import: `import { Sun, Moon, LogIn } from "lucide-react";`

---

## 2. `src/feature/<feature>/` (per-feature structure)

Each feature has four parts. Flow: **featureApi (service) → useFeature (hooks) → components (e.g. form) → View**. The app only imports **views**. Below are full examples for the `auth` feature so you can copy and adapt.

### 2.1 `services/` — feature API

- One main file (e.g. `authApi.ts`) exporting an object. Methods use shared `axiosInstance` from `src/service/baseApi.ts` and `handleApiError` from `src/lib/handleApiError`.
- Naming: `featureApi` or `<feature>Api` (e.g. `authApi`).

**Example — `feature/auth/service/authApi.ts`:**

```ts
import { handleApiError } from "@/lib/handleApiError";
import axiosInstance from "@/service/baseApi";
import type { User } from "@/feature/auth/types";

interface LoginDto {
  email: string;
  password: string;
}

export const authApi = {
  login(form: LoginDto) {
    return axiosInstance
      .post<{ user: User }>("/api/auth/login", form)
      .then((res) => res.data)
      .catch(handleApiError);
  },
  getMe() {
    return axiosInstance
      .get<User>("/api/auth/me")
      .then((res) => res.data)
      .catch(handleApiError);
  },
};
```

### 2.2 `hooks/` — React Query + key factory

- A **query key factory** object (e.g. `AUTH_KEY_FACTORY`) defines all keys for this feature. Hooks use `useMutation` / `useQuery`, call the feature API, and use the factory for `mutationKey` / `queryKey` (caching, loading, error).
- Naming: `useFeatureAction` for mutations (e.g. `useAuth`), `useFeatureData` for queries (e.g. `useUser`).

**Example — `feature/auth/hooks/useAuth.ts`:**

```ts
"use client";

import { authApi } from "@/feature/auth/service/authApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const AUTH_KEY_FACTORY = {
  all: ["auth"] as const,
  login: () => [...AUTH_KEY_FACTORY.all, "login"] as const,
  user: () => [...AUTH_KEY_FACTORY.all, "user"] as const,
};

export const useAuth = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: AUTH_KEY_FACTORY.login(),
    mutationFn: authApi.login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEY_FACTORY.all });
    },
  });
};

export const useUser = () => {
  return useQuery({
    queryKey: AUTH_KEY_FACTORY.user(),
    queryFn: () => authApi.getMe(),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 min
  });
};
```

### 2.3 `components/` — feature UI (e.g. forms)

- Feature-specific components. Use **react-hook-form** and a **schema** file (e.g. `schema.ts` with yup/zod). components uses feature hooks and `@/components/ui/` (Form, Input, Button).
- Naming: e.g. `sign-in-form/` with `index.tsx` and `schema.ts`.

**Example — `feature/auth/components/sign-in-form/schema.ts`:**

```ts
import * as yup from "yup";

export interface ILoginForm {
  email: string;
  password: string;
}

export const DEFAULT_LOGIN_FORM: ILoginForm = {
  email: "",
  password: "",
};

export const loginSchema: yup.ObjectSchema<ILoginForm> = yup.object({
  email: yup.string().required("Email is required").email("Invalid email"),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "At least 6 characters"),
});
```

**Example — `feature/auth/components/sign-in-form/index.tsx` (form only, pattern):**

- `useForm<ILoginForm>({ resolver: yupResolver(loginSchema), defaultValues: DEFAULT_LOGIN_FORM })`
- `<Form {...form}><form onSubmit={form.handleSubmit(onSubmit)}>`
- `<FormField control={form.control} name="email" render={...} />` (and `password`) using `Input` from `@/components/ui/input`
- `onSubmit(values)` → `useAuth().mutate(values, { onSuccess: () => { window.location.href = RouteNames.Home } })`
- Show `loginMutation.isError` / `loginMutation.error?.message` and disable submit when `loginMutation.isPending`

### 2.4 `views/` — page-level composition

- A **View** is a page-level components that composes the feature’s components and hooks. No route logic; only layout and composition. Export as **named export** (e.g. `LoginView`).
- Naming: `<Feature>View` or `<Action>View` (e.g. `LoginView`, `DashboardView`).

**Example — `feature/auth/views/LoginView.tsx`:**

```tsx
"use client";

import SignInForm from "@/feature/auth/components/sign-in-form";

export function LoginView() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your email and password to sign in.
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}
```

---

## 3. `src/app/` (routes)

- Each route is a folder with `page.tsx` (App Router). `**page.tsx` only imports and renders a View.** No business logic or direct API/hook usage.

**Example:** `app/login/page.tsx` → `import { LoginView } from "@/feature/auth/views/LoginView"; return <LoginView />;`

Use paths from `src/constants.ts` (e.g. `RouteNames.Login`) for all links and redirects (e.g. after login).

---

## 4. Shared config, API, and root-level files


| Path                   | Purpose                                                                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `**src/lib/`**         | Reusable utilities (e.g. `handleApiError.ts` — normalize API errors, throw with `response.data.message` or fallback).                                                      |
| `**src/service/**`     | Global API client. One axios instance (`baseApi.ts`). Feature services import it; they do not create their own.                                                            |
| `**src/config.ts**`    | Single config source. Values from env or fixed. Other files import from here instead of `process.env` directly.                                                            |
| `**src/constants.ts**` | App-wide constants. Especially **route paths** (`RouteNames`) so changing a path here updates all links and redirects. Other constants (labels, limits) can live here too. |


---

## 5. Path alias

- Use `@/` for `src/` (e.g. `@/components/ui/button`, `@/feature/auth/views/LoginView`). Folder name is **singular**: `components`, not `components`.

---

## Summary

- **Shared:** `components/` (common, layout, ui, custom), `lib/`, `service/`, `config.ts`, `constants.ts`, `utils/`.
- **Feature:** `feature/<name>/` — services → hooks → components → views; app only imports views.
- **UI:** shadcn CLI for primitives; Lucide for icons.
- **Routes:** Only render views; use `constants.ts` for all paths and redirects.

