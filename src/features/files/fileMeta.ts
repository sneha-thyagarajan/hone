import type { FileType } from '@/db/types'

export const FILE_TYPE_META: Record<
  FileType,
  { label: string; color: string; filter: FilterTab }
> = {
  note:       { label: 'NOTE',   color: 'bg-accent-tint text-accent',        filter: 'notes'    },
  upload:     { label: 'PDF',    color: 'bg-amber-tint text-amber',           filter: 'uploads'  },
  notes_ai:   { label: 'AI',     color: 'bg-success-tint text-success-text',  filter: 'ai'       },
  flashcards: { label: 'CARDS',  color: 'bg-success-tint text-success-text',  filter: 'ai'       },
  quiz:       { label: 'QUIZ',   color: 'bg-success-tint text-success-text',  filter: 'ai'       },
  mock:       { label: 'MOCK',   color: 'bg-success-tint text-success-text',  filter: 'ai'       },
  plan:       { label: 'PLAN',   color: 'bg-success-tint text-success-text',  filter: 'ai'       },
  code:       { label: 'CODE',   color: 'bg-code text-white',                 filter: 'practice' },
}

export type FilterTab = 'all' | 'notes' | 'uploads' | 'ai' | 'practice'

export const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'notes',    label: 'Notes'    },
  { key: 'uploads',  label: 'Uploads'  },
  { key: 'ai',       label: 'AI-made'  },
  { key: 'practice', label: 'Practice' },
]
