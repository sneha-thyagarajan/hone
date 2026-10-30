/**
 * Pure text transforms for the note editor's formatting toolbar. They operate on
 * a string + selection offsets so they can be unit-tested without CodeMirror,
 * then applied to the editor via a whole-document dispatch.
 */

export interface EditState {
  text: string
  from: number
  to: number
}

export type EditResult = EditState

/** Wrap (or unwrap, if already wrapped) the selection with an inline marker. */
export function toggleWrap(s: EditState, marker: string): EditResult {
  const { text, from, to } = s
  const before = text.slice(0, from)
  const selected = text.slice(from, to)
  const after = text.slice(to)
  const len = marker.length

  // Already wrapped immediately outside the selection → unwrap
  if (before.endsWith(marker) && after.startsWith(marker)) {
    return {
      text: before.slice(0, -len) + selected + after.slice(len),
      from: from - len,
      to: to - len,
    }
  }

  // Selection itself contains the markers → unwrap inner
  if (selected.length >= 2 * len && selected.startsWith(marker) && selected.endsWith(marker)) {
    return {
      text: before + selected.slice(len, -len) + after,
      from,
      to: to - 2 * len,
    }
  }

  // Wrap
  return {
    text: `${before}${marker}${selected}${marker}${after}`,
    from: from + len,
    to: to + len,
  }
}

/** Toggle an ATX heading of the given level on the line containing the cursor. */
export function toggleHeading(s: EditState, level = 2): EditResult {
  const { text, from, to } = s
  const lineStart = text.lastIndexOf('\n', from - 1) + 1
  const rest = text.slice(lineStart)
  const match = rest.match(/^(#{1,6}) /)
  const prefix = '#'.repeat(level) + ' '

  let delta: number
  let newText: string
  if (match && match[1].length === level) {
    // same level → remove
    delta = -match[0].length
    newText = text.slice(0, lineStart) + rest.slice(match[0].length)
  } else if (match) {
    // different level → replace
    delta = prefix.length - match[0].length
    newText = text.slice(0, lineStart) + prefix + rest.slice(match[0].length)
  } else {
    // none → add
    delta = prefix.length
    newText = text.slice(0, lineStart) + prefix + rest
  }
  return { text: newText, from: Math.max(lineStart, from + delta), to: to + delta }
}

/** Toggle a `- ` bullet on every line spanned by the selection. */
export function toggleList(s: EditState): EditResult {
  const { text, from, to } = s
  const lineStart = text.lastIndexOf('\n', from - 1) + 1
  let lineEnd = text.indexOf('\n', to)
  if (lineEnd === -1) lineEnd = text.length

  const block = text.slice(lineStart, lineEnd)
  const lines = block.split('\n')
  const allBulleted = lines.every((l) => l.trim() === '' || /^- /.test(l))

  const transformed = lines
    .map((l) => {
      if (l.trim() === '') return l
      return allBulleted ? l.replace(/^- /, '') : `- ${l}`
    })
    .join('\n')

  const delta = transformed.length - block.length
  return {
    text: text.slice(0, lineStart) + transformed + text.slice(lineEnd),
    from: lineStart,
    to: to + delta,
  }
}

/** Count words in a block of text. */
export function countWords(text: string): number {
  const matches = text.trim().match(/\S+/g)
  return matches ? matches.length : 0
}
