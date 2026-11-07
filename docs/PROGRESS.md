# Hone – progress

Updated after every step. A milestone is ticked only when it passes lint + typecheck + tests.

---

## Health check (last run: AI-generated files UI + architecture audit)

| Check | Result |
|-------|--------|
| `pnpm typecheck` | ✅ pass |
| `pnpm lint` | ✅ pass (0 warnings) |
| `pnpm test` | ✅ 140/140 pass (19 test files) |
| `pnpm dev` | ✅ serves on :5173 |
| `pnpm build` | ✅ builds (workers emitted; chunk-size warning only) |

> Scroll-sync, outline highlighting, drag-reorder and keyboard shortcuts need a
> manual browser pass. Pure logic (outline, scroll-sync, tab reducers, debounce,
> AI source selection, defaultFileName numbering) is unit-tested.

### AI-generated files (stub UI)
- **Create with AI** dialog: four type cards (Quiz, Flashcards, AI notes, Cheat sheet),
  source checklist (notes + uploads only, AI-made excluded) with "about N pages" hint,
  empty-folder state with Add note / Upload shortcuts, type-specific segmented controls
  (count, difficulty, focus, length, density), 3-stage progress display
  (reading → writing → saving), error state with retry, dev-only simulate-error checkbox.
  Radix Dialog focus trap; Escape closes; generating blocks close.
- **AI File Viewer**: quiz (reveal answer + explanation per question), flashcards
  (flip card + dot navigator + reset), AI notes / cheat sheet (Markdown render).
  "Sample content" badge on stub output.
- **generateFile stub** (`src/features/agent/generateFile.ts`): waits 1.5 s, returns
  sample content from `src/fixtures/aiSamples.ts`; supports `AbortSignal` and
  `simulateError`; saves to IndexedDB with `isSample: true` meta.
- **Entry points**: "Create with AI" button on folder page; AI-generated file item in
  New file menu (enabled); AI-made tab empty state with Create button.
- **After generation**: dialog closes, toast fires with an **Open** button (6 s TTL),
  folder page switches to AI-made tab, new row highlighted for 2.5 s.
- **File row actions menu** (`FileActionsMenu.tsx`): `…` button on every file row;
  Rename dialog (pre-filled, Enter saves) and Delete confirmation for all file types.
- **Sparkle ✨ icon** for all AI file types in sidebar tree and tab bar.
- **Toast action buttons** (`toast.successWithAction`): extended toast store to support
  an optional action button with configurable TTL.
- **Data contract** (`docs/data-contract.md`): provisional Zod schemas for quiz /
  flashcards; AI notes and cheat sheets are plain Markdown. Marked provisional — confirm
  with the teammate building the real AI pipeline before finalising.
- 14 new tests: agent logic (options per type, source selection, defaultFileName
  numbering, AI-made tab mapping) + generateFile (saves correctly, numbering, error).

### Architecture audit + CI
- `docs/architecture.md` written: layer diagram, folder responsibilities, end-to-end
  walk-through (create folder), violations report (R1–R4), 10 largest files, refactor
  plan P1–P5 (riskiest first).
- **ESLint architectural guard** (`eslint.config.js`): `no-restricted-imports` rule
  (using `paths` exact matching, not prefix patterns) blocks `@/db` / `dexie` /
  `dexie-react-hooks` inside `src/components/**`. Known violations in two pages tracked
  as P1 in the refactor plan.
- **GitHub Actions CI** (`.github/workflows/ci.yml`): lint → typecheck → test → build
  on every push/PR to main. pnpm 10 pinned.

### App shell + long-note editor
- Root is `100dvh` with no page scroll; sidebar scrolls with "New folder" pinned;
  each screen has a fixed header/toolbar and a single scrolling content area
  (Home, folder, Planner, note editor, code practice).
- Note editor: editor and preview scroll independently; Split syncs scroll
  proportionally; formatting toolbar is sticky.
- Outline panel (toggle) from Markdown headings — click scrolls editor + preview,
  current section highlighted. Cmd/Ctrl+F opens in-note search.
- Preview "Keep line breaks" (remark-breaks), default on, remembered in settings.
- Preview rendering debounced (200 ms); verified with a ~5,000-line note.

### Open-file tabs
- Tab bar above the content area (notes, uploads, code) with icon + name + close.
  Opening a file focuses its tab or opens a new one (route-synced).
- Middle-click / close button close; Cmd/Ctrl+W closes current; Cmd/Ctrl+1..9
  switch; drag reorders; overflow scrolls. `role="tablist"` + keyboard nav.
