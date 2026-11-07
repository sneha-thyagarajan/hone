import type { Section } from './generateFile'
import type { AiOptions, AiType } from './types'

export interface Prompt {
  system: string
  user: string
  /** Tokens to reserve for the model's output. */
  maxOutputTokens: number
}

function formatSections(sections: Section[]): string {
  return sections
    .map((s) => {
      const label = s.page != null ? `${s.fileName} (p. ${s.page})` : s.fileName
      return `=== ${label} ===\n${s.text}`
    })
    .join('\n\n')
}

// Instruction appended to every user prompt to prevent the model using general knowledge
const GROUNDING_RULE =
  'IMPORTANT: Use ONLY information from the study material above. ' +
  'Do not use your general knowledge or invent content that is not in the text.'

export function buildPrompt(type: AiType, sections: Section[], options: AiOptions): Prompt {
  const material = formatSections(sections)

  switch (type) {
    case 'quiz': {
      const count = Number(options.count ?? 10)
      const difficulty = String(options.difficulty ?? 'medium')
      return {
        system: [
          'You are an expert tutor writing a multiple-choice quiz BASED SOLELY on the study material provided by the user.',
          'Do NOT use your general knowledge. Every question must come directly from the provided text.',
          'Return ONLY a single valid JSON object — no markdown fences, no prose.',
          'The JSON must use exactly this structure:',
          '{ "questions": [ { "question": "...", "options": ["A","B","C","D"], "answerIndex": 0, "explanation": "..." } ] }',
        ].join('\n'),
        user: [
          `Create exactly ${count} multiple-choice questions at ${difficulty} difficulty from the study material below.`,
          'Each question must have exactly 4 options. answerIndex is 0-based. Include a brief explanation citing the source text.',
          '',
          material,
          '',
          GROUNDING_RULE,
        ].join('\n'),
        maxOutputTokens: Math.max(800, count * 180),
      }
    }

    case 'flashcards': {
      const count = Number(options.count ?? 20)
      const focus =
        options.focus === 'concepts'
          ? 'core concepts and how they work'
          : 'key terms and their definitions'
      return {
        system: [
          'You are an expert tutor creating study flashcards BASED SOLELY on the study material provided by the user.',
          'Do NOT use your general knowledge. Every card must come directly from the provided text.',
          'Return ONLY a single valid JSON object — no markdown fences, no prose.',
          'The JSON must use exactly this structure:',
          '{ "cards": [ { "front": "...", "back": "..." } ] }',
        ].join('\n'),
        user: [
          `Create exactly ${count} flashcards focusing on ${focus} from the study material below.`,
          'front: a term, concept, or question from the text. back: a concise answer drawn from the text.',
          '',
          material,
          '',
          GROUNDING_RULE,
        ].join('\n'),
        maxOutputTokens: Math.max(600, count * 90),
      }
    }

    case 'ai_notes': {
      const length = String(options.length ?? 'standard')
      const wordRange =
        length === 'brief' ? '250–400 words' : length === 'detailed' ? '700–1000 words' : '400–700 words'
      return {
        system: [
          'You are an expert tutor writing structured study notes BASED SOLELY on the study material provided by the user.',
          'Do NOT add information that is not in the source text.',
          'Return ONLY a single valid JSON object — no markdown fences, no prose.',
          'The JSON must use exactly this structure:',
          '{ "content": "# Title\\n\\n## Section\\n\\nBody text..." }',
        ].join('\n'),
        user: [
          `Write structured study notes in Markdown (${wordRange}) from the material below.`,
          'Use ## for main sections and ### for subsections. Include key concepts, definitions, and examples from the text.',
          '',
          material,
          '',
          GROUNDING_RULE,
        ].join('\n'),
        maxOutputTokens: length === 'brief' ? 700 : length === 'detailed' ? 1800 : 1200,
      }
    }

    case 'cheatsheet': {
      const density = String(options.density ?? 'compact')
      const style =
        density === 'compact'
          ? 'very dense — prefer tables, bullet lists, minimal prose'
          : 'clear and scannable — short paragraphs, headers, bullet lists'
      return {
        system: [
          'You are creating a reference cheatsheet BASED SOLELY on the study material provided by the user.',
          'Do NOT add information that is not in the source text.',
          'Return ONLY a single valid JSON object — no markdown fences, no prose.',
          'The JSON must use exactly this structure:',
          '{ "content": "# Cheat sheet — Topic\\n\\n..." }',
        ].join('\n'),
        user: [
          `Create a ${style} cheatsheet in Markdown from the material below.`,
          'Begin with "# Cheat sheet — [topic from the text]". Cover everything present in the source material.',
          '',
          material,
          '',
          GROUNDING_RULE,
        ].join('\n'),
        maxOutputTokens: density === 'compact' ? 1200 : 1800,
      }
    }
  }
}
