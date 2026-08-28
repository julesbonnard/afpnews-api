import { describe, it, expect } from 'vitest'
import { parseParagraphBlocks, numberParagraphs } from '../../src/utils/paragraphs'

describe('parseParagraphBlocks', () => {
  it('returns empty array for empty input', () => {
    expect(parseParagraphBlocks([])).toEqual([])
  })

  it('classifies plain text as paragraph', () => {
    expect(parseParagraphBlocks(['Hello world'])).toEqual([
      { type: 'paragraph', text: 'Hello world', startIndex: 0 }
    ])
  })

  it('detects dot-prefix subtitle', () => {
    expect(parseParagraphBlocks(['. Mon sous-titre'])).toEqual([
      { type: 'subtitle', text: 'Mon sous-titre', startIndex: 0 }
    ])
  })

  it('detects dot-prefix subtitle with trailing spaces', () => {
    expect(parseParagraphBlocks(['.  Titre avec espaces  '])).toEqual([
      { type: 'subtitle', text: 'Titre avec espaces', startIndex: 0 }
    ])
  })

  it('detects dash-wrapped subtitle (isolated dash line)', () => {
    // e.g. « — Résultats — » with no neighbouring dash line
    expect(parseParagraphBlocks(['— Résultats —'])).toEqual([
      { type: 'subtitle', text: 'Résultats', startIndex: 0 }
    ])
  })

  it('does NOT detect dash-wrapped line as subtitle when surrounded by other dash lines', () => {
    // A dash line surrounded by other dash lines is a list item, not a subtitle
    const paragraphs = ['— Item A', '— Ambiguous —', '— Item C']
    const blocks = parseParagraphBlocks(paragraphs)
    // All three should form a single list, not subtitles
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe('list')
  })

  it('groups consecutive dash lines into a single list block', () => {
    const paragraphs = ['— Item A', '— Item B', '— Item C']
    expect(parseParagraphBlocks(paragraphs)).toEqual([
      { type: 'list', items: ['Item A', 'Item B', 'Item C'], startIndex: 0 }
    ])
  })

  it('handles mixed content: paragraph → subtitle → list → paragraph', () => {
    const paragraphs = [
      'Introduction.',
      '. Bilan économique',
      '— Point 1',
      '— Point 2',
      'Conclusion.'
    ]
    expect(parseParagraphBlocks(paragraphs)).toEqual([
      { type: 'paragraph', text: 'Introduction.', startIndex: 0 },
      { type: 'subtitle', text: 'Bilan économique', startIndex: 1 },
      { type: 'list', items: ['Point 1', 'Point 2'], startIndex: 2 },
      { type: 'paragraph', text: 'Conclusion.', startIndex: 4 }
    ])
  })

  it('handles multiple subtitle sections', () => {
    const paragraphs = [
      '. Section 1',
      'Paragraphe 1.',
      '. Section 2',
      'Paragraphe 2.'
    ]
    const blocks = parseParagraphBlocks(paragraphs)
    expect(blocks.filter(b => b.type === 'subtitle')).toHaveLength(2)
    expect(blocks.filter(b => b.type === 'paragraph')).toHaveLength(2)
  })

  it('splits multiple lists separated by a paragraph', () => {
    const paragraphs = ['— A', '— B', 'Texte intermédiaire', '— C', '— D']
    const blocks = parseParagraphBlocks(paragraphs)
    expect(blocks).toEqual([
      { type: 'list', items: ['A', 'B'], startIndex: 0 },
      { type: 'paragraph', text: 'Texte intermédiaire', startIndex: 2 },
      { type: 'list', items: ['C', 'D'], startIndex: 3 }
    ])
  })

  it('handles en-dash, em-dash and hyphen as list markers when surrounded by peers', () => {
    // Surrounded by other dash lines, short dash-prefixed sentences become list items
    expect(parseParagraphBlocks(['– A', '– B'])).toEqual([
      { type: 'list', items: ['A', 'B'], startIndex: 0 }
    ])
    expect(parseParagraphBlocks(['— A', '— B'])).toEqual([
      { type: 'list', items: ['A', 'B'], startIndex: 0 }
    ])
    expect(parseParagraphBlocks(['- A', '- B'])).toEqual([
      { type: 'list', items: ['A', 'B'], startIndex: 0 }
    ])
  })

  it('uses at most 7 words for a dash-wrapped subtitle match', () => {
    // The regex allows 0 to 6 word pairs + 1 final word = 7 words max
    const short = '— Un deux trois quatre cinq six —'
    expect(parseParagraphBlocks([short])[0].type).toBe('subtitle')

    // 8 words: must NOT be a subtitle once isolated (treated as list or paragraph)
    const long = '— Un deux trois quatre cinq six sept huit —'
    const result = parseParagraphBlocks([long])
    // Starts with a dash, so it becomes a list item, not a subtitle
    expect(result[0].type).toBe('list')
  })

  it('does not confuse a plain sentence starting with a dash as a subtitle', () => {
    const paragraphs = ['— Cet élément est long et ne finit pas par un tiret']
    const blocks = parseParagraphBlocks(paragraphs)
    // Long content: list or paragraph, but NOT subtitle
    expect(blocks[0].type).not.toBe('subtitle')
  })

  it('assigns correct startIndex for each block', () => {
    const paragraphs = ['Intro', '. Titre', '— A', '— B', 'Fin']
    const blocks = parseParagraphBlocks(paragraphs)
    expect(blocks[0].startIndex).toBe(0) // paragraph 'Intro'
    expect(blocks[1].startIndex).toBe(1) // subtitle '. Titre'
    expect(blocks[2].startIndex).toBe(2) // list starting at '— A'
    expect(blocks[3].startIndex).toBe(4) // paragraph 'Fin'
  })
})

describe('numberParagraphs', () => {
  it('prefixes each paragraph with a 1-based marker', () => {
    expect(numberParagraphs(['Alpha', 'Bravo', 'Charlie'])).toBe(
      '[¶1] Alpha\n[¶2] Bravo\n[¶3] Charlie'
    )
  })

  it('returns an empty string for an empty list', () => {
    expect(numberParagraphs([])).toBe('')
  })
})
