import { useEffect, useLayoutEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'

interface UseMarkdownEditorOptions {
  initialValue: string
  onChange: (value: string) => void
}

/** Returns a ref to attach to the container div. */
export function useMarkdownEditor({ initialValue, onChange }: UseMarkdownEditorOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  // Keep onChange stable in the closure
  const onChangeRef = useRef(onChange)
  // Sync after every render without recreating the editor
  useLayoutEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    if (!containerRef.current) return

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString())
      }
    })

    const theme = EditorView.theme({
      '&': {
        height: '100%',
        fontSize: '14px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--color-ink)',
        backgroundColor: 'transparent',
      },
      '.cm-scroller': { overflow: 'auto', lineHeight: '1.7' },
      '.cm-content': { padding: '16px', caretColor: 'var(--color-accent)' },
      '.cm-line': { padding: '0' },
      '.cm-focused': { outline: 'none' },
      '.cm-cursor': { borderLeftColor: 'var(--color-accent)' },
      '.cm-gutters': {
        backgroundColor: 'transparent',
        border: 'none',
        color: 'var(--color-muted)',
      },
      '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--color-accent) 7%, transparent)' },
      '.cm-activeLineGutter': { backgroundColor: 'transparent' },
      '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: 'color-mix(in srgb, var(--color-accent) 20%, transparent)',
      },
    })

    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        lineNumbers(),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        syntaxHighlighting(defaultHighlightStyle),
        theme,
        updateListener,
        EditorView.lineWrapping,
      ],
    })

    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // Only runs once per mount — initialValue intentionally excluded so the
    // editor owns its own document state after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return containerRef
}
