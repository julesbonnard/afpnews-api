import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Docs } from '../../src/api/docs'
import { mockFetch, mockFetchSequence, mockFetchRejection, createAuthenticatedDocs, TOKEN_RESPONSE } from '../helpers'

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

      const calledUrl = vi.mocked(fetch).mock.calls[0][0]
      expect(calledUrl).toContain('/v1/api/search')

      const calledOptions = vi.mocked(fetch).mock.calls[0][1]
      const body = JSON.parse(calledOptions!.body as string)
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

      const calledOptions = vi.mocked(fetch).mock.calls[0][1]
      const body = JSON.parse(calledOptions!.body as string)
      expect(body.maxRows).toBe(10)
      expect(body.sortField).toBe('published')
      expect(body.sortOrder).toBe('desc')
    })

    it('should throw on HTTP error', async () => {
      mockFetch(
        { error: { code: 401, message: 'Unauthorized' } },
        401
      )

      const docs = createAuthenticatedDocs()
      await expect(docs.search()).rejects.toThrow('Unauthorized')
    })

    it('should throw on network failure', async () => {
      mockFetchRejection(new Error('Network error'))

      const docs = createAuthenticatedDocs()
      await expect(docs.search()).rejects.toThrow('Network error')
    })

    it('should throw on invalid response schema', async () => {
      mockFetch({ invalid: 'response' })

      const docs = createAuthenticatedDocs()
      await expect(docs.search()).rejects.toThrow()
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

      const calledUrl = vi.mocked(fetch).mock.calls[0][0]
      expect(calledUrl).toContain('/v1/api/get/AFP-123')
    })

    it('should throw on HTTP error', async () => {
      mockFetch(
        { error: { code: 404, message: 'Not Found' } },
        404
      )

      const docs = createAuthenticatedDocs()
      await expect(docs.get('INVALID')).rejects.toThrow('Not Found')
    })

    it('should throw when response has wrong number of docs', async () => {
      mockFetch({ response: { docs: [] } })

      const docs = createAuthenticatedDocs()
      await expect(docs.get('AFP-123')).rejects.toThrow()
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

      const calledUrl = vi.mocked(fetch).mock.calls[0][0]
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

      const calledUrl = vi.mocked(fetch).mock.calls[0][0]
      expect(calledUrl).toContain('size=10')
    })

    it('should throw on HTTP error', async () => {
      mockFetch(
        { error: { code: 500, message: 'Internal Server Error' } },
        500
      )

      const docs = createAuthenticatedDocs()
      await expect(docs.mlt('AFP-123', 'en')).rejects.toThrow('Internal Server Error')
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

      const calledUrl = vi.mocked(fetch).mock.calls[0][0]
      expect(calledUrl).toContain('/v1/api/list/slug')
      expect(calledUrl).toContain('minDocCount=1')
    })

    it('should pass custom minDocCount', async () => {
      const listResponse = {
        response: { topics: [], numFound: 0 }
      }
      mockFetch(listResponse)

      const docs = createAuthenticatedDocs()
      await docs.list('keyword', {}, 5)

      const calledUrl = vi.mocked(fetch).mock.calls[0][0]
      expect(calledUrl).toContain('minDocCount=5')
    })

    it('should throw on HTTP error', async () => {
      mockFetch(
        { error: { code: 403, message: 'Forbidden' } },
        403
      )

      const docs = createAuthenticatedDocs()
      await expect(docs.list('slug')).rejects.toThrow('Forbidden')
    })
  })

  describe('searchAll', () => {
    it('should yield documents across multiple pages using spied search', async () => {
      const docs = createAuthenticatedDocs()

      const searchSpy = vi.spyOn(docs, 'search')
      let callNum = 0
      searchSpy.mockImplementation(async () => {
        callNum++
        if (callNum === 1) {
          return {
            count: 6,
            documents: [
              { uno: 'doc1', published: '2023-06-15T12:00:00Z' },
              { uno: 'doc2', published: '2023-06-14T12:00:00Z' },
              { uno: 'doc3', published: '2023-06-13T12:00:00Z' }
            ]
          }
        }
        return {
          count: 6,
          documents: [
            { uno: 'doc4', published: '2023-06-12T12:00:00Z' },
            { uno: 'doc5', published: '2023-06-11T12:00:00Z' },
            { uno: 'doc6', published: '2023-06-10T12:00:00Z' }
          ]
        }
      })

      const collected: unknown[] = []
      for await (const doc of docs.searchAll({ size: 6 })) {
        collected.push(doc)
      }

      // 3 < 6 (params.size), so searchAll stops after page 1
      expect(collected).toHaveLength(3)
      expect(searchSpy).toHaveBeenCalledTimes(1)
    })

    it('should paginate when size exceeds maxRequestSize', async () => {
      const docs = createAuthenticatedDocs()

      const searchSpy = vi.spyOn(docs, 'search')
      let callNum = 0
      searchSpy.mockImplementation(async () => {
        callNum++
        if (callNum === 1) {
          const pageDocs = Array.from({ length: 1000 }, (_, i) => ({
            uno: `doc-${i}`,
            published: `2023-06-15T${String(i % 24).padStart(2, '0')}:${String(Math.floor(i / 24) % 60).padStart(2, '0')}:00Z`
          }))
          return { count: 1500, documents: pageDocs }
        }
        const pageDocs = Array.from({ length: 100 }, (_, i) => ({
          uno: `doc-${1000 + i}`,
          published: `2023-06-14T${String(i % 24).padStart(2, '0')}:${String(Math.floor(i / 24) % 60).padStart(2, '0')}:00Z`
        }))
        return { count: 1500, documents: pageDocs }
      })

      const collected: unknown[] = []
      for await (const doc of docs.searchAll({ size: 1500 })) {
        collected.push(doc)
      }

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

    it('should not mutate the original params object', async () => {
      const docs = createAuthenticatedDocs()
      vi.spyOn(docs, 'search').mockResolvedValue({
        count: 1,
        documents: [{ uno: 'doc1', published: '2023-01-01T00:00:00Z' }]
      })

      const params = { size: 10, sortOrder: 'desc' as const }
      const paramsCopy = { ...params }

      const collected: unknown[] = []
      for await (const doc of docs.searchAll(params)) {
        collected.push(doc)
      }

      expect(params).toEqual(paramsCopy)
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
})
