# Hone – progress

Updated after every step. A milestone is ticked only when it passes lint + typecheck + tests.

---

## Health check (last run: folder-kind rules + tabbed code notes)

| Check | Result |
|-------|--------|
| `pnpm typecheck` | ✅ pass |
| `pnpm lint` | ✅ pass (0 warnings) |
| `pnpm test` | ✅ 103/103 pass |
| `pnpm dev` | ✅ serves on :5173 |
| `pnpm build` | ✅ builds (runner + parser workers emitted; chunk-size warning only) |

> Runner execution (actual Python via Pyodide, JS worker, timeout kill) and the
> code notes panel's image paste/drop/resize need manual browser verification.
> Pure logic (harness, tab ops, folder rules) is unit-tested.

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
- ❌ "Continue studying" card (resume in-progress quiz, "question 3 of 10") · **[data]** (needs quiz progress/attempts)
- ❌ "Today's plan" checklist · **[no-AI]** for the to-do list itself (tasks table); the *auto-planning* ("from your exam dates and quiz results") is **[data]/[AI]**
- ❌ "Agent suggestions" (weakest topic → Make flashcards, few notes → Add notes) · **[AI]** + **[data]**
- ❌ "Open planner" button inside the exams card · **[no-AI]**

### Screen 2 · Create folder dialog
- ✅ Name, kind (theory/coding/mixed), optional exam date, Cancel / Create · **[no-AI]** — matches mockup.

### Screen 3 · Folder workspace
- ✅ Breadcrumb, title, kind badge, exam countdown badge, + New file · **[no-AI]**
- ✅ File list with All / Notes / Uploads / AI-made / Practice tabs + type badges · **[no-AI]**
- ⚠️ Stats row: has Readiness, Files, Exam. Mockup shows **Readiness, Quizzes taken (avg score), Weak topics**. "Files" and "Exam" substitute for the last two · **[data]** (quizzes taken + weak topics need attempts)
- ❌ AI agent panel on the right (choose Notes/Flashcards/Quiz/Mock, tick source notes, count + difficulty options, Generate) · **[AI]**

### Screen 4 · Add file menu
- ✅ Upload files, Blank note, Code practice present and working · **[no-AI]**
- ⚠️ "AI-generated file" item present but disabled · **[AI]**

### Screen 5 · Note editor
- ✅ Markdown editor + live preview, inline rename, delete · **[no-AI]**
- ⚠️ Autosave + "Saved" status instead of an explicit **Save** button (arguably better; note as a deliberate divergence) · **[no-AI]**
- ❌ Summarise / Make flashcards / Make quiz buttons · **[AI]**

### Screen 6 · Study session
- ❌ Entire screen is a "coming soon" placeholder. Mockup: focus mode (no sidebar), card counter "7 of 15", progress bar, Question/Answer flip, source citation, Again/Hard/Good/Easy ratings, keyboard hints · **[no-AI]** (the viewer + spaced-repetition is plain logic; it only needs flashcard files, which may be hand-made or AI-made)

### Screen 7 · Code practice
- ❌ Entire screen is a "coming soon" placeholder. Breakdown:
  - Editor + language selector + Run tests + test results + saved attempts · **[no-AI]** (CodeMirror + Pyodide/JS worker runner)
  - Problem statement "made by the agent from your notes" + **Get hint** · **[AI]**

### Screen 8 · Planner
- ❌ Entire screen is a "coming soon" placeholder. Breakdown:
  - Month calendar, exam/study events, countdowns, selected-day agenda, **+ Add event** · **[no-AI]**
  - "Weak topics · N missed sessions · Reschedule" · **[data]**
  - **Generate study plan** · **[AI]** (study plan is an AI output type per the brief)

### Settings (required by brief, not a numbered mockup)
- ❌ "coming soon" placeholder. Needs provider / base URL / model / API key / Test connection · **[AI]**

### Cross-cutting
- ✅ Shared sidebar + folder tree + routing · **[no-AI]**
- ❌ Readiness/quizzes/weak-topics everywhere currently show 0 / absent until the **quiz + attempts** features exist · **[data]**

### Summary — what's left, by dependency
- **No AI, buildable now:** Study-session viewer + SRS (Step 4), Code editor + runner + attempts (Step 5, minus hint/problem-gen), Planner calendar + countdowns + agenda + add-event + to-do list (Step 7), Home "Continue" + "Today's plan" list, "Open planner" link, folder-workspace "quizzes taken / weak topics" once attempts exist.
- **Needs the AI layer (Step 6):** folder AI agent panel, note-editor Summarise/Make flashcards/Make quiz, Home agent suggestions, code-practice problem generation + Get hint, Planner "Generate study plan", AI-generated-file menu action, Settings provider config.
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
- [x] "+ New file" menu – Blank note ✦, Code practice ✦, Upload (disabled), AI (disabled)
- [x] File CRUD actions – createFile, renameFile, deleteFile, saveFileContent
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

### Step 4 · Study session (flashcards + SRS) ⬜
- [ ] Flashcard viewer – question / answer flip
- [ ] Spaced-repetition ratings (Again / Hard / Good / Easy) → intervals
- [ ] Progress bar, card counter, source citation
- [ ] Persist attempts; update readiness score
- [ ] Unit tests for SRS interval logic

### Step 5 · Code practice ✅ (free-form scratchpad, per user direction)
- [x] CodeMirror editor (dark, oneDark) with Python / JavaScript language switch
- [x] Run executes code in a Web Worker and shows captured output + errors
- [x] Python via Pyodide (loaded from CDN only on first run); JS in its own worker
- [x] Timeout kills runaway code (infinite loops) by terminating the worker
- [x] Editable Question / notes panel saved per file; code autosaves
- [x] Save/restore timestamped snapshots
- [x] Unit tests for the JS run harness (output + error capture)
- Note: original pass/fail problem pack was replaced with a free-form scratchpad
  (editable notes + run-output) at the user's request; no problem generation.

### Step 6 · AI agent ⬜
- [ ] Provider interface `generate({ prompt, schema })`
- [ ] OpenAI-compatible adapter (plain fetch)
- [ ] Mock adapter (hardcoded JSON, no key needed)
- [ ] Prompt templates: flashcards, quiz, mock test, notes summary
- [ ] Agent panel in folder workspace
- [ ] Zod schemas for each output type
- [ ] Retry once on bad JSON; save as file with source citations
- [ ] Settings screen (provider, base URL, model, API key, test connection)

### Step 9 · Polish & PWA ⬜
- [ ] vite-plugin-pwa (offline-first, installable)
- [ ] Keyboard shortcuts (space to flip card, 1–4 to rate)
- [ ] Responsive layout (tablet)
- [ ] Playwright e2e – create folder → create note → open editor
- [ ] Accessibility audit (axe-core)