- Open tabs + active tab persisted in IndexedDB and restored on reload; deleted
  files close their tab quietly. Study session stays full-screen with no tab bar.

### Folder-kind rules (`getAllowedTools`)
- theory: notes + uploads + AI files; no code practice.
- coding: uploads + code practice + AI (incl. coding problems); **no standalone
  notes** — Blank-note item and Notes filter tab hidden.
- mixed: everything. Changing kind never deletes files; disallowed types stay
  under "All". `deleteFile` now also cleans the upload blob + note-image blobs.

### Code practice notes panel (tabbed)
- Tabs: Problem (fixed) + add Text (Markdown) / Image tabs; rename (dbl-click),
  reorder (drag), delete (confirm). Persisted in file meta with autosave.
- Image tabs: paste / drag-drop / picker, stacked, click to enlarge (lightbox),
  resized to ≤1600px on import, stored as blobs; deleting a tab/image frees blobs.
  Hint shown that images aren't read by the AI.
- Resizable + collapsible panel, `role="tablist"` + keyboard nav + focus rings.
- ⚠️ Study-pack export/import does not exist yet, so there was nothing to wire
  image-inclusion into. Images are stored as blob-ids in meta, so they'll be
  export-ready when that feature is built.

> End-to-end upload (drop a real file → parse → view) needs manual browser
> verification — parser/chunker logic is covered by unit tests with fixtures.

### Folders & notes polish (closes several gaps below)
- Folder "..." menu (Rename / Edit exam date / Delete) on the **folder page** and
  in the **sidebar**, via a shared `FolderActionsMenu`; delete keeps its confirm dialog.
- New `EditExamDateDialog`; toast messages on folder create / rename / delete / exam-date.
- Note editor: breadcrumb, formatting toolbar (bold, italic, heading, list, code),
  empty-editor placeholder, live word count. Fixed an async-mount bug where the
  editor could initialise before the file loaded.
- Friendly, distinct empty states for an empty folder vs an empty filter tab.
- Toast system (`src/lib/toast.ts` + `Toaster`), no new dependency.
- New tests: markdown commands + word count, toast store, `updateFolderExamDate`.

---

## Design system

Brand palette: **salmon pink + teal green**, applied as a semantic token system with
a **light + dark theme toggle** (persisted to localStorage, `.dark` on `<html>`).

- Light: salmon-cream canvas, teal sidebar, dark-teal headings.
- Dark: neutral charcoal canvas, deep-teal sidebar, salmon headings for a warm accent.
- Rule: **teal = structural/interactive** (buttons, active states, progress),
  **salmon = identity/highlight** (kind badges, NOTE badges, headings in dark).
- Reusable primitives: `components/ui/{Button, ProgressBar, ThemeToggle, ComingSoon}`.
- Theme-aware tokens in `src/index.css`; `src/lib/theme.ts` holds the toggle store.

---

## Mockup gap analysis

Comparison of the running app against the design mockups (the 8-screen PDF in
the project brief). **Note:** there is no `docs/design/` folder on disk yet — the
mockups live in the brief, so they should be exported into `docs/design/` for
future contributors. This audit uses **layout and content only**; the current
teal + salmon palette and dark mode are intentional and are *not* gaps.

Legend: ✅ matches · ⚠️ partial · ❌ missing · **[AI]** needs the AI layer ·
**[data]** needs quiz/attempt/task data that doesn't exist yet · **[no-AI]** can
be built with no AI and no new data source.

### Screen 1 · Home
- ✅ Sidebar (Home, Planner, folder tree, New folder) · **[no-AI]**
- ✅ Upcoming exams with countdowns + readiness · **[no-AI]**
- ✅ Folder cards with file count, exam countdown, readiness · **[no-AI]**
- ⚠️ Header reads greeting ("Good afternoon") not the mockup's "Today" title · **[no-AI]**
- ⚠️ "Continue studying" card — shows last-opened file; no in-progress quiz counter · **[data]**
- ✅ "Today's plan" checklist (TodoList, tasks due today, quick-add) · **[no-AI]**
- ❌ "Agent suggestions" (weakest topic → Make flashcards, few notes → Add notes) · **[AI]** + **[data]**
- ❌ "Open planner" button inside the exams card · **[no-AI]**

### Screen 2 · Create folder dialog
- ✅ Name, kind (theory/coding/mixed), optional exam date, Cancel / Create · **[no-AI]** — matches mockup.

