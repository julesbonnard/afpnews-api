import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { Docs } from '../../src/api/docs'
import { mockFetch } from '../helpers/mockFetch'

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

describe('FilterCenter', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('add', () => {
    it('should add a filter', async () => {
      const responseData = { response: { status: 'ok' } }
      mockFetch(responseData)

      const docs = createAuthenticatedDocs()
      const result = await docs.filterCenter.add('my-filter', { query: 'Macron' })

      expect(result).toEqual(responseData)

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('/v1/user/filter/add')
      expect(calledUrl).toContain('name=my-filter')
      expect(calledUrl).toContain('wt=json')

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      expect(calledOptions.method).toBe('POST')
    })
  })

  describe('update', () => {
    it('should update a filter', async () => {
      const responseData = { response: { status: 'ok' } }
      mockFetch(responseData)

      const docs = createAuthenticatedDocs()
      const result = await docs.filterCenter.update('my-filter', { query: 'Biden' })

      expect(result).toEqual(responseData)

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('/v1/user/filter/update')
      expect(calledUrl).toContain('name=my-filter')
      expect(calledUrl).toContain('wt=json')

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      expect(calledOptions.method).toBe('POST')
    })
  })

  describe('get', () => {
    it('should get a filter by name', async () => {
      const responseData = { response: { filter: { name: 'my-filter' } } }
      mockFetch(responseData)

      const docs = createAuthenticatedDocs()
      const result = await docs.filterCenter.get('my-filter')

      expect(result).toEqual(responseData)

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('/v1/user/filter/get')
      expect(calledUrl).toContain('name=my-filter')
      expect(calledUrl).toContain('wt=json')

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      expect(calledOptions.method).toBe('GET')
    })
  })

  describe('delete', () => {
    it('should delete a filter by name', async () => {
      const responseData = { response: { status: 'ok' } }
      mockFetch(responseData)

      const docs = createAuthenticatedDocs()
      const result = await docs.filterCenter.delete('my-filter')

      expect(result).toEqual(responseData)

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('/v1/user/filter/delete')
      expect(calledUrl).toContain('name=my-filter')
      expect(calledUrl).toContain('wt=json')

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      expect(calledOptions.method).toBe('GET')
    })
  })

  describe('all', () => {
    it('should list all filters', async () => {
      const responseData = { response: { filters: [{ name: 'filter-1' }, { name: 'filter-2' }] } }
      mockFetch(responseData)

      const docs = createAuthenticatedDocs()
      const result = await docs.filterCenter.all()

      expect(result).toEqual(responseData)

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('/v1/user/filter/all')
      expect(calledUrl).toContain('wt=json')

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      expect(calledOptions.method).toBe('GET')
    })
  })
})
