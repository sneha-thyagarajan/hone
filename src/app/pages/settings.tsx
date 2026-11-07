import { useState } from 'react'
import { Settings, Wifi, WifiOff, Loader2, CheckCircle2, Lock, Eye, EyeOff, Shield, Cloud } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSetting } from '@/lib/settings'
import { Button } from '@/components/ui/Button'
import { MockLlmClient } from '@/ai/mock'
import { OpenAiCompatibleClient } from '@/ai/openaiCompatible'
import type { LlmClient, HealthResult } from '@/ai/provider'

// ─── Provider catalogue ───────────────────────────────────────────────────────

type Badge = 'local' | 'network' | 'cloud' | 'none'

interface Provider {
  id: string
  label: string
  description: string
  badge: Badge
  defaultBaseUrl: string
  defaultModel: string
  requiresKey: boolean
}

const PROVIDERS: Provider[] = [
  {
    id: 'mock',
    label: 'Mock',
    description: 'Fixed sample output — no model needed',
    badge: 'local',
    defaultBaseUrl: '',
    defaultModel: 'mock',
    requiresKey: false,
  },
  {
    id: 'ollama',
    label: 'Ollama',
    description: 'Runs on this machine — free and private',
    badge: 'local',
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: 'qwen2.5:3b',
    requiresKey: false,
  },
  {
    id: 'ollama-remote',
    label: 'Ollama (remote)',
    description: 'Another machine on your network',
    badge: 'network',
    defaultBaseUrl: 'http://192.168.1.x:11434/v1',
    defaultModel: 'qwen2.5:7b',
    requiresKey: false,
  },
  {
    id: 'openai',
    label: 'OpenAI',
    description: 'GPT-4o and family — BYOK',
    badge: 'cloud',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    requiresKey: true,
  },
  {
    id: 'groq',
    label: 'Groq',
    description: 'Fast inference, generous free tier',
    badge: 'cloud',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.1-8b-instant',
    requiresKey: true,
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Any OpenAI-compatible endpoint',
    badge: 'none',
    defaultBaseUrl: '',
    defaultModel: '',
    requiresKey: false,
  },
]

// ─── Test-connection state ─────────────────────────────────────────────────────