### Screen 3 · Folder workspace
- ✅ Breadcrumb, title, kind badge, exam countdown badge, + New file · **[no-AI]**
- ✅ File list with All / Notes / Uploads / AI-made / Practice tabs + type badges · **[no-AI]**
- ✅ Create with AI button + dialog (stub, all 4 types, sources, options, progress) · **[AI stub]**
- ✅ File row actions menu (rename / delete) · **[no-AI]**
- ⚠️ Stats row: has Readiness, Files, Exam. Mockup shows **Readiness, Quizzes taken (avg score), Weak topics**. "Files" and "Exam" substitute for the last two · **[data]** (quizzes taken + weak topics need attempts)
- ❌ Real AI generation (stub returns sample content; real provider not wired yet) · **[AI]**

### Screen 4 · Add file menu
- ✅ Upload files, Blank note, Code practice present and working · **[no-AI]**
- ✅ "AI-generated file" item now enabled, opens Create with AI dialog · **[AI stub]**

### Screen 5 · Note editor
- ✅ Markdown editor + live preview, inline rename, delete · **[no-AI]**
- ⚠️ Autosave + "Saved" status instead of an explicit **Save** button (arguably better; note as a deliberate divergence) · **[no-AI]**
- ❌ Summarise / Make flashcards / Make quiz buttons · **[AI]**

### Screen 6 · Study session
- ❌ Entire screen is a "coming soon" placeholder. Mockup: focus mode (no sidebar), card counter "7 of 15", progress bar, Question/Answer flip, source citation, Again/Hard/Good/Easy ratings, keyboard hints · **[no-AI]** (the viewer + spaced-repetition is plain logic; it only needs flashcard files, which may be hand-made or AI-made)
- ⚠️ Flashcard and quiz *viewers* now exist inside AiFileViewer (AI-made tab) — but the full study-session flow (SRS ratings, attempts, progress) is still a placeholder.

### Screen 7 · Code practice
- ✅ Editor + language selector (Python / JS / Java) + Run + output panel · **[no-AI]**
- ✅ Tabbed notes panel + image tabs + snapshots · **[no-AI]**
- ❌ Problem statement "made by the agent from your notes" + **Get hint** · **[AI]**

### Screen 8 · Planner
- ✅ Month calendar, exam/study events, prev/next month · **[no-AI]**
- ✅ Add-event dialog (title, date, folder, kind) · **[no-AI]**
- ✅ Selected-day agenda + to-do list (tasks table) · **[no-AI]**
- ✅ Countdowns panel — per-exam countdown + readiness bar · **[no-AI]**
- ❌ "Weak topics · N missed sessions · Reschedule" · **[data]**
- ❌ **Generate study plan** · **[AI]**

### Settings (required by brief, not a numbered mockup)
- ❌ "coming soon" placeholder. Needs provider / base URL / model / API key / Test connection · **[AI]**

### Cross-cutting
- ✅ Shared sidebar + folder tree + routing · **[no-AI]**
- ❌ Readiness/quizzes/weak-topics everywhere currently show 0 / absent until the **quiz + attempts** features exist · **[data]**

### Summary — what's left, by dependency
- **No AI, buildable now:** Study-session viewer + SRS (Step 4), "Open planner" link, folder-workspace "quizzes taken / weak topics" once attempts exist.
- **AI layer (real providers):** real `generateFile` body (teammate replaces stub); Settings provider config; note-editor Summarise/Make flashcards/Make quiz; Home agent suggestions; code-practice Get hint; Planner "Generate study plan".
- **Needs quiz/attempt/task data first:** readiness > 0, quizzes-taken + average score, weak topics, Home "Continue" card, missed-sessions.

---

## Milestones

### Step 1 · Scaffold & shell ✅
- [x] Vite + React 19 + TypeScript 5.8, pnpm, path alias `@/*`
- [x] ESLint, Prettier, Vitest configured
- [x] Tailwind v4 design tokens (colors, fonts, radius, shadow)
- [x] Dexie schema – all 7 tables with typed interfaces
- [x] Folder CRUD (create / rename / delete with cascade)
- [x] 8 unit tests for folder actions (fake-indexeddb)
- [x] App shell – sidebar, folder tree, all routes, placeholder pages
- [x] CreateFolderDialog, RenameFolderDialog, DeleteFolderAlert
- [x] README, CONTRIBUTING, LICENSE (MIT), docs/architecture.md
- [x] Repo pushed to github.com/sneha-thyagarajan/hone

