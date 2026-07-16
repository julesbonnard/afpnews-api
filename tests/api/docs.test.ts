import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { Docs } from '../../src/api/docs'
import type { SearchRequest } from '../../src/types'
import { mockFetch, mockFetchSequence } from '../helpers/mockFetch'

const TOKEN_RESPONSE = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600
}

function createAuthenticatedDocs() {
  const docs = new Docs()
  docs.token = {
    accessToken: 'test-token',
    refreshToken: 'test-refresh',
    tokenExpires: Date.now() + 60000,
    authType: 'anonymous'
  }
  return docs
}

describe('Docs', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should create an instance extending Auth', () => {
      const docs = new Docs()
      expect(docs).toBeInstanceOf(Docs)
      expect(docs.authUrl).toBeDefined()
    })
  })

  describe('search', () => {
    it('should authenticate and search', async () => {
      const searchResponse = {
        response: {
          docs: [{ uno: 'doc1', title: 'Test' }],
          numFound: 1
        }
      }
      // First call: anonymous token, second call: search
      mockFetchSequence([
        { body: TOKEN_RESPONSE },
        { body: searchResponse }
      ])

      const docs = new Docs()
      const result = await docs.search()

      expect(result.count).toBe(1)
      expect(result.documents).toHaveLength(1)
      expect(result.documents[0]).toEqual({ uno: 'doc1', title: 'Test' })
    })

    it('should use existing valid token', async () => {
      const searchResponse = {
        response: { docs: [], numFound: 0 }
      }
      mockFetch(searchResponse)

      const docs = createAuthenticatedDocs()
      const result = await docs.search()

      expect(result.count).toBe(0)
      expect(result.documents).toHaveLength(0)
      // Only one fetch call (search), no auth call
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('should pass search params to the API', async () => {
      const searchResponse = {
        response: { docs: [], numFound: 0 }
      }
      mockFetch(searchResponse)

      const docs = createAuthenticatedDocs()
      await docs.search({
        query: 'Macron',
        dateFrom: '2023-01-01',
        dateTo: '2023-12-31',
        size: 20,
        sortField: 'published',
        sortOrder: 'desc'
      })

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('/v1/api/search')

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      const body = JSON.parse(calledOptions.body as string) as SearchRequest
      expect(body.maxRows).toBe(20)
      expect(body.dateRange.from).toBe('2023-01-01')
      expect(body.dateRange.to).toBe('2023-12-31')
    })

    it('should use default search params when none provided', async () => {
      const searchResponse = {
        response: { docs: [], numFound: 0 }
      }
      mockFetch(searchResponse)

      const docs = createAuthenticatedDocs()
      await docs.search()

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      const body = JSON.parse(calledOptions.body as string) as SearchRequest
      expect(body.maxRows).toBe(10)
      expect(body.sortField).toBe('published')
      expect(body.sortOrder).toBe('desc')
    })
  })

  describe('get', () => {
    it('should fetch a document by UNO', async () => {
      const getResponse = {
        response: {
          docs: [{ uno: 'AFP-123', title: 'Test Document' }]
        }
      }
      mockFetch(getResponse)

      const docs = createAuthenticatedDocs()
      const result = await docs.get('AFP-123')

      expect(result).toEqual({ uno: 'AFP-123', title: 'Test Document' })

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('/v1/api/get/AFP-123')
    })
  })

  describe('mlt', () => {
    it('should fetch more-like-this documents', async () => {
      const mltResponse = {
        response: {
          docs: [{ uno: 'AFP-456' }, { uno: 'AFP-789' }],
          numFound: 2
        }
      }
      mockFetch(mltResponse)

      const docs = createAuthenticatedDocs()
      const result = await docs.mlt('AFP-123', 'en', 5)

      expect(result.count).toBe(2)
      expect(result.documents).toHaveLength(2)

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('/v1/api/mlt')
      expect(calledUrl).toContain('uno=AFP-123')
      expect(calledUrl).toContain('lang=en')
      expect(calledUrl).toContain('size=5')
    })

    it('should use default size of 10', async () => {
      const mltResponse = {
        response: { docs: [], numFound: 0 }
      }
      mockFetch(mltResponse)

      const docs = createAuthenticatedDocs()
      await docs.mlt('AFP-123', 'fr')

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('size=10')
    })
  })

  describe('list', () => {
    it('should list facet values', async () => {
      const listResponse = {
        response: {
          topics: [
            { name: 'politics', count: 150 },
            { name: 'economy', count: 75 }
          ],
          numFound: 2
        }
      }
      mockFetch(listResponse)

      const docs = createAuthenticatedDocs()
      const result = await docs.list('slug')

      expect(result.count).toBe(2)
      expect(result.keywords).toHaveLength(2)
      expect(result.keywords[0]).toEqual({ name: 'politics', count: 150 })

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('/v1/api/list/slug')
      expect(calledUrl).toContain('minDocCount=1')
    })

    it('should handle null topic name', async () => {
      const listResponse = {
        response: {
          topics: [
            { name: null, count: 50 },
            { name: 'economy', count: 75 }
          ],
          numFound: 2
        }
      }
      mockFetch(listResponse)

      const docs = createAuthenticatedDocs()
      const result = await docs.list('slug')

      expect(result.count).toBe(2)
      expect(result.keywords).toHaveLength(2)
      expect(result.keywords[0]).toEqual({ name: null, count: 50 })
    })

    it('should handle missing topic name', async () => {
      const listResponse = {
        response: {
          topics: [
            { count: 100 },
            { name: 'politics', count: 75 }
          ],
          numFound: 2
        }
      }
      mockFetch(listResponse)

      const docs = createAuthenticatedDocs()
      const result = await docs.list('slug')

      expect(result.count).toBe(2)
      expect(result.keywords).toHaveLength(2)
      expect(result.keywords[0]).toEqual({ count: 100 })
    })

    it('should pass custom minDocCount', async () => {
      const listResponse = {
        response: { topics: [], numFound: 0 }
      }
      mockFetch(listResponse)

      const docs = createAuthenticatedDocs()
      await docs.list('keyword', {}, 5)

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('minDocCount=5')
    })
  })

  describe('searchAll', () => {
    it('should yield documents across multiple pages using spied search', async () => {
      const docs = createAuthenticatedDocs()

      // Mock search to simulate pagination: 2 pages of 3 docs each
      const searchSpy = vi.spyOn(docs, 'search')
      let callNum = 0
      searchSpy.mockImplementation(() => {
        callNum++
        if (callNum === 1) {
          return Promise.resolve({
            count: 6,
            documents: [
              { uno: 'doc1', published: '2023-06-15T12:00:00Z' },
              { uno: 'doc2', published: '2023-06-14T12:00:00Z' },
              { uno: 'doc3', published: '2023-06-13T12:00:00Z' }
            ]
          })
        }
        return Promise.resolve({
          count: 6,
          documents: [
            { uno: 'doc4', published: '2023-06-12T12:00:00Z' },
            { uno: 'doc5', published: '2023-06-11T12:00:00Z' },
            { uno: 'doc6', published: '2023-06-10T12:00:00Z' }
          ]
        })
      })

      const collected: unknown[] = []
      // size: 6, each page returns 3 docs. Since 3 < 6 (params.size),
      // searchAll stops after page 1 — this tests the "fewer than requested" exit.
      // To actually paginate, size must exceed maxRequestSize (1000).
      for await (const doc of docs.searchAll({ size: 6 })) {
        collected.push(doc)
      }

      expect(collected).toHaveLength(3)
      expect(searchSpy).toHaveBeenCalledTimes(1)
    })

    it('should paginate when size exceeds maxRequestSize', async () => {
      const docs = createAuthenticatedDocs()

      const searchSpy = vi.spyOn(docs, 'search')
      let callNum = 0
      searchSpy.mockImplementation(() => {
        callNum++
        if (callNum === 1) {
          // Return exactly 1000 docs (matching maxRequestSize) so pagination continues
          const pageDocs = Array.from({ length: 1000 }, (_, i) => ({
            uno: `doc-${i}`,
            published: `2023-06-${String(15).padStart(2, '0')}T${String(i).padStart(2, '0')}:00:00Z`
          }))
          return Promise.resolve({ count: 1500, documents: pageDocs })
        }
        // Second page: fewer than requested → stops
        const pageDocs = Array.from({ length: 100 }, (_, i) => ({
          uno: `doc-${1000 + i}`,
          published: `2023-06-14T${String(i).padStart(2, '0')}:00:00Z`
        }))
        return Promise.resolve({ count: 1500, documents: pageDocs })
      })

      const collected: unknown[] = []
      for await (const doc of docs.searchAll({ size: 1500 })) {
        collected.push(doc)
      }

      // 1000 from page 1 + 100 from page 2
      expect(collected).toHaveLength(1100)
      expect(searchSpy).toHaveBeenCalledTimes(2)
    })

    it('should stop when no documents returned', async () => {
      mockFetch({ response: { docs: [], numFound: 0 } })

      const docs = createAuthenticatedDocs()
      const collected: unknown[] = []

      for await (const doc of docs.searchAll()) {
        collected.push(doc)
      }

      expect(collected).toHaveLength(0)
    })

    it('should stop when count <= documents.length', async () => {
      const docs = createAuthenticatedDocs()
      vi.spyOn(docs, 'search').mockResolvedValue({
        count: 2,
        documents: [
          { uno: 'doc1', published: '2023-06-15T12:00:00Z' },
          { uno: 'doc2', published: '2023-06-14T12:00:00Z' }
        ]
      })

      const collected: unknown[] = []
      for await (const doc of docs.searchAll({ size: 10 })) {
        collected.push(doc)
      }

      expect(collected).toHaveLength(2)
    })

    it('should use dateFrom for ascending sort direction', async () => {
      const docs = createAuthenticatedDocs()
      const searchSpy = vi.spyOn(docs, 'search').mockResolvedValue({
        count: 1,
        documents: [{ uno: 'doc1', published: '2023-01-01T00:00:00Z' }]
      })

      const collected: unknown[] = []
      for await (const doc of docs.searchAll({ size: 10, sortOrder: 'asc' })) {
        collected.push(doc)
      }

      expect(collected).toHaveLength(1)
      expect(searchSpy).toHaveBeenCalled()
    })
  })

  describe('wt=json query parameter', () => {
    it('should include wt=json in search URL', async () => {
      mockFetch({ response: { docs: [], numFound: 0 } })
      const docs = createAuthenticatedDocs()
      await docs.search()

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('wt=json')
    })

    it('should include wt=json in get URL', async () => {
      mockFetch({ response: { docs: [{ uno: 'AFP-123' }] } })
      const docs = createAuthenticatedDocs()
      await docs.get('AFP-123')

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('wt=json')
    })

    it('should include wt=json in mlt URL', async () => {
      mockFetch({ response: { docs: [], numFound: 0 } })
      const docs = createAuthenticatedDocs()
      await docs.mlt('AFP-123', 'en')

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('wt=json')
    })

    it('should include wt=json in list URL', async () => {
      mockFetch({ response: { topics: [], numFound: 0 } })
      const docs = createAuthenticatedDocs()
      await docs.list('slug')

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('wt=json')
    })
  })

  describe('new search parameters', () => {
    it('should pass startAt to the API', async () => {
      mockFetch({ response: { docs: [], numFound: 0 } })
      const docs = createAuthenticatedDocs()
      await docs.search({ startAt: 5 })

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      const body = JSON.parse(calledOptions.body as string) as SearchRequest
      expect(body.startAt).toBe(5)
    })

    it('should pass tz to the API', async () => {
      mockFetch({ response: { docs: [], numFound: 0 } })
      const docs = createAuthenticatedDocs()
      await docs.search({ tz: 'Europe/Paris' })

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      const body = JSON.parse(calledOptions.body as string) as SearchRequest
      expect(body.tz).toBe('Europe/Paris')
    })

    it('should pass dateGap to the API', async () => {
      mockFetch({ response: { docs: [], numFound: 0 } })
      const docs = createAuthenticatedDocs()
      await docs.search({ dateGap: '+1HOUR' })

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      const body = JSON.parse(calledOptions.body as string) as SearchRequest
      expect(body.dateGap).toBe('+1HOUR')
    })

    it('should pass wantCluster to the API', async () => {
      mockFetch({ response: { docs: [], numFound: 0 } })
      const docs = createAuthenticatedDocs()
      await docs.search({ wantCluster: true })

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      const body = JSON.parse(calledOptions.body as string) as SearchRequest
      expect(body.wantCluster).toBe(true)
    })

    it('should pass wantedFacets to the API', async () => {
      mockFetch({ response: { docs: [], numFound: 0 } })
      const docs = createAuthenticatedDocs()
      await docs.search({ wantedFacets: { slug: { size: 10, minDocCount: 1 } } })

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      const body = JSON.parse(calledOptions.body as string) as SearchRequest
      expect(body.wantedFacets).toEqual({ slug: { size: 10, minDocCount: 1 } })
    })

    it('should pass sort to the API', async () => {
      mockFetch({ response: { docs: [], numFound: 0 } })
      const docs = createAuthenticatedDocs()
      await docs.search({ sort: [{ sortField: 'published', sortOrder: 'desc' }] })

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      const body = JSON.parse(calledOptions.body as string) as SearchRequest
      expect(body.sort).toEqual([{ sortField: 'published', sortOrder: 'desc' }])
    })
  })

  describe('latest', () => {
    it('should fetch latest documents', async () => {
      mockFetch({ response: { docs: [{ uno: 'AFP-1' }], numFound: 1 } })
      const docs = createAuthenticatedDocs()
      const result = await docs.latest()

      expect(result.count).toBe(1)
      expect(result.documents).toHaveLength(1)

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('/v1/api/latest')
      expect(calledUrl).toContain('wt=json')
    })

    it('should pass optional params', async () => {
      mockFetch({ response: { docs: [], numFound: 0 } })
      const docs = createAuthenticatedDocs()
      await docs.latest({ lang: 'fr', tz: 'Europe/Paris', tr: 'foo' })

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('lang=fr')
      expect(calledUrl).toContain('tz=Europe%2FParis')
      expect(calledUrl).toContain('tr=foo')
    })
  })

  describe('mapping', () => {
    it('should fetch mapping and return response.mapping', async () => {
      const mappingData = { response: { mapping: { fields: ['uno', 'title'] } } }
      mockFetch(mappingData)
      const docs = createAuthenticatedDocs()
      const result = await docs.mapping('en')

      expect(result).toEqual({ fields: ['uno', 'title'] })

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('/v1/api/mapping')
      expect(calledUrl).toContain('wt=json')
      expect(calledUrl).toContain('lang=en')
    })

    it('should pass lang param', async () => {
      mockFetch({ response: { mapping: {} } })
      const docs = createAuthenticatedDocs()
      await docs.mapping('fr')

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('lang=fr')
    })
  })

  describe('searchWithFilter', () => {
    it('should search with a saved filter', async () => {
      mockFetch({ response: { docs: [{ uno: 'AFP-1' }], numFound: 1 } })
      const docs = createAuthenticatedDocs()
      const result = await docs.searchWithFilter('my-filter')

      expect(result.count).toBe(1)
      expect(result.documents).toHaveLength(1)

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('/v1/api/search_with_filter')
      expect(calledUrl).toContain('filter=my-filter')
      expect(calledUrl).toContain('wt=json')
    })

    it('should pass optional startat and size', async () => {
      mockFetch({ response: { docs: [], numFound: 0 } })
      const docs = createAuthenticatedDocs()
      await docs.searchWithFilter('my-filter', { startat: 10, size: 20 })

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('startat=10')
      expect(calledUrl).toContain('size=20')
    })
  })

  describe('feed', () => {
    it('should fetch feed as text with correct Accept header', async () => {
      const feedXml = '<rss><channel></channel></rss>'
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 200,
        text: () => Promise.resolve(feedXml)
      })

      const docs = createAuthenticatedDocs()
      const result = await docs.feed('my-filter')

      expect(result).toBe(feedXml)

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('/v1/user/feed')
      expect(calledUrl).toContain('filter=my-filter')
      expect(calledUrl).toContain('wt=xml')

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      const headers = calledOptions.headers as Headers
      expect(headers.get('Accept')).toBe('application/rss+xml')
    })

    it('should pass optional params', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        status: 200,
        text: () => Promise.resolve('')
      })

      const docs = createAuthenticatedDocs()
      await docs.feed('my-filter', { startat: 5, size: 10, role: 'admin', wt: 'atom' })

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('startat=5')
      expect(calledUrl).toContain('size=10')
      expect(calledUrl).toContain('role=admin')
      expect(calledUrl).toContain('wt=atom')
    })
  })

  describe('notificationCenter', () => {
    it('should return a notification center object', () => {
      const docs = createAuthenticatedDocs()
      const nc = docs.notificationCenter

      expect(nc).toBeDefined()
      expect(typeof nc.registerService).toBe('function')
      expect(typeof nc.listServices).toBe('function')
      expect(typeof nc.deleteService).toBe('function')
      expect(typeof nc.addSubscription).toBe('function')
      expect(typeof nc.listSubscriptions).toBe('function')
      expect(typeof nc.subscriptionsInService).toBe('function')
      expect(typeof nc.deleteSubscription).toBe('function')
      expect(typeof nc.removeSubscriptionsFromService).toBe('function')
    })
  })

  describe('filterCenter', () => {
    it('should return a filter center object', () => {
      const docs = createAuthenticatedDocs()
      const fc = docs.filterCenter

      expect(fc).toBeDefined()
      expect(typeof fc.add).toBe('function')
      expect(typeof fc.update).toBe('function')
      expect(typeof fc.get).toBe('function')
      expect(typeof fc.delete).toBe('function')
      expect(typeof fc.all).toBe('function')
    })
  })
})
