import { describe, it, expect } from 'vitest'
import { ApiCore, defaultSearchParams, defaultBaseUrl, maxRowsByRequest, fullTextSearchFields, langsWithTranslation } from '../src/index'

describe('index exports', () => {
  it('should export ApiCore class', () => {
    expect(ApiCore).toBeDefined()
    expect(typeof ApiCore).toBe('function')
  })

  it('should allow creating an ApiCore instance', () => {
    const api = new ApiCore()
    expect(api).toBeDefined()
    expect(typeof api.search).toBe('function')
    expect(typeof api.get).toBe('function')
    expect(typeof api.mlt).toBe('function')
    expect(typeof api.list).toBe('function')
    expect(typeof api.authenticate).toBe('function')
  })

  it('should export defaultSearchParams', () => {
    expect(defaultSearchParams).toEqual({
      dateFrom: '1980-01-01',
      dateTo: 'now',
      size: 10,
      sortField: 'published',
      sortOrder: 'desc'
    })
  })

  it('should export defaultBaseUrl', () => {
    expect(defaultBaseUrl).toBe('https://afp-apicore-prod-v2-external.app.afp.com')
  })

  it('should export maxRowsByRequest', () => {
    expect(maxRowsByRequest).toBe(1000)
  })

  it('should export fullTextSearchFields', () => {
    expect(fullTextSearchFields).toEqual(['all', 'title', 'news'])
  })

  it('should export langsWithTranslation', () => {
    expect(langsWithTranslation).toEqual(['fr', 'en', 'es', 'de', 'pt', 'ar'])
  })
})
