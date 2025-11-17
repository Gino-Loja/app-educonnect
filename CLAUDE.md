# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EduTask is a Next.js 15 application that connects students with teachers for educational task assistance. The platform supports dual user roles (students and teachers) with distinct workflows and interfaces.

## Development Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack

# Build & Deploy
npm run build        # Production build with Turbopack
npm start           # Start production server

# Code Quality
npm run lint        # Run ESLint
```

## Tech Stack

- **Framework**: Next.js 15.5.2 (App Router)
- **Runtime**: React 19.1.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with Radix UI components
- **Auth & Database**: Supabase (SSR with @supabase/ssr)
- **Forms**: Zod validation
- **UI Components**: Radix UI primitives, shadcn/ui patterns
- **Drag & Drop**: @dnd-kit
- **Charts**: Recharts
- **Icons**: @tabler/icons-react, lucide-react

## Architecture

### Route Structure

The app uses Next.js App Router with route groups:

- **`(auth)/`**: Unauthenticated pages
  - `/login`, `/signup`, `/forgot-password`, `/update-password`
  - `/account` - User profile management
  - `/confirm` - Email confirmation route handler

- **`(main)/`**: Authenticated pages
  - `/workspace` - Main workspace with parallel routes
    - `@student/` - Student-specific views (parallel route)
    - `@teacher/` - Teacher-specific views (parallel route)

- **`/dashboard`**: Dashboard page

### Parallel Routes

The workspace uses Next.js parallel routes (`@student`, `@teacher`) to render role-specific UIs based on user type. This pattern allows:
- Single layout with conditional rendering based on user role
- Separate page components per role without route duplication
- Type-safe role-based views

### Authentication & Authorization

- **Middleware** (`src/middleware.ts`): Handles session refresh and route protection
  - Authenticated users redirected from auth pages to `/workspace`
  - Unauthenticated users redirected to `/login` (except public routes)
  - Public routes: `/`, `/login`, `/signup`, `/forgot-password`, `/update-password`, `/confirm`

- **Supabase Setup**:
  - Client: `src/utils/supabase/client.ts` (browser)
  - Server: `src/utils/supabase/server.ts` (server components/actions)
  - Middleware: `src/utils/supabase/middleware.ts` (session management)

### Database Schema

Located in `src/model/schema.ts` (Supabase TypeScript types):

- **`profiles`**: Base user table (email, role, bio, contact info, etc.)
- **`students`**: Student-specific data (academic level, subjects, budget preferences)
- **`teachers`**: Teacher-specific data (hourly rate, specialties, experience, certifications)

**Relationships**:
- `students.id` → `profiles.id` (1:1)
- `teachers.id` → `profiles.id` (1:1)

### Directory Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── (auth)/       # Auth route group
│   ├── (main)/       # Main app route group
│   └── dashboard/
├── components/       # React components
│   └── ui/          # shadcn/ui components
├── hooks/           # React hooks
├── lib/
│   ├── data/        # Server actions & data fetching
│   │   ├── action-user.ts      # Auth actions (login, signup)
│   │   └── profile-actions.ts  # Profile CRUD
│   └── validation/  # Zod schemas
├── model/           # Database TypeScript types
├── modules/         # Feature modules
│   └── auth/        # Auth-specific components
└── utils/
    └── supabase/    # Supabase client utilities
```

## Key Patterns

### Server Actions

Server actions are in `src/lib/data/`:
- Use `'use server'` directive
- Return `{ status: 'error' | 'success', message: ... }` pattern
- Validate with Zod schemas from `src/lib/validation/`
- Use `revalidatePath()` and `redirect()` from next/cache/navigation

Example: `src/lib/data/action-user.ts` (login, signup)

### Path Aliases

Use `@/*` for imports: `@/components/ui/button` → `src/components/ui/button`

### Supabase Clients

- **Server Components/Actions**: `await createClient()` from `@/utils/supabase/server`
- **Client Components**: `createClient()` from `@/utils/supabase/client`
- Always type with `Database` from `@/model/schema`

### Form Validation

- Define schemas in `src/lib/validation/` using Zod
- Use `.safeParse()` in server actions
- Return validation errors in standardized format

## Configuration

- **Next.js**: `next.config.ts` - serverActions bodySizeLimit: 5mb
- **TypeScript**: `tsconfig.json` - strict mode, path aliases
- **ESLint**: `eslint.config.mjs` - Next.js core-web-vitals + TypeScript
- **Tailwind**: `postcss.config.mjs` - Tailwind CSS 4

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Development Notes

- App uses Turbopack for faster dev/build (Next.js 15 default)
- Server components are default; add `'use client'` only when needed
- Middleware runs on all routes (see matcher config in `src/middleware.ts`)
- Database schema is generated from Supabase; regenerate when DB changes
