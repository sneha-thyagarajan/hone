# Hone – Architecture

## Overview

Hone is a local-first single-page application. All data lives in IndexedDB via Dexie.js. There is no backend in v1 — the browser is the server.

```
┌────────────────────────────────────────────────────────────┐
│  Browser                                                   │
│                                                            │
│  ┌──────────┐   ┌──────────────────────────────────────┐  │
│  │ React UI │──▶│ Zustand / useLiveQuery (Dexie hooks) │  │
│  └──────────┘   └─────────────┬────────────────────────┘  │
│                               │                           │
│                    ┌──────────▼──────────┐                │
│                    │   Dexie (IndexedDB) │                │
│                    └─────────────────────┘                │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ AI pipeline (optional, user-supplied key)          │   │
│  │  notes → chunks → prompt template → provider      │   │
│  │  → Zod validation → save as file in folder        │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌───────────────┐  ┌──────────────────┐                  │
│  │ Pyodide worker│  │  JS sandbox worker│                  │
│  │ (Python run)  │  │  (JS code run)   │                  │
│  └───────────────┘  └──────────────────┘                  │
└────────────────────────────────────────────────────────────┘
```

---

## Directory layout

```
src/
├── app/              Routes (createBrowserRouter), root layout
│   ├── layout.tsx    Sidebar + <Outlet>
│   ├── routes.tsx    All route definitions
│   └── pages/        One file per screen (thin wrappers)
│
├── components/       Shared, domain-agnostic UI
│   └── sidebar/      Sidebar, FolderTree, NavItem
│
├── features/         Domain logic, co-located with its UI
│   ├── folders/      CRUD actions, hooks, dialogs
│   ├── files/        Upload, file list, file card (future)
│   ├── notes/        Markdown editor, preview (future)
│   ├── study/        Flashcard session, SRS logic (future)
│   ├── code/         Code editor, test runner UI (future)
│   ├── planner/      Calendar, countdowns, tasks (future)
│   └── agent/        AI agent panel, generation pipeline (future)
│
├── ai/               AI provider interface and adapters
│   ├── provider.ts   generate({ prompt, schema }) interface
│   ├── openai.ts     OpenAI-compatible adapter (fetch, no SDK)
│   └── mock.ts       Mock adapter returning fixed sample JSON
│
├── db/               Dexie database
│   ├── index.ts      HoneDB class, table definitions
│   └── types.ts      TypeScript interfaces for all tables
│
├── parsers/          File parsers (PDF, PPTX, DOCX → text + chunks)
├── runner/           Code execution workers (Pyodide, JS sandbox)
├── lib/              Tiny utilities (cn, date helpers, etc.)
└── test/             Global test setup
```

---

## Data model

| Table | Key fields | Notes |
|-------|-----------|-------|
| `folders` | id, name, kind, examDate | One per subject |
| `files` | id, folderId, type, content, meta | All file types share this table |
| `chunks` | id, fileId, source, page, text | Text fragments for AI retrieval |
| `attempts` | id, fileId, kind, score, at | Quiz/flashcard/code run history |
| `events` | id, folderId, title, date, kind | Exam dates and study sessions |
| `tasks` | id, folderId, title, done, date | Daily to-do items |
| `settings` | key, value | Provider URL, model, API key |

---

## AI pipeline

```
1. User picks notes (file rows in the folder)
2. Fetch chunks for those files from IndexedDB
3. Fill a prompt template (prompts/<type>.ts) with the chunks
4. Call provider.generate({ prompt, schema: zodSchema })
5. Validate response with Zod; retry once on bad JSON
6. Save result as a new file in the folder with sources[]
```

Prompt templates live in `prompts/`. Each template exports a `build(chunks)` function that returns a string, keeping AI logic separate from UI logic.

The provider interface is:

```ts
interface Provider {
  generate<T>(opts: { prompt: string; schema: ZodType<T> }): Promise<T>
}
```

Adapters: `openai.ts` (plain `fetch`, covers Ollama / LM Studio / Groq / OpenRouter), `mock.ts` (returns hardcoded sample data for demos and tests).

---

## Readiness score

Readiness is a plain number, not AI-generated:

```
readiness = average(quiz attempt scores) weighted by recency
```

Specifically, the most recent attempt for each quiz/mock counts fully; older attempts decay. No ML, no magic — just arithmetic on the `attempts` table.

---

## Code runner

Python and JavaScript execution happen in Web Workers with a `setTimeout`-based kill switch (5 s default). The Python worker loads Pyodide lazily on first use. The JS worker uses a restricted `Function` constructor inside a sandboxed context. Neither has network access.

Expected test outputs for code practice problems are generated by **running** the reference solution through the same runner, so they are never guessed by the AI model.