type TestState =
  | { status: 'idle' }
  | { status: 'testing' }
  | { status: 'ok'; model: string; latencyMs: number }
  | { status: 'fail'; step: 'reachable' | 'model' | 'generate'; error: string; hint: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildClient(providerId: string, baseUrl: string, model: string, apiKey: string): LlmClient {
  if (providerId === 'mock') return new MockLlmClient()
  return new OpenAiCompatibleClient({
    baseUrl: baseUrl || 'http://localhost:11434/v1',
    model: model || 'qwen2.5:7b',
    apiKey: apiKey || undefined,
    timeoutMs: 20_000,
  })
}

function BadgeChip({ badge }: { badge: Badge }) {
  if (badge === 'none') return null
  const styles: Record<Exclude<Badge, 'none'>, string> = {
    local: 'bg-success-tint text-success-text',
    network: 'bg-accent-tint text-accent',
    cloud: 'bg-amber-tint text-amber',
  }
  const labels: Record<Exclude<Badge, 'none'>, string> = {
    local: 'Local',
    network: 'Your network',
    cloud: 'Cloud',
  }
  return (
    <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide', styles[badge])}>
      {labels[badge]}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [providerId, setProviderId] = useSetting<string>('ai.provider', 'mock')
  const [baseUrl, setBaseUrl] = useSetting<string>('ai.baseUrl', '')
  const [model, setModel] = useSetting<string>('ai.model', 'mock')
  const [apiKey, setApiKey] = useSetting<string>('ai.key', '')

  const [testState, setTestState] = useState<TestState>({ status: 'idle' })
  const [showKey, setShowKey] = useState(false)

  const provider = PROVIDERS.find((p) => p.id === providerId) ?? PROVIDERS[0]
  const isMock = providerId === 'mock'
  const isCloud = provider.badge === 'cloud'

  function selectProvider(p: Provider) {
    setProviderId(p.id)
    if (p.defaultBaseUrl) setBaseUrl(p.defaultBaseUrl)
    if (p.defaultModel) setModel(p.defaultModel)
    setTestState({ status: 'idle' })
  }

  function handleFieldChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value)
      setTestState({ status: 'idle' })
    }
  }

  async function runTest() {
    setTestState({ status: 'testing' })
    const client = buildClient(providerId, baseUrl, model, apiKey)
    let result: HealthResult
    try {
      result = await client.checkHealth()
    } catch {
      result = { ok: false, step: 'reachable', error: 'Unexpected error', hint: 'Check the browser console for details.' }
    }
    if (result.ok) {
      setTestState({ status: 'ok', model: result.model, latencyMs: result.latencyMs })
    } else {
      setTestState({ status: 'fail', step: result.step, error: result.error, hint: result.hint })
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-line px-6 py-4">
        <Settings size={20} className="text-accent" />
        <h1 className="font-serif text-xl font-semibold text-heading">Settings</h1>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-2xl space-y-8">

          {/* Provider */}
          <section>
            <SectionLabel>AI provider</SectionLabel>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectProvider(p)}
                  className={cn(
                    'flex flex-col gap-1 rounded-card border p-3 text-left transition-all',
                    p.id === providerId
                      ? 'border-accent bg-accent-tint shadow-sm ring-2 ring-accent ring-offset-1'
                      : 'border-line bg-surface hover:border-accent/50 hover:bg-surface-2',
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-ink">{p.label}</span>
                    <BadgeChip badge={p.badge} />
                  </div>
                  <p className="text-xs leading-snug text-muted">{p.description}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Config fields */}
          {!isMock && (
            <section className="space-y-4">
              <SectionLabel>Connection</SectionLabel>

              <Field label="Base URL">
                <input
                  type="url"
                  value={baseUrl}
                  onChange={handleFieldChange(setBaseUrl)}
                  placeholder="http://localhost:11434/v1"
                  className="field-input"
                  spellCheck={false}
                />
              </Field>

              <Field label="Model">
                <input
                  type="text"
                  value={model}
                  onChange={handleFieldChange(setModel)}
                  placeholder="qwen2.5:7b"
                  className="field-input"
                  spellCheck={false}
                />
                {providerId === 'ollama' && (
                  <p className="mt-1.5 text-xs text-muted">
                    Run <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[11px]">ollama pull {model || 'qwen2.5:3b'}</code> to install it.
                    On a laptop without a GPU, <strong>3b models are much faster</strong> than 7b.
                  </p>
                )}
              </Field>

              <Field
                label={
                  <span className="flex items-center gap-1.5">
                    API key
                    <Lock size={11} className="text-muted" />
                    <span className="text-[10px] font-normal text-muted">(stored on device only)</span>
                  </span>
                }
              >
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={handleFieldChange(setApiKey)}
                    placeholder={provider.requiresKey ? 'sk-…' : 'Optional'}
                    className="field-input pr-10"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-ink"
                    aria-label={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
            </section>
          )}

          {/* Test connection */}
          <section>
            <SectionLabel>Connection test</SectionLabel>
            <div className="rounded-card border border-line bg-surface p-4">
              <div className="flex items-center justify-between gap-4">
                <TestResult state={testState} />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={runTest}
                  disabled={testState.status === 'testing'}
                  className="shrink-0"
                >
                  {testState.status === 'testing' ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Checking…
                    </>
                  ) : (
                    <>
                      <Wifi size={14} />
                      Test connection
                    </>
                  )}
                </Button>
              </div>

              {testState.status === 'fail' && (
                <div className="mt-3 rounded-md border border-danger-tint bg-danger-tint/40 p-3">
                  <p className="text-xs font-semibold text-danger-text">
                    Failed at: {STEP_LABELS[testState.step]}
                  </p>
                  <p className="mt-1 text-xs text-danger-text/80">{testState.error}</p>
                  <p className="mt-2 text-xs text-muted">{testState.hint}</p>
                </div>
              )}
            </div>
          </section>

          {/* Privacy note */}
          {isCloud && (
            <section>
              <div className="flex gap-3 rounded-card border border-amber-tint bg-amber-tint/40 p-4">
                <Cloud size={16} className="mt-0.5 shrink-0 text-amber" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber">Cloud provider selected</p>
                  <p className="text-xs leading-relaxed text-muted">
                    When you generate a file, the text from your selected notes and uploads
                    will be sent to <strong>{provider.label}</strong>. Your content leaves your
                    device. Hone will always ask before sending — there are no silent requests
                    to cloud providers.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Local privacy note */}
          {!isCloud && !isMock && (
            <section>
              <div className="flex gap-3 rounded-card border border-accent-tint bg-accent-tint/30 p-4">
                <Shield size={16} className="mt-0.5 shrink-0 text-accent" />
                <p className="text-xs leading-relaxed text-muted">
                  Your notes stay on {provider.badge === 'network' ? 'your local network' : 'this device'}.
                  Nothing is sent to third-party servers.
                </p>
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const STEP_LABELS: Record<'reachable' | 'model' | 'generate', string> = {
  reachable: 'step 1 — server reachable',
  model: 'step 2 — model installed',
  generate: 'step 3 — test generation',
}

function TestResult({ state }: { state: TestState }) {
  if (state.status === 'idle') {
    return <p className="text-sm text-muted">Not tested yet.</p>
  }
  if (state.status === 'testing') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <Loader2 size={14} className="animate-spin" />
        Running three-step check…
      </div>
    )
  }
  if (state.status === 'ok') {
    return (
      <div className="flex items-center gap-2 text-sm text-success-text">
        <CheckCircle2 size={16} />
        Connected · {state.model} · {state.latencyMs}ms
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 text-sm text-danger-text">
      <WifiOff size={16} />
      Connection failed
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{children}</p>
  )
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      {children}
    </div>
  )
}
