# Hone — AI Architecture

> Written 2026-11-06. Reflects design decisions agreed before v1 coding began.
> Update this document when a decision changes, not after the fact.

---

## 1 · What the AI layer does

Hone takes the text a student has already written or uploaded (notes, PDFs, slides) and
generates structured study material from it. Four output types:

| Type | Format | Used for |
|------|--------|---------|
| **Quiz** | JSON — questions, options, answer index, explanation, evidence | Practice + self-assessment |
| **Flashcards** | JSON — front/back pairs, evidence | Spaced-repetition review |
| **AI notes** | Markdown | Structured summaries |
| **Cheat sheet** | Markdown | Dense one-page reference |

Every output cites the source chunks it was generated from (evidence-checked grounding —
see §4). Everything runs in the browser; no backend is required.

---

## 2 · Why no RAG or embeddings in v1

RAG (retrieval-augmented generation with embeddings) answers the question: *"which parts of
this material are relevant to this specific question?"* Hone's operations ask a different
question: *"cover this whole material."* That is a **coverage problem**, and retrieval is bad
at coverage — top-k similarity search clusters around a few topics and misses others.

Embeddings at upload would add:
- CPU / battery cost on every upload
- A model download (or a provider call per chunk)
- Extra storage and cache-invalidation logic
- Complexity that most operations would never use

**Decision: no embeddings in v1.** Add them lazily, the first time a feature needs them
(e.g. "focus on the TCP section"), keyed by `chunk hash + embedding model id` so vectors from
different models are never mixed.

### When to reconsider

- A user selects a folder with dozens of files and wants to focus on one concept.
- Duplicate detection across large collections becomes too slow with string similarity.

---

## 3 · Generation pipeline

```
User presses Generate
  │
  ▼
select        Gather chunks for ticked source files.
              Order: file order, then chunk index.
              Label each chunk with its file name and page.
  │
  ▼
plan          Estimate token count (characters ÷ 4).
              If selection fits effective context → single-call path.
              If it doesn't fit → map-reduce path (v1.5).
  │
  ▼
generate      Build system + user prompts.
              Call LlmClient.generateJson({ system, user, schema, signal }).
  │
  ▼
validate      Zod parse the response.
              Grounding check: verify each evidence quote appears in its chunk.
              Drop items that fail; retry once on bad JSON.
  │
  ▼
save          Name the file (defaultFileName), write to IndexedDB,
              record sourceSnapshot (file ids + chunk hashes).
```

### Single-call path (v1)

All selected chunks fit in one prompt. Send everything and ask for the full output in one
call. Simplest, best coherence, sufficient for typical study sessions (1–3 files,
a few hundred tokens).

### Map-reduce path (v1.5)

For large selections that exceed the effective context:

1. **Plan quotas** before generating. For 20 questions over 8 sections, allocate 2–3 per
   section and spread the remainder. Coverage is guaranteed by construction — cheaper and
   more reliable than "generate lots and post-filter".
2. **Map**: one LLM call per section, each returning its quota.
3. **Reduce**: deduplicate, balance difficulty, trim to the requested count.

Per-type reduce strategies:
- **Quiz / Flashcards** — dedupe by normalised string similarity, trim to count.
- **AI notes** — concatenate sections in document order; optional short overview call.
- **Cheat sheet** — map extracts key facts and formulas; reduce compresses to a character
  budget ("one page").

---

## 4 · Grounding strategy

Hallucination cannot be eliminated, but its worst cases can be detected cheaply.

### Evidence checking (v1)

Every quiz question and flashcard must include:

```ts
evidence: {
  chunkId: number    // which chunk the answer is drawn from
  quote: string      // a short verbatim excerpt from that chunk
}
```

The validation step verifies in code that `quote` (after normalising whitespace) appears
in the text of `chunkId`. Items that fail are dropped. Items that pass carry a citation
the user can inspect.

Additional grounding measures (all in v1):
- System prompt: *"Use only the provided text. Do not add information from outside."*
- `temperature: 0` or low — less creative, more grounded.
- Schema allows an explicit `"insufficient material"` result so the model can decline
  rather than fabricate.
- Every generated file is labelled AI-generated and shows its source files.

### What comes later

A second LLM call ("is this answer supported by the text?") adds cost; defer until
grounding failures are measured to be a real problem in practice.

---

## 5 · Provider tiers

```
┌───────────────────────────────────────────────────────┐
│  LlmClient (interface)                                │
│  generateJson<T>({ system, user, schema, signal })    │
│  checkHealth()  capabilities  listModels?()           │
└───────┬───────────────┬───────────┬───────────────────┘
        │               │           │
   ┌────▼────┐   ┌──────▼───┐  ┌───▼──────────────┐
   │  Mock   │   │  OpenAI- │  │  Native Ollama   │
   │provider │   │compatible│  │  adapter (v1.5)  │
   │         │   │adapter   │  │                  │
   │no network  │(covers    │  │explicit context  │
   │fixed JSON  │OpenAI,    │  │size, model list  │
   │+ delays │   │Ollama /v1,│  │health checks     │
   └─────────┘   │gateways) │  └──────────────────┘
                 └──────────┘
```

| Tier | How | Best for |
|------|-----|---------|
| **Mock** | Fixed JSON, no network | CI, offline demos, fast unit tests |
| **Local Ollama** | `http://localhost:11434/v1` | Development, privacy |
| **Remote Ollama** | Another machine on your network | Better hardware during dev |
| **Cloud BYOK** | OpenAI, Groq, Together, etc. | Most end users |

