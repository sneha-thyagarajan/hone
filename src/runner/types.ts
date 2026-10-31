export type Language = 'python' | 'javascript' | 'java'

/** Languages that can actually be executed in a worker. */
export type RunnableLanguage = 'python' | 'javascript'

export function isRunnable(lang: Language): lang is RunnableLanguage {
  return lang === 'python' || lang === 'javascript'
}

export interface RunResult {
  /** True if the worker was killed for exceeding the timeout. */
  timedOut: boolean
  /** Captured stdout / console output. */
  output: string
  /** Error text, if the code threw or failed to compile. */
  error?: string
}
