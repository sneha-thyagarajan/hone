import type { FileType } from '@/db/types'

export type AiType = 'quiz' | 'flashcards' | 'ai_notes' | 'cheatsheet'

export type AiOptions = Record<string, string | number>

export const AI_TYPES: AiType[] = ['quiz', 'flashcards', 'ai_notes', 'cheatsheet']

export const TYPE_META: Record<AiType, { label: string; description: string; fileType: FileType }> = {
  quiz: {
    label: 'Quiz',
    description: 'Multiple-choice questions with explanations',
    fileType: 'quiz',
  },
  flashcards: {
    label: 'Flashcards',
    description: 'Front and back cards for revision',
    fileType: 'flashcards',
  },
  ai_notes: {
    label: 'AI notes',
    description: 'Structured notes made from your material',
    fileType: 'ai_notes',
  },
  cheatsheet: {
    label: 'Cheat sheet',
    description: 'A dense one-page summary',
    fileType: 'cheatsheet',
  },
}

export interface OptionField {
  key: string
  label: string
  choices: { value: string | number; label: string }[]
}

export const OPTION_FIELDS: Record<AiType, OptionField[]> = {
  quiz: [
    {
      key: 'count',
      label: 'Questions',
      choices: [
        { value: 5, label: '5' },
        { value: 10, label: '10' },
        { value: 20, label: '20' },
      ],
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      choices: [
        { value: 'easy', label: 'Easy' },
        { value: 'medium', label: 'Medium' },
        { value: 'hard', label: 'Hard' },
      ],
    },
  ],
  flashcards: [
    {
      key: 'count',
      label: 'Cards',
      choices: [
        { value: 10, label: '10' },
        { value: 20, label: '20' },
        { value: 30, label: '30' },
      ],
    },
    {
      key: 'focus',
      label: 'Focus',
      choices: [
        { value: 'terms', label: 'Key terms' },
        { value: 'concepts', label: 'Concepts' },
      ],
    },
  ],
  ai_notes: [
    {
      key: 'length',
      label: 'Length',
      choices: [
        { value: 'brief', label: 'Brief' },
        { value: 'standard', label: 'Standard' },
        { value: 'detailed', label: 'Detailed' },
      ],
    },
  ],
  cheatsheet: [
    {
      key: 'density',
      label: 'Density',
      choices: [
        { value: 'compact', label: 'Compact' },
        { value: 'roomy', label: 'Roomy' },
      ],
    },
  ],
}

const DEFAULT_OPTIONS: Record<AiType, AiOptions> = {
  quiz: { count: 10, difficulty: 'medium' },
  flashcards: { count: 20, focus: 'terms' },
  ai_notes: { length: 'standard' },
  cheatsheet: { density: 'compact' },
}

export function defaultOptions(type: AiType): AiOptions {
  return { ...DEFAULT_OPTIONS[type] }
}