All four share `LlmClient`. The UI never touches a specific adapter directly.

### Ollama context window

Ollama's default context window is **4096 tokens** — often too small for document-sized
prompts. The OpenAI-compatible endpoint (`/v1/chat/completions`) does not expose the
context-size option. Set it explicitly with the native API (`num_ctx`) or via the
`OLLAMA_CONTEXT_LENGTH` environment variable. This is why a native Ollama adapter (issue #19)
is planned alongside the OpenAI-compatible one.

### Structured output compatibility

OpenAI supports `response_format: { type: "json_schema", schema: ... }` for strict schema
enforcement. Ollama's `/v1` endpoint only supports `{ type: "json_object" }`. Strategy:
always validate with Zod regardless of which mode the provider used. Never trust
`structured_output: true` to skip validation.

### Cloud consent

**Never switch to a cloud provider silently.** Before sending content to a cloud endpoint,
show: *"Send N pages to [provider]? Your selected notes will leave your device."*
No silent fallbacks. The user's choice is not remembered unless they explicitly opt in.

---

## 6 · Data model additions for v1

These fields extend the existing Dexie schema:

```ts
// Chunk — add to src/db/types.ts (Dexie v3 migration)
interface Chunk {
  id?: number
  fileId: number
  source: string      // citation label, e.g. "Heaps.pdf, p. 9"
  page?: number
  text: string
  hash: string        // SHA-256 of normalised text — for cache keys and change detection
  tokenEstimate: number  // Math.ceil(text.length / 4) — rough, enough for budget planning
}

// HoneFile.meta additions for generated files (no schema change, stored in meta: Record)
interface GeneratedFileMeta {
  sources: number[]                        // source file ids (existing)
  options: AiOptions                       // generation options (existing)
  isSample: boolean                        // stub output flag (existing)
  sourceSnapshot?: { fileId: number; hash: string }[]  // hashes at generation time
  generator?: {
    provider: string                       // e.g. "openai-compatible"
    model: string
    promptVersion: string                  // bump when prompts change
  }
}
```

`hash` on `Chunk` is used to:
- Key the map cache: `(sectionHash + op + options + model + promptVersion)`.
- Detect when a source changes: compare stored `sourceSnapshot` against current hashes.
- Show *"Source changed since this was generated"* and offer Regenerate (never auto-regenerate).

---

## 7 · What is v1, what is later

### v1 (current milestone)

- [x] Source extraction (parsers, chunker, Web Worker) — done
- [x] Zod output schemas (quiz, flashcards) — done
- [x] Generation entry point stub (`generateFile`) — done
- [ ] `LlmClient` interface + mock provider (issue #2)
- [ ] OpenAI-compatible adapter (issue #3)
- [ ] `generateContent` / `saveGeneratedFile` split (issue #4)
- [ ] Settings screen with provider config and Test connection (issues #5, #6)
- [ ] Token estimator and context budget (issue #7)
- [ ] Source selection with size estimate (issue #8)
- [ ] Document quality checks (issue #9)
- [ ] Content hashes and "source changed" marking (issue #10)
- [ ] Output schemas with evidence (issue #11)
- [ ] Grounding check (issue #12)
- [ ] Flashcards generator — first end-to-end slice (issue #13)
- [ ] Quiz generator (issue #14)
- [ ] AI notes + cheat sheet generators (issue #15)
- [ ] Pipeline orchestrator: progress, cancel, retries (issue #16)

### v1.5 — large documents

- [ ] Map-reduce with quota allocation (issue #17)
- [ ] Map cache and duplicate detection (issue #18)

### Later

- Lazy embeddings (keyed by chunk hash + model id) for topic-focused generation.
- Native Ollama adapter for explicit context size and health checks (issue #19).
- Gemini adapter + explicit cloud consent dialog (issue #22).
- OCR (Tesseract.js) and vision models for scanned PDFs.
- A second "is this supported?" LLM verification pass.
- Semantic deduplication using embeddings.
- `docs/models.md` — recorded benchmark results per model.

---

## 8 · Dependency boundaries

```
UI (dialogs, viewers)
  │
  ▼
features/generation/pipeline.ts     ← select, plan, generate, validate, save
  │                    │
  │                    ▼
  │             features/generation/generators/   ← quiz.ts, flashcards.ts, …
  │                    │
  │                    ▼
  │              src/ai/            ← LlmClient interface + adapters
  │
  ▼
src/db/                             ← Dexie, repositories, types
```

Rules:
- `src/ai/` must not import React, Dexie, or anything from `src/features/`.
- Generators receive sections (plain text + metadata) and an `LlmClient`. They never
  touch the database or call `fetch` directly.
- Pages and components never import from `src/ai/` directly — they go through the
  pipeline in `features/generation/`.

---

## 9 · Poor input handling

| Symptom | Detection | Response |
|---------|-----------|---------|
| Scanned / image-only PDF | characters per page ≈ 0 | Warn: *"This looks like a scanned document. Text could not be extracted."* |
| Too little text for requested count | characters < count × ~150 | Cap count, explain: *"Not enough material for 20 questions — generating 5."* |
| Tables and formulas | No special parser | Treated as messy text in v1. Warn: *"Tables and diagrams are not fully read."* |
| Images and diagrams | Not extracted | Ignored in v1. State this clearly in the UI and README. |

---

*See also: [architecture.md](architecture.md) for the overall app layer diagram and
[data-contract.md](data-contract.md) for the Zod schemas shared with the UI.*
