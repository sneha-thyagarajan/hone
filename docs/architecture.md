# Hone — Architecture

> Written 2026-11-03. Reflects the codebase as-built; updated whenever a
> structural change lands.

---

## 1 · Layer diagram

```
┌────────────────────────────────────────────────────────────┐
│  Browser                                                   │
│                                                            │
│  ┌──────────────────┐   ┌──────────────────────────────┐  │
│  │  app/            │   │  components/                 │  │
│  │  routes + pages  │   │  ui primitives + sidebar      │  │
│  └────────┬─────────┘   └──────────────┬───────────────┘  │
│           │  renders / uses                  │             │
│  ┌────────▼─────────────────────────────────▼──────────┐  │
│  │  features/  (domain slices)                         │  │
│  │  ┌──────────┐ ┌───────┐ ┌──────┐ ┌───────┐ ┌─────┐ │  │
│  │  │ folders  │ │ files │ │notes │ │planner│ │agent│ │  │
│  │  │ tasks    │ │ tabs  │ │ code │ │       │ │     │ │  │
│  │  └────┬─────┘ └───┬───┘ └──┬───┘ └───┬───┘ └──┬──┘ │  │
│  └───────┼───────────┼────────┼──────────┼────────┼────┘  │
│          │ *Actions.ts / *Store.ts call db            │    │
│  ┌───────▼───────────────────────────────────────────▼─┐  │
│  │  db/  (Dexie)  ←── only actions/stores/hooks        │  │
│  │  IndexedDB: folders · files · chunks · attempts     │  │
│  │             events · tasks · settings · blobs        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────┐  ┌──────────────────────────────────┐   │
│  │  lib/        │  │  Workers (off-main-thread)        │   │
│  │  pure utils  │  │  parsers/parseWorker.ts   ← PDF   │   │
│  │  dates, toast│  │  runner/python.worker.ts  ← Pyodide│  │
│  │  theme, utils│  │  runner/js.worker.ts      ← eval  │   │
│  └──────────────┘  └──────────────────────────────────┘   │
│                                                            │
│  ┌──────────────┐  ┌──────────────────────────────────┐   │
│  │  parsers/    │  │  fixtures/                        │   │
│  │  PDF·DOCX    │  │  dev-only sample AI content       │   │
│  │  PPTX·text   │  └──────────────────────────────────┘   │
│  └──────────────┘                                         │
└────────────────────────────────────────────────────────────┘
```

**Rule of thumb:** data flows *down* only.  
`app/pages` → `features/` → `db/` — nothing in `db/` or `lib/` imports from `features/`.

---

## 2 · What each folder is responsible for

