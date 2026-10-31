import type { RunnableLanguage, RunResult } from './types'

const RUN_TIMEOUT_MS = 5000 // kill user code that runs longer than this
const LOAD_BUDGET_MS = 90_000 // generous budget for the first Pyodide download

type WorkerMsg =
  | { type: 'status'; message: string }
  | { type: 'running' }
  | { type: 'result'; output: string; error?: string }
  | { type: 'error'; message: string }

// One reusable worker per language (kept warm so Pyodide stays loaded).
const workers: Partial<Record<RunnableLanguage, Worker>> = {}

function spawn(language: RunnableLanguage): Worker {
  return language === 'python'
    ? new Worker(new URL('./python.worker.ts', import.meta.url), { type: 'module' })
    : new Worker(new URL('./js.worker.ts', import.meta.url), { type: 'module' })
}

function getWorker(language: RunnableLanguage): Worker {
  if (!workers[language]) workers[language] = spawn(language)
  return workers[language]!
}

export interface RunConfig {
  onStatus?: (message: string) => void
  timeoutMs?: number
}

/**
 * Run user code in the language's worker and capture its output, enforcing a
 * timeout that terminates runaway code (e.g. infinite loops).
 */
export function runCode(
  language: RunnableLanguage,
  code: string,
  config: RunConfig = {},
): Promise<RunResult> {
  const worker = getWorker(language)
  const runTimeout = config.timeoutMs ?? RUN_TIMEOUT_MS

  return new Promise<RunResult>((resolve) => {
    let killTimer: ReturnType<typeof setTimeout> | undefined

    function cleanup() {
      clearTimeout(loadTimer)
      if (killTimer) clearTimeout(killTimer)
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
    }

    function kill() {
      cleanup()
      worker.terminate()
      delete workers[language]
      resolve({ timedOut: true, output: '' })
    }

    const onMessage = (e: MessageEvent<WorkerMsg>) => {
      const msg = e.data
      if (msg.type === 'status') {
        config.onStatus?.(msg.message)
      } else if (msg.type === 'running') {
        // User code is about to run — start the kill-timer now so a slow
        // Pyodide download doesn't count against it.
        clearTimeout(loadTimer)
        killTimer = setTimeout(kill, runTimeout)
      } else if (msg.type === 'result') {
        cleanup()
        resolve({ timedOut: false, output: msg.output, error: msg.error })
      } else {
        cleanup()
        resolve({ timedOut: false, output: '', error: msg.message })
      }
    }

    const onError = (e: ErrorEvent) => {
      cleanup()
      worker.terminate()
      delete workers[language]
      resolve({ timedOut: false, output: '', error: e.message || 'Runner crashed' })
    }

    worker.addEventListener('message', onMessage)
    worker.addEventListener('error', onError)
    const loadTimer = setTimeout(kill, LOAD_BUDGET_MS)
    worker.postMessage({ code })
  })
}