### Step 2 · Folder workspace, file list, note editor ✅
- [x] Folder workspace page – header (name, kind badge, exam countdown)
- [x] File list with filter tabs (All / Notes / Uploads / AI-made / Practice)
- [x] Sidebar folder tree – open folder expands to show its files
- [x] "+ New file" menu – Blank note ✦, Code practice ✦, Upload, AI (now enabled)
- [x] File CRUD actions – createFile, renameFile, deleteFile, saveFileContent
- [x] File row actions menu – rename dialog + delete confirmation on every row
- [x] Note editor – CodeMirror Markdown editor + live preview (react-markdown + rehype-sanitize)
- [x] Autosave to Dexie (debounced 800 ms) with Saved / Saving status badge
- [x] Inline rename (click title to edit) and delete from editor toolbar
- [x] File type dispatcher – routes `/files/:id` to the right editor by `file.type`
- [x] Unit tests – file create / rename / delete / autosave (17 total)

### Step 3 · File upload & parsing ✅
- [x] Drag-and-drop + "Upload files" picker (PDF, PPTX, DOCX, Markdown, TXT)
- [x] pdf.js → extract text + per-page chunks
- [x] JSZip → PPTX slide XML → per-slide text
- [x] mammoth → DOCX → text
- [x] Markdown / TXT decoded as UTF-8
- [x] Parsing runs in a Web Worker (pdf.js uses its own worker)
- [x] Original blob stored in `blobs` table (Dexie v2); chunks saved with source + page
- [x] Upload progress toasts + friendly errors
- [x] Viewer shows extracted text by page
- [x] Unit tests: chunker + each parser with in-memory fixtures (36 total)

