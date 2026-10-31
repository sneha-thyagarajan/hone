import { useEffect, useLayoutEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, placeholder as cmPlaceholder } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { indentUnit } from '@codemirror/language'
import { python } from '@codemirror/lang-python'
import { javascript } from '@codemirror/lang-javascript'
import { java } from '@codemirror/lang-java'
import { oneDark } from '@codemirror/theme-one-dark'
import type { Language } from '@/runner/types'

interface Options {
  /** Current value; read when the editor is (re)created, not on every keystroke. */
  value: string
  language: Language
  /** Bump this (e.g. after restoring a snapshot) to recreate the editor with `value`. */
  resetKey: number
  onChange: (value: string) => void
}

const PLACEHOLDER: Record<Language, string> = {
  python: '# Write your Python here…',
  javascript: '// Write your JavaScript here…',
  java: '// Write your Java here…',
}

function langExtension(language: Language) {
  if (language === 'python') return python()
  if (language === 'java') return java()
  return javascript()
}

/** A dark CodeMirror editor for Python / JavaScript / Java. */
export function useCodeEditor({ value, language, resetKey, onChange }: Options) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)
  useLayoutEffect(() => {
    onChangeRef.current = onChange
    valueRef.current = value
  })

  // Recreate the editor whenever the language or the reset token changes,
  // seeding from the latest value. Keystrokes don't re-run this.
  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: valueRef.current,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        lineNumbers(),
        langExtension(language),
        oneDark,
        cmPlaceholder(PLACEHOLDER[language]),
        indentUnit.of('    '),
        EditorView.lineWrapping,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChangeRef.current(u.state.doc.toString())
        }),
        EditorView.theme({
          '&': { height: '100%', fontSize: '13px' },
          '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.6' },
          '.cm-content': { padding: '12px 0' },
        }),
      ],
    })

    const view = new EditorView({ state, parent: containerRef.current })
    return () => view.destroy()
  }, [language, resetKey])

  return containerRef
}
