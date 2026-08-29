import { describe, it, expect } from 'vitest'
import { AFP_RAW_FIELDS, FIELD_SOURCES, MANDATORY_RAW_FIELDS, toApiFields } from '../src/fields'

describe('AFP_RAW_FIELDS', () => {
  it('lists every raw field of DocumentSourceSchema', () => {
    expect(AFP_RAW_FIELDS).toContain('uno')
    expect(AFP_RAW_FIELDS).toContain('bagItem')
    expect(AFP_RAW_FIELDS).toContain('afpentity')
  })
})

describe('MANDATORY_RAW_FIELDS', () => {
  it('derives exactly the socle required by parseDocument()', () => {
    expect([...MANDATORY_RAW_FIELDS].sort()).toEqual(
      ['class', 'created', 'lang', 'provider', 'published', 'revision', 'status', 'uno', 'urgency'].sort()
    )
  })
})

describe('FIELD_SOURCES', () => {
  it('maps a simple renamed field to its single raw source', () => {
    expect(FIELD_SOURCES.shortId).toEqual(['afpshortid'])
  })

  it('maps a field derived from two raw fields', () => {
    expect(FIELD_SOURCES.country).toEqual(['country', 'countryname'])
  })

  it('maps a field derived from a nested raw path', () => {
    expect(FIELD_SOURCES.events).toEqual(['afpentity'])
  })

  it('maps two output fields sharing the same raw source', () => {
    expect(FIELD_SOURCES.paragraphs).toContain('news')
    expect(FIELD_SOURCES.shots).toEqual(['news'])
  })
})

describe('toApiFields', () => {
  it('always includes the mandatory socle', () => {
    const fields = toApiFields(['uno', 'headline'])
    for (const f of MANDATORY_RAW_FIELDS) {
      expect(fields).toContain(f)
    }
  })

  it('translates a field to its raw source(s)', () => {
    const fields = toApiFields(['country'])
    expect(fields).toContain('country')
    expect(fields).toContain('countryname')
  })

  it('does not duplicate fields requested multiple times', () => {
    const fields = toApiFields(['paragraphs', 'shots'])
    expect(fields.filter(f => f === 'news')).toHaveLength(1)
  })

  it('returns only the mandatory socle for an empty field list', () => {
    expect([...toApiFields([])].sort()).toEqual([...MANDATORY_RAW_FIELDS].sort())
  })
})
