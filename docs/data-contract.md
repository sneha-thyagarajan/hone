# Data contract — AI-generated file content

> **Status: provisional.** These schemas were created while building the
> AI-file UI (the stub). They are enforced by `src/features/agent/schemas.ts`
> with Zod. The teammate building the real AI pipeline should confirm or adjust
> them here first, then update the Zod schemas to match.

AI files are saved as normal files (`src/db` `files` table) with:

- `type`: `quiz` | `flashcards` | `ai_notes` | `cheatsheet`
- `content`: a string — JSON for quiz/flashcards (below), Markdown for
  `ai_notes` and `cheatsheet`
- `meta`: `{ sources: number[], options: object, isSample: boolean }`
  - `sources` — the file ids the content was generated from
  - `options` — the type-specific options chosen in the dialog
  - `isSample` — `true` for stub output; set `false` for real model output

## Quiz (`type: "quiz"`, content = JSON)

```jsonc
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "..."], // >= 2
      "answerIndex": 0,                          // 0-based index into options
      "explanation": "string"
    }
  ]                                              // >= 1
}
```

## Flashcards (`type: "flashcards"`, content = JSON)

```jsonc
{
  "cards": [
    { "front": "string", "back": "string" }
  ]                                              // >= 1
}
```

## AI notes / Cheat sheet (`type: "ai_notes" | "cheatsheet"`)

`content` is Markdown (no JSON schema).
