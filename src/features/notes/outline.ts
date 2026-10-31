export interface OutlineItem {
  level: number
  text: string
  /** 0-based line index in the source markdown. */
  line: number
}

/**
 * Extract the heading outline from Markdown, skipping fenced code blocks.
 * Headings inside ``` or ~~~ fences are ignored so code comments like
 * "# not a heading" don't pollute the outline.
 */
export function extractOutline(md: string): OutlineItem[] {
  const lines = md.split('\n')
  const out: OutlineItem[] = []
  let fence: string | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const fenceMatch = line.match(/^\s*(```+|~~~+)/)
    if (fenceMatch) {
      if (fence === null) fence = fenceMatch[1][0]
      else if (line.trimStart().startsWith(fence)) fence = null
      continue
    }
    if (fence !== null) continue

    const m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/)
    if (m) out.push({ level: m[1].length, text: m[2].trim(), line: i })
  }
  return out
}

/**
 * Given a source pane's scroll position, the proportional scrollTop for a
 * target pane so the two stay roughly aligned. Pure for testing.
 */
export function proportionalScrollTop(args: {
  sourceScrollTop: number
  sourceScrollHeight: number
  sourceClientHeight: number
  targetScrollHeight: number
  targetClientHeight: number
}): number {
  const sourceMax = args.sourceScrollHeight - args.sourceClientHeight
  const targetMax = args.targetScrollHeight - args.targetClientHeight
  if (sourceMax <= 0 || targetMax <= 0) return 0
  const ratio = Math.min(1, Math.max(0, args.sourceScrollTop / sourceMax))
  return Math.round(ratio * targetMax)
}

/** Index of the outline item that is the current section for a given top line. */
export function activeOutlineIndex(outline: OutlineItem[], topLine: number): number {
  let active = -1
  for (let i = 0; i < outline.length; i++) {
    if (outline[i].line <= topLine) active = i
    else break
  }
  return active
}
