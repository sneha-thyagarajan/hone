// Pyodide is loaded from the official CDN the first time Python is run, so the
// large wasm payload isn't bundled and is fetched only on demand.
const PYODIDE_VERSION = 'v0.26.4'
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`

interface Pyodide {
  globals: { set: (k: string, v: unknown) => void }
  runPython: (code: string) => string
}

const post = (msg: unknown) =>
  (self as unknown as { postMessage: (m: unknown) => void }).postMessage(msg)

let pyodidePromise: Promise<Pyodide> | null = null

function loadPyodide(): Promise<Pyodide> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const mod = await import(/* @vite-ignore */ PYODIDE_BASE + 'pyodide.mjs')
      return (mod as { loadPyodide: (o: { indexURL: string }) => Promise<Pyodide> }).loadPyodide({
        indexURL: PYODIDE_BASE,
      })
    })()
  }
  return pyodidePromise
}

// Runs the user's code with stdout captured, returning {output, error} as JSON.
const HARNESS = `
import sys, io, json, traceback
_buf = io.StringIO()
_old = sys.stdout
sys.stdout = _buf
_err = None
try:
    exec(__code, {})
except Exception:
    _err = traceback.format_exc()
finally:
    sys.stdout = _old
json.dumps({"output": _buf.getvalue(), "error": _err})
`

self.onmessage = async (e: MessageEvent<{ code: string }>) => {
  try {
    post({ type: 'status', message: 'Loading Python…' })
    const py = await loadPyodide()
    post({ type: 'running' })
    py.globals.set('__code', e.data.code)
    const out = py.runPython(HARNESS)
    const parsed = JSON.parse(out) as { output: string; error: string | null }
    post({ type: 'result', output: parsed.output, error: parsed.error ?? undefined })
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}
