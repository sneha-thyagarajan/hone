# Hone – progress

Updated after every step. A milestone is ticked only when it passes lint + typecheck + tests.

---

## Health check (last run: UI redesign + theming)

| Check | Result |
|-------|--------|
| `pnpm typecheck` | ✅ pass |
| `pnpm lint` | ✅ pass (0 warnings) |
| `pnpm test` | ✅ 17/17 pass |
| `pnpm dev` | ✅ serves on :5173 |
| `pnpm build` | ✅ builds (chunk-size warning only – expected until code-splitting) |

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

### Step 3 · File upload & parsing ⬜
- [ ] Drag-and-drop + file picker (PDF, PPT/PPTX, DOCX)
- [ ] pdf.js → extract text + page chunks
- [ ] JSZip → PPTX slide XML → text
- [ ] mammoth → DOCX → Markdown
- [ ] Store chunks in Dexie

### Step 4 · Study session (flashcards + SRS) ⬜
- [ ] Flashcard viewer – question / answer flip
- [ ] Spaced-repetition ratings (Again / Hard / Good / Easy) → intervals
- [ ] Progress bar, card counter, source citation
- [ ] Persist attempts; update readiness score
- [ ] Unit tests for SRS interval logic

### Step 5 · Code practice ⬜
- [ ] Code editor (CodeMirror, Python / JS)
- [ ] Pyodide Web Worker with timeout
- [ ] JS sandbox Web Worker with timeout
- [ ] Test-runner UI (pass / fail per case)
- [ ] Saved attempts panel
- [ ] Hint button

### Step 6 · AI agent ⬜
- [ ] Provider interface `generate({ prompt, schema })`
- [ ] OpenAI-compatible adapter (plain fetch)
- [ ] Mock adapter (hardcoded JSON, no key needed)
- [ ] Prompt templates: flashcards, quiz, mock test, notes summary
- [ ] Agent panel in folder workspace
- [ ] Zod schemas for each output type
- [ ] Retry once on bad JSON; save as file with source citations
- [ ] Settings screen (provider, base URL, model, API key, test connection)

### Step 7 · Planner ⬜
- [ ] Month calendar (exam events + study sessions)
- [ ] Countdowns ("27 days") derived from exam dates
- [ ] Readiness score (weighted average of attempt scores)
- [ ] Today's plan to-do list
- [ ] Generate study plan (fills calendar from exam dates)

### Step 8 · Home screen ⬜
- [ ] "Continue" card (most recent in-progress file)
- [ ] Today's plan widget
- [ ] Agent suggestions (weak topics, missing notes)
- [ ] Upcoming exams countdown strip
- [ ] Folder cards grid with readiness

### Step 9 · Polish & PWA ⬜
- [ ] vite-plugin-pwa (offline-first, installable)
- [ ] Keyboard shortcuts (space to flip card, 1–4 to rate)
- [ ] Responsive layout (tablet)
- [ ] Playwright e2e – create folder → create note → open editor
- [ ] Accessibility audit (axe-core)
