# Hone

A local-first study workspace where students organise study material per subject and use an AI agent to turn their own notes into practice material — flashcards, quizzes, mock tests, and code problems.

**Everything runs in the browser.** No backend, no account, no subscription.

---

## Features

- **Folders** – one per subject (Theory / Coding / Mixed), with an optional exam date.
- **Files** – upload PDFs/PPTs/DOCX, write Markdown notes, or add a code practice file with a test runner.
- **AI agent** – select your notes, choose an output type (flashcards, quiz, mock test, study plan), and the agent generates a structured file citing the source pages. Bring your own key, use a local model via Ollama, or run in mock mode (no key needed).
- **Study sessions** – distraction-free flashcard review with spaced-repetition ratings (Again / Hard / Good / Easy).
- **Code practice** – Python/JavaScript editor with a sandboxed test runner; expected outputs come from running a reference solution, not from the model's guess.
- **Planner** – month calendar with exam countdowns and readiness scores derived from quiz results.

---

## Quick start

```bash
# 1. Clone the repo
git clone https://github.com/<your-org>/hone.git
cd hone

# 2. Install dependencies (Node 20+ and pnpm required)
pnpm install

# 3. Optional: configure AI (the app works without it)
cp .env.example .env
#  → edit .env and fill in VITE_AI_BASE_URL, VITE_AI_MODEL, VITE_AI_KEY

# 4. Start the dev server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Tech stack

| Layer | Library |
|-------|---------|
| Framework | React 19 + Vite + TypeScript (strict) |
| Routing | React Router v7 |
| State | Zustand, Dexie.js (IndexedDB) |
| Styling | Tailwind CSS v4 + Radix UI primitives |
| Editors | CodeMirror 6 (Markdown + code) |
| Parsing | pdf.js, JSZip, mammoth |
| AI | Pluggable provider interface; OpenAI-compatible + mock adapters |
| Validation | Zod |
| Testing | Vitest + React Testing Library + Playwright |

---

## AI setup

The AI features are **opt-in** and work with any OpenAI-compatible endpoint.

| Provider | `VITE_AI_BASE_URL` | Notes |
|----------|--------------------|-------|
| OpenAI | `https://api.openai.com/v1` | Set `VITE_AI_KEY` |
| Ollama (local) | `http://localhost:11434/v1` | Free, runs offline |
| LM Studio | `http://localhost:1234/v1` | Free, runs offline |
| Groq | `https://api.groq.com/openai/v1` | Fast, generous free tier |
| Mock (demo) | *(leave blank)* | Returns sample JSON, no key needed |

---

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # TypeScript check + production build
pnpm typecheck    # Type-check only (no emit)
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm test         # Vitest (unit tests)
pnpm test:ui      # Vitest browser UI
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). In short:

1. Fork and clone.
2. `pnpm install`
3. Create a branch: `git checkout -b feat/your-feature`
4. Write tests for new logic.
5. `pnpm lint && pnpm typecheck && pnpm test` must all pass.
6. Open a PR with a clear description.

---

## License

[MIT](LICENSE)