| Path | Responsibility |
|------|---------------|
| `src/app/` | React Router config and page-level components. Pages are thin: they compose feature components, read URL params, and wire navigation. They must not call `db` or AI providers directly. |
| `src/app/pages/file-dispatcher.tsx` | Single entry point for any `/folders/:id/files/:id` route; inspects `file.type` and renders the right viewer/editor. |
| `src/components/` | Generic, app-agnostic UI primitives (Button, Toaster, ProgressBar) and the top-level shell (Sidebar, NavItem). No domain knowledge. |
| `src/db/` | Dexie schema, version history, and TypeScript interfaces for every stored record. Nothing else lives here; `db` is the only export. |
| `src/features/agent/` | AI generation stub + dialog. `generateFile.ts` is the one seam — a teammate replaces only its body. Zod schemas for structured AI output live in `schemas.ts`. |
| `src/features/code/` | Code-practice domain: snapshot CRUD (`attempts.ts`), image blob helpers (`noteImages.ts`), the multi-tab notes panel (`NotesPanel.tsx`), and the CodeMirror editor hook (`useCodeEditor.ts`). |
| `src/features/files/` | File CRUD actions, live-query hooks, upload orchestration (parse → chunk → save), file-type metadata/badges/filters, and viewers for uploads and AI files. |
| `src/features/folders/` | Folder CRUD actions, live-query hooks, the "allowed tools" rule (`tools.ts`), and readiness scoring. |
| `src/features/notes/` | Note-editor domain: outline extraction, scroll sync, markdown toolbar commands, autosave debouncing. All pure or hooks — no direct DB calls. |
| `src/features/planner/` | Calendar grid (pure), event/task CRUD, exam countdown hooks. |
| `src/features/tabs/` | Tab bar state (open/close/move/persist). Pure reducer functions live alongside the Zustand store. |
| `src/features/tasks/` | To-do list CRUD and the TodoList component. |
| `src/fixtures/` | Dev-only sample content returned by the AI stub. Not imported at runtime (tree-shaken in production). |
| `src/lib/` | Project-wide pure utilities and cross-cutting hooks: `dates.ts`, `toast.ts` (Zustand store), `theme.ts` (Zustand store), `settings.ts` (Dexie-backed settings hook), `utils.ts` (cn). |
| `src/parsers/` | File parsing: PDF via pdf.js, DOCX via mammoth, PPTX via JSZip, plain text. `parseClient.ts` posts to a Web Worker; `parseWorker.ts` runs inside it. `chunker.ts` splits pages into searchable chunks. |
| `src/runner/` | Code execution: `runnerClient.ts` dispatches to `python.worker.ts` (Pyodide, CDN-loaded on demand) or `js.worker.ts` (synchronous `eval` harness). Both workers are long-lived and reused. |

---

## 3 · Feature walk-through — creating a folder

**Trigger:** user clicks "New folder" in the sidebar.

```
Sidebar.tsx
  → local state: setCreateOpen(true)

CreateFolderDialog.tsx (Radix Dialog, focus-trapped)
  ← user fills in name, picks Theory/Coding/Mixed, optional exam date
  → form onSubmit: calls createFolder({ name, kind, examDate })

src/features/folders/folderActions.ts :: createFolder(input)
  ← validates name is non-empty (throws if blank)
  → db.folders.add({ name, kind, examDate, createdAt: Date.now() })
    (Dexie writes to IndexedDB, returns auto-incremented id)
  → toast.success(`Created "${name}"`)

src/features/folders/useFolders.ts :: useFolders()
  ← called by FolderTree (inside Sidebar)
  ← useLiveQuery(() => db.folders.orderBy('createdAt').toArray())
  → Dexie's reactive subscription fires because the `folders` table changed
  → React re-renders FolderTree with the new folder in the list

Dialog closes (onOpenChange(false)), state resets via reset().
```

Files touched in order:

1. `src/components/sidebar/Sidebar.tsx` — opens dialog
2. `src/features/folders/CreateFolderDialog.tsx` — collects input, calls action
3. `src/features/folders/folderActions.ts` — validates, writes to DB, fires toast
4. `src/db/index.ts` — Dexie `db.folders.add()`
5. `src/features/folders/useFolders.ts` — reactive hook (already subscribed) fires
6. `src/components/sidebar/FolderTree.tsx` — re-renders with new folder

No prop-drilling. The live query in step 5 is the only wire between the write and the re-render.

---

## 4 · Architecture violations

The rules under review:

| Rule | Description |
|------|-------------|
| **R1** | Components must not import `@/db` or call AI providers directly |
| **R2** | Business logic (scoring, scheduling, grading, chunking) lives in pure functions with no React or storage imports |
| **R3** | Heavy work (parsing, running code) runs in Web Workers |
| **R4** | Shared data shapes are defined once as Zod schemas |

### R1 — Components importing the database layer

Three files in the UI layer reach past the `*Actions.ts` abstraction and call `db` directly:

| File | Line | What it does |
|------|------|-------------|
| `src/app/pages/note-editor.tsx` | 219 | `db.files.update(…)` to persist active page index |
| `src/app/pages/code-practice.tsx` | 87 | `db.files.update(…)` to persist notes-panel tab metadata |
| `src/features/tabs/TabBar.tsx` | 41 | `db.files.where('id').anyOf(ids)` to hydrate the tab bar |