### Step 7 · Planner ✅ (AI study-plan generator intentionally excluded)
- [x] Month calendar with exam + study events, prev/next month
- [x] Calendar merges folder exam dates + user events (`useCalendarItems`)
- [x] Add-event dialog (title, date, folder, kind)
- [x] Selected-day agenda (events + that day's to-dos)
- [x] Countdowns panel — per-exam countdown + readiness bar (`ExamCountdowns`, shared with Home)
- [x] `tasks` table actions/hooks + reusable `TodoList`
- [x] Countdowns & readiness are plain calculations (no AI)
- [~] "Generate study plan" — deliberately **not** built (that's the AI layer)

### Step 8 · Home screen ✅ (agent suggestions deferred to AI layer)
- [x] "Continue studying" card (most recently opened note/practice/study file via `openedAt`)
- [x] Today's plan widget (tasks due today, checkboxes, quick-add)
- [x] Upcoming exams countdown strip (shared `ExamCountdowns`)
- [x] Folder cards grid with readiness
- [~] Agent suggestions — deferred (needs AI layer + quiz data)

### Step 6 · AI agent ⚠️ (UI stub done; real provider not yet wired)
- [x] Zod schemas for quiz and flashcards content (`src/features/agent/schemas.ts`)
- [x] `AiType`, `TYPE_META`, `OPTION_FIELDS`, `defaultOptions` (`types.ts`)
- [x] Source selection helpers: `selectableSources`, `estimatePages`, `defaultFileName` (`sources.ts`)
- [x] `generateFile` stub — 1.5 s delay, sample content, `AbortSignal`, `simulateError` (`generateFile.ts`)
- [x] Sample AI content fixtures (`src/fixtures/aiSamples.ts`)
- [x] Data contract documented (`docs/data-contract.md`) — provisional; needs teammate sign-off
- [x] Create with AI dialog — type cards, sources, options, progress, error state
- [x] AI File Viewer — quiz (reveal), flashcards (flip), AI notes / cheat sheet (Markdown)
- [x] "Sample content" badge on stub output
- [x] 14 unit tests for agent logic + generateFile stub
- [ ] Real provider interface `generate({ prompt, schema })`
- [ ] OpenAI-compatible adapter (plain fetch)
- [ ] Mock adapter (hardcoded JSON, no key needed)
- [ ] Prompt templates: flashcards, quiz, mock test, notes summary
- [ ] Settings screen (provider, base URL, model, API key, test connection)
- [ ] Retry once on bad JSON; real source citations

### Step 4 · Study session (flashcards + SRS) ⬜
- [ ] Full study-session page (focus mode, no sidebar)
- [ ] Spaced-repetition ratings (Again / Hard / Good / Easy) → intervals
- [ ] Progress bar, card counter, source citation
- [ ] Persist attempts; update readiness score
- [ ] Unit tests for SRS interval logic
- ⚠️ Basic flashcard + quiz viewers exist in AiFileViewer (AI-made tab) but without SRS or attempts

### Step 5 · Code practice ✅ (free-form scratchpad, per user direction)
- [x] CodeMirror editor (dark, oneDark) with Python / JavaScript / Java language switch
- [x] Run executes code in a Web Worker and shows captured output + errors
- [x] Python via Pyodide (loaded from CDN only on first run); JS in its own worker
- [x] Timeout kills runaway code (infinite loops) by terminating the worker
- [x] Editable notes panel (tabbed, images) saved per file; code autosaves
- [x] Save/restore timestamped snapshots
- [x] Unit tests for the JS run harness (output + error capture)
- Note: original pass/fail problem pack was replaced with a free-form scratchpad
  (editable notes + run-output) at the user's request; no problem generation.

### Step 9 · Polish & PWA ⬜
- [ ] vite-plugin-pwa (offline-first, installable)
- [ ] Keyboard shortcuts (space to flip card, 1–4 to rate)
- [ ] Responsive layout (tablet)
- [ ] Playwright e2e – create folder → create note → open editor
- [ ] Accessibility audit (axe-core)


> Scroll-sync, outline highlighting, drag-reorder and keyboard shortcuts need a
> manual browser pass. Pure logic (outline, scroll-sync, tab reducers, debounce)
> is unit-tested.

### App shell + long-note editor
- Root is `100dvh` with no page scroll; sidebar scrolls with "New folder" pinned;
  each screen has a fixed header/toolbar and a single scrolling content area
  (Home, folder, Planner, note editor, code practice).
- Note editor: editor and preview scroll independently; Split syncs scroll
  proportionally; formatting toolbar is sticky.
- Outline panel (toggle) from Markdown headings — click scrolls editor + preview,
  current section highlighted. Cmd/Ctrl+F opens in-note search.
- Preview "Keep line breaks" (remark-breaks), default on, remembered in settings.
- Preview rendering debounced (200 ms); verified with a ~5,000-line note.

### Open-file tabs
- Tab bar above the content area (notes, uploads, code) with icon + name + close.
  Opening a file focuses its tab or opens a new one (route-synced).
- Middle-click / close button close; Cmd/Ctrl+W closes current; Cmd/Ctrl+1..9
  switch; drag reorders; overflow scrolls. `role="tablist"` + keyboard nav.
- Open tabs + active tab persisted in IndexedDB and restored on reload; deleted
  files close their tab quietly. Study session stays full-screen with no tab bar.

### Folder-kind rules (`getAllowedTools`)
- theory: notes + uploads + AI files; no code practice.
- coding: uploads + code practice + AI (incl. coding problems); **no standalone
  notes** — Blank-note item and Notes filter tab hidden.
- mixed: everything. Changing kind never deletes files; disallowed types stay
  under "All". `deleteFile` now also cleans the upload blob + note-image blobs.

### Code practice notes panel (tabbed)
- Tabs: Problem (fixed) + add Text (Markdown) / Image tabs; rename (dbl-click),
  reorder (drag), delete (confirm). Persisted in file meta with autosave.
- Image tabs: paste / drag-drop / picker, stacked, click to enlarge (lightbox),
  resized to ≤1600px on import, stored as blobs; deleting a tab/image frees blobs.
  Hint shown that images aren't read by the AI.
- Resizable + collapsible panel, `role="tablist"` + keyboard nav + focus rings.
- ⚠️ Study-pack export/import does not exist yet, so there was nothing to wire
  image-inclusion into. Images are stored as blob-ids in meta, so they'll be
  export-ready when that feature is built.

> End-to-end upload (drop a real file → parse → view) needs manual browser
> verification — parser/chunker logic is covered by unit tests with fixtures.

### Folders & notes polish (closes several gaps below)
- Folder "..." menu (Rename / Edit exam date / Delete) on the **folder page** and
  in the **sidebar**, via a shared `FolderActionsMenu`; delete keeps its confirm dialog.
- New `EditExamDateDialog`; toast messages on folder create / rename / delete / exam-date.
- Note editor: breadcrumb, formatting toolbar (bold, italic, heading, list, code),
  empty-editor placeholder, live word count. Fixed an async-mount bug where the
  editor could initialise before the file loaded.
- Friendly, distinct empty states for an empty folder vs an empty filter tab.
- Toast system (`src/lib/toast.ts` + `Toaster`), no new dependency.
- New tests: markdown commands + word count, toast store, `updateFolderExamDate`.

