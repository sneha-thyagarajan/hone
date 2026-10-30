import Dexie, { type Table } from 'dexie'
import type { Attempt, CalEvent, Chunk, Folder, HoneFile, Setting, Task } from './types'

class HoneDB extends Dexie {
  folders!: Table<Folder>
  files!: Table<HoneFile>
  chunks!: Table<Chunk>
  attempts!: Table<Attempt>
  events!: Table<CalEvent>
  tasks!: Table<Task>
  settings!: Table<Setting>

  constructor() {
    super('hone')
    this.version(1).stores({
      folders: '++id, name, createdAt',
      files: '++id, folderId, type, createdAt, updatedAt',
      chunks: '++id, fileId',
      attempts: '++id, fileId, at',
      events: '++id, folderId, date',
      tasks: '++id, folderId, date',
      settings: 'key',
    })
  }
}

export const db = new HoneDB()
