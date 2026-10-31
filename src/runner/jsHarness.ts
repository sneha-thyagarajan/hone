function fmtArg(a: unknown): string {
  if (typeof a === 'string') return a
  try {
    return JSON.stringify(a) ?? String(a)
  } catch {
    return String(a)
  }
}

/**
 * Run user JavaScript and capture its console output. Pure and synchronous so
 * it can be unit-tested directly and reused inside the worker. `console.*` is
 * replaced with a capturing shim; the real console is not exposed.
 */
export function runJs(code: string): { output: string; error?: string } {
  const logs: string[] = []
  const capture = (...args: unknown[]) => logs.push(args.map(fmtArg).join(' '))
  const sandboxConsole = { log: capture, info: capture, warn: capture, error: capture, debug: capture }

  try {
    const fn = new Function('console', `"use strict";\n${code}`)
    fn(sandboxConsole)
  } catch (err) {
    return {
      output: logs.join('\n'),
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    }
  }
  return { output: logs.join('\n') }
}
