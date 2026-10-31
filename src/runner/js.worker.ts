import { runJs } from './jsHarness'

const post = (msg: unknown) =>
  (self as unknown as { postMessage: (m: unknown) => void }).postMessage(msg)

self.onmessage = (e: MessageEvent<{ code: string }>) => {
  // Tell the client to start its kill-timer before user code runs.
  post({ type: 'running' })
  const { output, error } = runJs(e.data.code)
  post({ type: 'result', output, error })
}
