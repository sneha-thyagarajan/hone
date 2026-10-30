import Dexie, { type Table } from 'dexie'
import type {
  Attempt,
  BlobRecord,
  CalEvent,
  Chunk,
  Folder,
  HoneFile,
  Setting,
  Task,
} from './types'

class HoneDB extends Dexie {
  folders!: Table<Folder>
  files!: Table<HoneFile>
  chunks!: Table<Chunk>
  attempts!: Table<Attempt>
  events!: Table<CalEvent>
  tasks!: Table<Task>
  settings!: Table<Setting>
  blobs!: Table<BlobRecord>

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
    // v2: store original uploaded file blobs
    this.version(2).stores({
      blobs: 'id',
    })
  }
}

export const db = new HoneDB()