The first two are thin inline writes that belong in `fileActions.ts` (e.g. `updateFileMeta(id, patch)`). `TabBar.tsx`'s query is read-only and is already wrapped in `useLiveQuery`, so it is a lower-priority violation, but it still bypasses the file-hooks abstraction.

### R2 — Business logic inside hooks/components that should be pure

The **readiness scoring** in `src/features/folders/useReadiness.ts` mixes the scoring arithmetic (averaging attempt scores) with the database query inside a single `useLiveQuery`. The averaging formula is not independently testable.

```
// Current: query + arithmetic tangled together
useLiveQuery(async () => {
  ...
  return counted === 0 ? 0 : Math.round(total / counted)   // ← should be pure fn
})
```

A `computeReadiness(latestAttempts: Attempt[]): number` pure function would be independently testable and keep the hook to data-fetching only.

### R3 — Heavy work in Web Workers ✓

Parsing (PDF/DOCX/PPTX) runs in `parsers/parseWorker.ts`.  
Python execution runs in `runner/python.worker.ts`.  
JS execution runs in `runner/js.worker.ts`.  
This rule is fully satisfied.

### R4 — Shared data shapes defined as Zod schemas

Only two Zod schemas exist today (`QuizSchema`, `FlashcardsSchema` in `src/features/agent/schemas.ts`). All other shared shapes (`Folder`, `HoneFile`, `Chunk`, `Attempt`, `CalEvent`, `Task`) are plain TypeScript interfaces in `src/db/types.ts` without runtime validation. This means:

- No runtime validation of data read from IndexedDB (stale/corrupt records fail silently)
- No validation of data received from the AI pipeline (currently a stub)

The `src/db/types.ts` interfaces should have corresponding Zod schemas so records can be validated at the read boundary. This is a gradual migration, not a blocker.

**Summary table:**

| Rule | Status | Severity |
|------|--------|----------|
| R1 — no direct DB in components | ❌ 3 violations | Medium |
| R2 — pure business logic | ❌ readiness scoring mixed | Low |
| R3 — workers for heavy work | ✅ satisfied | — |
| R4 — Zod for all data shapes | ⚠️ only AI output schemas | Low |

---

## 5 · Ten largest files

| # | File | Lines | Split? |
|---|------|-------|--------|
| 1 | `src/app/pages/note-editor.tsx` | 568 | **Yes.** Mixes page layout, pagination, split-pane view, outline panel, word count, toolbar, and Cmd+F. Extract `<NoteOutlinePanel>`, `<NoteToolbar>`, and `<SplitPaneView>` as feature components. |
| 2 | `src/features/agent/CreateWithAiDialog.tsx` | 504 | **Borderline.** Most of it is the three sub-components (`TypeCard`, `SegmentedControl`, `SourceRow`) plus the `DialogInner` state machine. Readable but could extract the sub-components to `CreateWithAiDialog/` subfolder if it grows. |
| 3 | `src/features/code/NotesPanel.tsx` | 462 | **Yes.** Manages image drag-drop, tab rename/reorder/delete, paste handling, and CodeMirror for each tab. Extract `<ImageTab>` and `<NotesTabBar>`. |
| 4 | `src/app/pages/folder.tsx` | 361 | **No.** Three small components (`FileBadge`, `FileRow`, `StatCard`) plus the page; all are folder-specific and the file reads cleanly. |
| 5 | `src/app/pages/code-practice.tsx` | 306 | **Borderline.** Split `<SnapshotPanel>` out and move the inline `updateMeta` DB call to `fileActions.ts`. |
| 6 | `src/features/files/AiFileViewer.tsx` | 293 | **No.** Three viewer sub-components (`QuizViewer`, `FlashcardsViewer`, `MarkdownViewer`) that are unlikely to be reused elsewhere. Fine as one file. |
| 7 | `src/features/tabs/TabBar.tsx` | 194 | **No.** Complex but self-contained. |
| 8 | `src/features/files/FileActionsMenu.tsx` | 189 | **No.** Two dialogs (rename + delete) plus the dropdown in one file; they share state. |
| 9 | `src/features/folders/CreateFolderDialog.tsx` | 179 | **No.** One form, one responsibility. |
| 10 | `src/features/planner/AddEventDialog.tsx` | 157 | **No.** Straightforward form dialog. |

