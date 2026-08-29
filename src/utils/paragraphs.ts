const SUBTITLE_DASH_RE = /^\s*[-–—]\s+((?:\S+\s+){0,6}\S+?)(?:\s+[-–—])?\s*$/
const SUBTITLE_DOT_RE = /^\s*\.\s+(.+?)\s*$/
const STARTS_WITH_DASH_RE = /^\s*[-–—]\s+/

export type ParagraphBlock =
  | { type: 'subtitle'; text: string; startIndex: number }
  | { type: 'list'; items: string[]; startIndex: number }
  | { type: 'paragraph'; text: string; startIndex: number }

function getListItem(p: string): string {
  return p.replace(STARTS_WITH_DASH_RE, '').replace(/\s*[-–—]\s*$/, '')
}

function getSubtitle(p: string): string {
  const dashMatch = p.match(SUBTITLE_DASH_RE)
  if (dashMatch) return dashMatch[1].replace(/\s*[-–—]\s*$/, '')
  return p.match(SUBTITLE_DOT_RE)?.[1] ?? p
}

/**
 * Converts raw AFP wire paragraph strings into typed blocks (subtitle, list,
 * paragraph).
 *
 * AFP wire text uses two subtitle conventions:
 *   - Dot prefix: ". Subtitle text"
 *   - Dash-wrapped: "— Short title —" (only when not surrounded by other dash lines)
 * List items start with a dash and are grouped into a single list block.
 */
export function parseParagraphBlocks(paragraphs: string[]): ParagraphBlock[] {
  const blocks: ParagraphBlock[] = []

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i]
    const prevIsDash = i > 0 && STARTS_WITH_DASH_RE.test(paragraphs[i - 1])
    const nextIsDash =
      i < paragraphs.length - 1 && STARTS_WITH_DASH_RE.test(paragraphs[i + 1])

    if (SUBTITLE_DOT_RE.test(p)) {
      blocks.push({ type: 'subtitle', text: getSubtitle(p), startIndex: i })
    } else if (SUBTITLE_DASH_RE.test(p) && !prevIsDash && !nextIsDash) {
      blocks.push({ type: 'subtitle', text: getSubtitle(p), startIndex: i })
    } else if (STARTS_WITH_DASH_RE.test(p)) {
      const last = blocks[blocks.length - 1]
      if (last?.type === 'list') {
        last.items.push(getListItem(p))
      } else {
        blocks.push({ type: 'list', items: [getListItem(p)], startIndex: i })
      }
    } else {
      blocks.push({ type: 'paragraph', text: p, startIndex: i })
    }
  }

  return blocks
}

/**
 * Prefixes each paragraph with a `[¶n]` marker (1-based), so a consumer (an
 * LLM, typically) can build a deep-link back to a specific paragraph (e.g.
 * `/doc/UNO?p=n` in afpnews-deck) without counting paragraphs itself.
 *
 * The marker is purely technical: callers relaying this text to a model
 * should instruct it to never reproduce the marker in a quote or answer.
 */
export function numberParagraphs(paragraphs: string[]): string {
  return paragraphs.map((p, i) => `[¶${i + 1}] ${p}`).join('\n')
}
