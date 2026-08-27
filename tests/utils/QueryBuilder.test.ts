import { describe, it, expect } from 'vitest'
import { QueryBuilder } from '../../src/utils/QueryBuilder'

describe('QueryBuilder', () => {
  describe('constructor', () => {
    it('should initialize with default values', () => {
      const qb = new QueryBuilder()
      expect(qb.maxRows).toBe(10)
      expect(qb.dateFrom).toBe('1980-01-01')
      expect(qb.dateTo).toBe('now')
      expect(qb.sortField).toBe('published')
      expect(qb.sortOrder).toBe('desc')
    })

    it('should set fields when provided', () => {
      const qb = new QueryBuilder(['title', 'uno'])
      expect(qb.fields).toEqual(['title', 'uno'])
    })

    it('should include fields in build output', () => {
      const result = new QueryBuilder(['title', 'uno'])
        .setMaxRows(10)
        .build()
      expect(result.fields).toEqual(['title', 'uno'])
    })
  })

  describe('setMaxRows', () => {
    it('should set maxRows', () => {
      const qb = new QueryBuilder()
      qb.setMaxRows(50)
      expect(qb.maxRows).toBe(50)
    })

    it('should throw when maxRows is not provided', () => {
      const qb = new QueryBuilder()
      expect(() => qb.setMaxRows(0)).toThrow('maxRows is required')
    })

    it('should throw when maxRows exceeds 1000', () => {
      const qb = new QueryBuilder()
      expect(() => qb.setMaxRows(1001)).toThrow('maxRows cannot be greater than 1000')
    })

    it('should accept maxRows of exactly 1000', () => {
      const qb = new QueryBuilder()
      qb.setMaxRows(1000)
      expect(qb.maxRows).toBe(1000)
    })

    it('should return this for chaining', () => {
      const qb = new QueryBuilder()
      expect(qb.setMaxRows(10)).toBe(qb)
    })
  })

  describe('setDateRange', () => {
    it('should set date range', () => {
      const qb = new QueryBuilder()
      qb.setDateRange('2023-01-01', '2023-12-31')
      expect(qb.dateFrom).toBe('2023-01-01')
      expect(qb.dateTo).toBe('2023-12-31')
    })

    it('should only set from if to is undefined', () => {
      const qb = new QueryBuilder()
      qb.setDateRange('2023-01-01')
      expect(qb.dateFrom).toBe('2023-01-01')
      expect(qb.dateTo).toBe('now')
    })

    it('should only set to if from is undefined', () => {
      const qb = new QueryBuilder()
      qb.setDateRange(undefined, '2023-12-31')
      expect(qb.dateFrom).toBe('1980-01-01')
      expect(qb.dateTo).toBe('2023-12-31')
    })

    it('should return this for chaining', () => {
      const qb = new QueryBuilder()
      expect(qb.setDateRange('2023-01-01', '2023-12-31')).toBe(qb)
    })
  })

  describe('setSort', () => {
    it('should set sort field and order', () => {
      const qb = new QueryBuilder()
      qb.setSort('title', 'asc')
      expect(qb.sortField).toBe('title')
      expect(qb.sortOrder).toBe('asc')
    })

    it('should keep defaults when not provided', () => {
      const qb = new QueryBuilder()
      qb.setSort()
      expect(qb.sortField).toBe('published')
      expect(qb.sortOrder).toBe('desc')
    })

    it('should return this for chaining', () => {
      const qb = new QueryBuilder()
      expect(qb.setSort('published', 'desc')).toBe(qb)
    })
  })

  describe('setLangs', () => {
    it('should set languages', () => {
      const qb = new QueryBuilder()
      qb.setLangs(['fr', 'en'])
      expect(qb.langs).toEqual(['fr', 'en'])
    })

    it('should not set langs when undefined', () => {
      const qb = new QueryBuilder()
      qb.setLangs(undefined)
      expect(qb.langs).toBeUndefined()
    })

    it('should return this for chaining', () => {
      const qb = new QueryBuilder()
      expect(qb.setLangs(['fr'])).toBe(qb)
    })
  })

  describe('setQuery', () => {
    it('should set query string', () => {
      const qb = new QueryBuilder()
      qb.setQuery('Macron')
      expect(qb.queryString).toBe('Macron')
    })

    it('should not set query when undefined', () => {
      const qb = new QueryBuilder()
      qb.setQuery(undefined)
      expect(qb.queryString).toBeUndefined()
    })

    it('should return this for chaining', () => {
      const qb = new QueryBuilder()
      expect(qb.setQuery('test')).toBe(qb)
    })
  })

  describe('addAdditionalParams', () => {
    it('should return this when params is undefined', () => {
      const qb = new QueryBuilder()
      expect(qb.addAdditionalParams(undefined)).toBe(qb)
    })

    it('should return this for chaining', () => {
      const qb = new QueryBuilder()
      expect(qb.addAdditionalParams({ country: 'fra' })).toBe(qb)
    })
  })

  describe('build', () => {
    it('should produce a valid SearchRequest with defaults', () => {
      const result = new QueryBuilder()
        .setMaxRows(10)
        .build()

      expect(result).toEqual({
        dateRange: { from: '1980-01-01', to: 'now' },
        maxRows: 10,
        sortField: 'published',
        sortOrder: 'desc',
        lang: undefined,
        fields: undefined,
        query: undefined
      })
    })

    it('should include lang when langs are set and no lang: in query', () => {
      const result = new QueryBuilder()
        .setMaxRows(10)
        .setLangs(['fr', 'en'])
        .build()

      expect(result.lang).toBe('fr,en')
    })

    it('should not include lang when query contains lang:', () => {
      const result = new QueryBuilder()
        .setMaxRows(10)
        .setLangs(['fr'])
        .setQuery('lang:fr Macron')
        .build()

      expect(result.lang).toBeUndefined()
    })

    it('should include additional params in query', () => {
      const result = new QueryBuilder()
        .setMaxRows(10)
        .addAdditionalParams({ country: 'fra' })
        .build()

      expect(result.query).toBeDefined()
      expect(result.query!.and).toBeDefined()
      expect(result.query!.and).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'country', in: ['fra'] })
        ])
      )
    })

    it('should handle array additional params', () => {
      const result = new QueryBuilder()
        .setMaxRows(10)
        .addAdditionalParams({ country: ['fra', 'usa'] })
        .build()

      expect(result.query!.and).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'country', in: ['fra', 'usa'] })
        ])
      )
    })

    it('should handle object with in property', () => {
      const result = new QueryBuilder()
        .setMaxRows(10)
        .addAdditionalParams({ country: { in: ['fra', 'usa'] } })
        .build()

      expect(result.query!.and).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'country', in: ['fra', 'usa'] })
        ])
      )
    })

    it('should handle object with exclude property', () => {
      const result = new QueryBuilder()
        .setMaxRows(10)
        .addAdditionalParams({ country: { exclude: ['usa'] } })
        .build()

      expect(result.query!.and).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'country', exclude: ['usa'] })
        ])
      )
    })

    it('should handle numeric additional param', () => {
      const result = new QueryBuilder()
        .setMaxRows(10)
        .addAdditionalParams({ urgency: 3 })
        .build()

      expect(result.query!.and).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'urgency', in: [3] })
        ])
      )
    })

    it('should skip empty array additional params', () => {
      const result = new QueryBuilder()
        .setMaxRows(10)
        .addAdditionalParams({ country: [] })
        .build()

      expect(result.query).toBeUndefined()
    })
  })

  describe('parseQueryString', () => {
    it('should return undefined for empty query', () => {
      const qb = new QueryBuilder()
      expect(qb.parseQueryString(undefined)).toBeUndefined()
      expect(qb.parseQueryString('')).toBeUndefined()
    })

    it('should parse a simple word query', () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString('Macron')

      expect(result).toBeDefined()
      expect(result!.or).toBeDefined()
    })

    it('should parse a field:value query', () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString('country:fra')

      expect(result).toBeDefined()
      expect(result!.or).toBeDefined()
      expect(result!.or).toEqual(
        expect.arrayContaining([
          // vitest's asymmetric matchers (arrayContaining/objectContaining) are typed to return `any`
          // eslint-disable-next-line typescript/no-unsafe-assignment
          expect.objectContaining({ name: 'country', in: expect.arrayContaining(['fra']) })
        ])
      )
    })

    it('should parse OR expression', () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString('title:Macron OR title:Merkel')

      expect(result).toBeDefined()
      expect(result!.or).toBeDefined()
    })

    it('should parse AND expression', () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString('title:Macron AND country:fra')

      expect(result).toBeDefined()
      expect(result!.and).toBeDefined()
    })

    it('should parse implicit AND (space-separated)', () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString('Macron France')

      expect(result).toBeDefined()
      expect(result!.and).toBeDefined()
    })

    it('should parse NOT expression', () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString('NOT country:fra')

      expect(result).toBeDefined()
      expect(result!.or).toBeDefined()
      // NOT should produce exclude instead of in
      const flat = JSON.stringify(result)
      expect(flat).toContain('exclude')
    })

    it('should parse quoted values', () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString('title:"Jean-Luc Mélenchon"')

      expect(result).toBeDefined()
      expect(result!.or).toBeDefined()
    })

    it('should parse parenthesized expressions', () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString('(title:Macron OR title:Merkel) AND country:fra')

      expect(result).toBeDefined()
      expect(result!.and).toBeDefined()
    })

    it('should parse empty parentheses', () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString('()')

      // Empty expression serializes to undefined
      expect(result).toBeUndefined()
    })

    it('should parse lowercase "and" keyword', () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString('macron and france')

      expect(result).toBeDefined()
      expect(result!.and).toBeDefined()
    })

    it('should parse lowercase "or" keyword', () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString('macron or merkel')

      expect(result).toBeDefined()
      expect(result!.or).toBeDefined()
    })

    it('should parse lowercase "not" keyword', () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString('not country:fra')

      expect(result).toBeDefined()
      const flat = JSON.stringify(result)
      expect(flat).toContain('exclude')
    })

    it('should parse mixed-case keywords', () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString('macron And france')

      expect(result).toBeDefined()
      expect(result!.and).toBeDefined()
    })

    it('should parse "android" as a word, not AND + roid', () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString('android')

      expect(result).toBeDefined()
      expect(result!.or).toBeDefined()
      const flat = JSON.stringify(result)
      expect(flat).toContain('android')
    })

    it('should parse "notice" as a word, not NOT + ice', () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString('notice')

      expect(result).toBeDefined()
      expect(result!.or).toBeDefined()
      const flat = JSON.stringify(result)
      expect(flat).toContain('notice')
    })

    it('should parse "forest" as a word, not FOR + est', () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString('forest')

      expect(result).toBeDefined()
      expect(result!.or).toBeDefined()
      const flat = JSON.stringify(result)
      expect(flat).toContain('forest')
    })

    it('should throw on unmatched parenthesis', () => {
      const qb = new QueryBuilder()
      expect(() => qb.parseQueryString('(Macron')).toThrow('Failed to parse query')
    })

    it('should throw on unmatched quote', () => {
      const qb = new QueryBuilder()
      expect(() => qb.parseQueryString('"unclosed')).toThrow('Failed to parse query')
    })

    it('should parse escaped quotes in strings', () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString('title:"say \\"hello\\""')

      expect(result).toBeDefined()
      const flat = JSON.stringify(result)
      expect(flat).toContain('say \\"hello\\"')
    })

    it('should parse escaped backslash in strings', () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString('title:"path\\\\file"')

      expect(result).toBeDefined()
      const flat = JSON.stringify(result)
      expect(flat).toContain('path\\\\file')
    })

    it('should parse field with empty value (country:)', () => {
      const qb = new QueryBuilder()
      // Empty value after colon produces EmptyExpression which serializer cannot handle
      expect(() => qb.parseQueryString('country:')).toThrow()
    })

    it('should parse double parentheses', () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString('((Macron))')

      expect(result).toBeDefined()
      expect(result!.or).toBeDefined()
    })

    it("should parse French apostrophe (l'AFP)", () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString("l'AFP")

      expect(result).toBeDefined()
      expect(result!.or).toBeDefined()
      const flat = JSON.stringify(result)
      // normalizer lowercases the text
      expect(flat).toContain("l'afp")
    })

    it('should parse hyphenated words (Jean-Luc)', () => {
      const qb = new QueryBuilder()
      const result = qb.parseQueryString('Jean-Luc')

      expect(result).toBeDefined()
      expect(result!.or).toBeDefined()
      const flat = JSON.stringify(result)
      // normalizer lowercases the text
      expect(flat).toContain('jean-luc')
    })

    it('should handle full-text search fields with translation', () => {
      const qb = new QueryBuilder()
      qb.setLangs(['fr', 'en'])
      const result = qb.parseQueryString('title:Macron')

      expect(result).toBeDefined()
      // Full-text fields (title) should generate translated fields
      const flat = JSON.stringify(result)
      expect(flat).toContain('translated.fr.title')
      expect(flat).toContain('translated.en.title')
    })

    it('should not generate translations for non-full-text fields', () => {
      const qb = new QueryBuilder()
      qb.setLangs(['fr', 'en'])
      const result = qb.parseQueryString('country:fra')

      const flat = JSON.stringify(result)
      expect(flat).not.toContain('translated')
    })
  })

  describe('setStartAt', () => {
    it('should set startAt', () => {
      const qb = new QueryBuilder()
      qb.setStartAt(5)
      expect(qb.startAt).toBe(5)
    })

    it('should set startAt to 0', () => {
      const qb = new QueryBuilder()
      qb.setStartAt(0)
      expect(qb.startAt).toBe(0)
    })

    it('should not set startAt when undefined', () => {
      const qb = new QueryBuilder()
      qb.setStartAt(undefined)
      expect(qb.startAt).toBeUndefined()
    })

    it('should return this for chaining', () => {
      const qb = new QueryBuilder()
      expect(qb.setStartAt(0)).toBe(qb)
    })
  })

  describe('setTz', () => {
    it('should set timezone', () => {
      const qb = new QueryBuilder()
      qb.setTz('Europe/Paris')
      expect(qb.tz).toBe('Europe/Paris')
    })

    it('should not set tz when undefined', () => {
      const qb = new QueryBuilder()
      qb.setTz(undefined)
      expect(qb.tz).toBeUndefined()
    })

    it('should return this for chaining', () => {
      const qb = new QueryBuilder()
      expect(qb.setTz('UTC')).toBe(qb)
    })
  })

  describe('setDateGap', () => {
    it('should set dateGap', () => {
      const qb = new QueryBuilder()
      qb.setDateGap('+1HOUR')
      expect(qb.dateGap).toBe('+1HOUR')
    })

    it('should not set dateGap when undefined', () => {
      const qb = new QueryBuilder()
      qb.setDateGap(undefined)
      expect(qb.dateGap).toBeUndefined()
    })

    it('should return this for chaining', () => {
      const qb = new QueryBuilder()
      expect(qb.setDateGap('+1DAY')).toBe(qb)
    })
  })

  describe('setWantCluster', () => {
    it('should set wantCluster to true', () => {
      const qb = new QueryBuilder()
      qb.setWantCluster(true)
      expect(qb.wantCluster).toBe(true)
    })

    it('should set wantCluster to false', () => {
      const qb = new QueryBuilder()
      qb.setWantCluster(false)
      expect(qb.wantCluster).toBe(false)
    })

    it('should not set wantCluster when undefined', () => {
      const qb = new QueryBuilder()
      qb.setWantCluster(undefined)
      expect(qb.wantCluster).toBeUndefined()
    })

    it('should return this for chaining', () => {
      const qb = new QueryBuilder()
      expect(qb.setWantCluster(true)).toBe(qb)
    })
  })

  describe('setWantedFacets', () => {
    it('should set wantedFacets', () => {
      const qb = new QueryBuilder()
      const facets = { slug: { size: 10, minDocCount: 1 } }
      qb.setWantedFacets(facets)
      expect(qb.wantedFacets).toEqual(facets)
    })

    it('should not set wantedFacets when undefined', () => {
      const qb = new QueryBuilder()
      qb.setWantedFacets(undefined)
      expect(qb.wantedFacets).toBeUndefined()
    })

    it('should return this for chaining', () => {
      const qb = new QueryBuilder()
      expect(qb.setWantedFacets({ slug: { size: 5, minDocCount: 1 } })).toBe(qb)
    })
  })

  describe('setMultiSort', () => {
    it('should set multiSort', () => {
      const qb = new QueryBuilder()
      const sort = [{ sortField: 'published', sortOrder: 'desc' as const }]
      qb.setMultiSort(sort)
      expect(qb.multiSort).toEqual(sort)
    })

    it('should not set multiSort when undefined', () => {
      const qb = new QueryBuilder()
      qb.setMultiSort(undefined)
      expect(qb.multiSort).toBeUndefined()
    })

    it('should return this for chaining', () => {
      const qb = new QueryBuilder()
      expect(qb.setMultiSort([])).toBe(qb)
    })
  })

  describe('build with new fields', () => {
    it('should include startAt when set', () => {
      const result = new QueryBuilder()
        .setMaxRows(10)
        .setStartAt(5)
        .build()

      expect(result.startAt).toBe(5)
    })

    it('should include tz when set', () => {
      const result = new QueryBuilder()
        .setMaxRows(10)
        .setTz('Europe/Paris')
        .build()

      expect(result.tz).toBe('Europe/Paris')
    })

    it('should include dateGap when set', () => {
      const result = new QueryBuilder()
        .setMaxRows(10)
        .setDateGap('+1HOUR')
        .build()

      expect(result.dateGap).toBe('+1HOUR')
    })

    it('should include wantCluster when set', () => {
      const result = new QueryBuilder()
        .setMaxRows(10)
        .setWantCluster(true)
        .build()

      expect(result.wantCluster).toBe(true)
    })

    it('should include wantedFacets when set', () => {
      const facets = { slug: { size: 10, minDocCount: 1 }, empty: true }
      const result = new QueryBuilder()
        .setMaxRows(10)
        .setWantedFacets(facets)
        .build()

      expect(result.wantedFacets).toEqual(facets)
    })

    it('should include sort when multiSort is set', () => {
      const sort = [{ sortField: 'published', sortOrder: 'desc' as const }]
      const result = new QueryBuilder()
        .setMaxRows(10)
        .setMultiSort(sort)
        .build()

      expect(result.sort).toEqual(sort)
    })

    it('should not include new fields when not set', () => {
      const result = new QueryBuilder()
        .setMaxRows(10)
        .build()

      expect(result.startAt).toBeUndefined()
      expect(result.tz).toBeUndefined()
      expect(result.dateGap).toBeUndefined()
      expect(result.wantCluster).toBeUndefined()
      expect(result.wantedFacets).toBeUndefined()
      expect(result.sort).toBeUndefined()
    })
  })

  describe('chaining', () => {
    it('should support full fluent chain', () => {
      const result = new QueryBuilder()
        .setMaxRows(50)
        .setDateRange('2023-01-01', '2023-12-31')
        .setSort('published', 'asc')
        .setLangs(['fr'])
        .setQuery('Macron')
        .addAdditionalParams({ country: 'fra' })
        .build()

      expect(result.maxRows).toBe(50)
      expect(result.dateRange).toEqual({ from: '2023-01-01', to: '2023-12-31' })
      expect(result.sortField).toBe('published')
      expect(result.sortOrder).toBe('asc')
      expect(result.query).toBeDefined()
      expect(result.query!.and).toBeDefined()
    })
  })
})