---

## 6 · Refactor plan (riskiest first)

### P1 — Fix direct DB imports in pages [risk: medium]

Two page-level files call `db` without going through the actions layer.

**`note-editor.tsx`** persists page metadata inline:
```ts
// Inline (bad)
db.files.update(file.id!, { meta: { ...file.meta, pages, activePage } })

// Move to fileActions.ts
export async function updateFileMeta(id: number, meta: Record<string, unknown>): Promise<void>
```

**`code-practice.tsx`** persists tab state inline with the same pattern. The same new function covers it.

Why first: direct DB calls in pages are the highest-coupling violation and the easiest to regress (future devs add more inline writes).

### P2 — Fix direct DB query in TabBar [risk: low]

`TabBar.tsx` queries `db.files` directly. Move the query into a new hook `useTabFiles(openIds)` in `src/features/files/useFiles.ts`. The fix is mechanical but needs care: the hook tags the query result with the ids it queried to detect stale results (that logic must transfer unchanged).

### P3 — Extract readiness scoring to a pure function [risk: low]

```ts
// src/features/folders/readiness.ts (new)
export function computeReadiness(latestAttempts: Attempt[]): number {
  if (latestAttempts.length === 0) return 0
  const total = latestAttempts.reduce((n, a) => n + a.score, 0)
  return Math.round(total / latestAttempts.length)
}

// useReadiness.ts — fetches attempts, calls computeReadiness()
```

Benefit: the averaging logic gains a unit test; the hook becomes thin data plumbing.

### P4 — Split note-editor.tsx [risk: medium]

Extract:
- `<NoteOutlinePanel>` → `features/notes/OutlinePanel.tsx`
- `<NoteToolbar>` → `features/notes/NoteToolbar.tsx`

Keeps note-editor under ~250 lines and makes the outline panel reusable.

### P5 — Add Zod schemas for DB records [risk: low, long-term]

Start with `HoneFile` since it carries the widest `meta: Record<string, unknown>` bag. Add a `HoneFileSchema` in `src/db/schemas.ts` and parse records at the `useFile` / `useFiles` read boundary. Introduce gradually — validate on read, not on every write.

---

## 7 · CI rule — no direct DB imports in components

The following rule is added to `eslint.config.js`. It fails `pnpm lint` if a file under `src/app/` or `src/components/` imports `@/db` or `dexie` directly.

See the restriction in `eslint.config.js`:
```js
// src/components/** must not import the db singleton or dexie directly.
// Uses `paths` (exact matching) so @/db/types (plain TS interfaces) is
// unaffected — `patterns` would have matched it as a prefix.
{
  files: ['src/components/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': ['error', {
      paths: [
        { name: '@/db',              message: 'Import db via a feature action or hook. See docs/architecture.md § R1.' },
        { name: 'dexie',             message: 'Import db via a feature action or hook. See docs/architecture.md § R1.' },
        { name: 'dexie-react-hooks', message: 'Import db via a feature action or hook. See docs/architecture.md § R1.' },
      ]
    }]
  }
}
```

> **Current violations that this rule would catch** (must be fixed before enabling for `src/app/`):
> - `src/app/pages/note-editor.tsx` line 25
> - `src/app/pages/code-practice.tsx` line 14

The rule is already active for `src/components/**` (no violations there). Once P1 and P2 are resolved, extend the pattern to cover `src/features/**/*.tsx` as well.

---

## 8 · AI layer

The AI pipeline, provider interface, and design decisions (why no RAG in v1, grounding
strategy, provider tiers, map-reduce for large documents) are documented separately:

**[docs/ai-architecture.md](ai-architecture.md)**
