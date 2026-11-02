import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { createFolder } from '@/features/folders/folderActions'
import { createFile } from '@/features/files/fileActions'
import { generateFile } from '../generateFile'
import { QuizSchema } from '../schemas'

let folderId: number
let sourceId: number

beforeEach(async () => {
  await db.folders.clear()
  await db.files.clear()
  folderId = await createFolder({ name: 'Data Structures', kind: 'theory' })
  sourceId = await createFile({ folderId, type: 'note', name: 'Heaps', content: '# Heaps' })
})

describe('generateFile (stub)', () => {
  it('saves a quiz file with sample flag, sources and valid content', async () => {
    const f = await generateFile('quiz', [sourceId], { count: 10, difficulty: 'medium' })
    expect(f.type).toBe('quiz')
    expect(f.folderId).toBe(folderId)
    expect(f.name).toBe('Quiz · Data Structures')
    expect(f.meta).toMatchObject({ isSample: true, sources: [sourceId] })
    expect(() => QuizSchema.parse(JSON.parse(f.content!))).not.toThrow()
  })

  it('saves markdown content for cheat sheets', async () => {
    const f = await generateFile('cheatsheet', [sourceId], { density: 'compact' })
    expect(f.type).toBe('cheatsheet')
    expect(f.content).toContain('# Cheat sheet')
  })

  it('numbers the name when generating the same type again', async () => {
    await generateFile('quiz', [sourceId], { count: 5, difficulty: 'easy' })
    const second = await generateFile('quiz', [sourceId], { count: 5, difficulty: 'easy' })
    expect(second.name).toBe('Quiz · Data Structures (2)')
  })

  it('persists the file so it appears in the AI-made tab count', async () => {
    await generateFile('flashcards', [sourceId], { count: 20, focus: 'terms' })
    const aiFiles = (await db.files.where({ folderId }).toArray()).filter(
      (f) => f.type === 'flashcards' || f.type === 'quiz' || f.type === 'ai_notes' || f.type === 'cheatsheet',
    )
    expect(aiFiles).toHaveLength(1)
  })

  it('rejects when told to simulate an error (dev switch)', async () => {
    await expect(
      generateFile('quiz', [sourceId], { count: 10, difficulty: 'medium' }, { simulateError: true }),
    ).rejects.toThrow(/simulated/i)
  })
})
