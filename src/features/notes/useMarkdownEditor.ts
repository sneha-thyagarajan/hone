import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, placeholder as cmPlaceholder } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { search, searchKeymap, openSearchPanel } from '@codemirror/search'
import type { EditResult, EditState } from './markdownCommands'

interface UseMarkdownEditorOptions {
  initialValue: string
  onChange: (value: string) => void
  placeholder?: string
  /** Called on editor scroll with the 1-based line at the top of the viewport. */
  onScrollLine?: (topLine: number) => void
}

/** Returns a container ref plus editor controls (formatting, scroll, search). */
export function useMarkdownEditor({
  initialValue,
  onChange,
  placeholder,
  onScrollLine,
}: UseMarkdownEditorOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onScrollLineRef = useRef(onScrollLine)
  useLayoutEffect(() => {
    onChangeRef.current = onChange
    onScrollLineRef.current = onScrollLine
  })

  const applyEdit = useCallback((transform: (s: EditState) => EditResult) => {
    const view = viewRef.current
    if (!view) return
    const { from, to } = view.state.selection.main
    const text = view.state.doc.toString()
    const result = transform({ text, from, to })
    view.dispatch({
      changes: { from: 0, to: text.length, insert: result.text },
      selection: { anchor: result.from, head: result.to },
    })
    view.focus()
  }, [])

  /** Scroll a 1-based line to the top of the editor viewport. */
  const scrollToLine = useCallback((line: number) => {
    const view = viewRef.current
    if (!view) return
    const clamped = Math.max(1, Math.min(line, view.state.doc.lines))
    const pos = view.state.doc.line(clamped).from
    view.dispatch({ effects: EditorView.scrollIntoView(pos, { y: 'start' }) })
  }, [])

  const openFind = useCallback(() => {
    if (viewRef.current) openSearchPanel(viewRef.current)
  }, [])

  const getScrollDOM = useCallback(() => viewRef.current?.scrollDOM ?? null, [])

  useEffect(() => {
    if (!containerRef.current) return

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) onChangeRef.current(update.state.doc.toString())
    })

    const scrollListener = EditorView.domEventHandlers({
      scroll: (_e, view) => {
        if (!onScrollLineRef.current) return
        const top = view.lineBlockAtHeight(view.scrollDOM.scrollTop)
        onScrollLineRef.current(view.state.doc.lineAt(top.from).number)
      },
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
        search({ top: true }),
        keymap.of([...searchKeymap, ...defaultKeymap, ...historyKeymap]),
        lineNumbers(),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        syntaxHighlighting(defaultHighlightStyle),
        ...(placeholder ? [cmPlaceholder(placeholder)] : []),
        theme,
        updateListener,
        scrollListener,
        EditorView.lineWrapping,
      ],
    })

    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { containerRef, applyEdit, scrollToLine, openFind, getScrollDOM }
}
