import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { get, post, postForm, del } from '../../src/utils/request'
import { mockFetchResponse } from '../helpers/mockFetch'

describe('request utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('get', () => {
    it('should make a GET request and return JSON by default', async () => {
      const data = { response: { docs: [] } }
      globalThis.fetch = mockFetchResponse(data)

      const result = await get('https://api.example.com/test', {})
      expect(result).toEqual(data)
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('should append query params to URL', async () => {
      const data = { ok: true }
      globalThis.fetch = mockFetchResponse(data)

      await get('https://api.example.com/test', {
        params: { grant_type: 'anonymous', foo: 'bar' }
      })

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('grant_type=anonymous')
      expect(calledUrl).toContain('foo=bar')
    })

    it('should pass authorization headers', async () => {
      globalThis.fetch = mockFetchResponse({ ok: true })

      await get('https://api.example.com/test', {
        headers: { Authorization: 'Bearer token123' }
      })

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      const headers = calledOptions.headers as Headers
      expect(headers.get('Authorization')).toBe('Bearer token123')
      expect(headers.get('Accept')).toBe('application/json')
    })

    it('should return text when type is text', async () => {
      globalThis.fetch = mockFetchResponse('<html>content</html>')

      const result = await get('https://api.example.com/test', {}, 'text')
      expect(result).toBe('<html>content</html>')
    })

    it('should throw ApiError on HTTP error with error body', async () => {
      globalThis.fetch = mockFetchResponse({
        error: { code: 401, message: 'Invalid token; please re-authenticate' }
      }, 401, 'Unauthorized')

      await expect(get('https://api.example.com/test', {})).rejects.toThrow('Invalid token')
    })

    it('should throw ApiError with status text when error body is not parseable', async () => {
      globalThis.fetch = mockFetchResponse({ unexpected: 'format' }, 500, 'Internal Server Error')

      await expect(get('https://api.example.com/test', {})).rejects.toThrow()
    })
  })

  describe('post', () => {
    it('should make a POST request with JSON body', async () => {
      const responseData = { response: { docs: [], numFound: 0 } }
      globalThis.fetch = mockFetchResponse(responseData)

      const body = { maxRows: 10, sortField: 'published' }
      const result = await post('https://api.example.com/search', body, {
        headers: { Authorization: 'Bearer token123' }
      })

      expect(result).toEqual(responseData)

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      expect(calledOptions.method).toBe('POST')
      expect(calledOptions.body).toBe(JSON.stringify(body))

      const headers = calledOptions.headers as Headers
      expect(headers.get('Content-Type')).toBe('application/json')
    })

    it('should append query params to URL for post', async () => {
      globalThis.fetch = mockFetchResponse({ ok: true })

      await post('https://api.example.com/list/slug', {}, {
        headers: { Authorization: 'Bearer token' },
        params: { minDocCount: 1 }
      })

      const calledUrl = (fetch as Mock<typeof fetch>).mock.calls[0][0]
      expect(calledUrl).toContain('minDocCount=1')
    })
  })

  describe('postForm', () => {
    it('should make a POST request with FormData', async () => {
      const responseData = { access_token: 'abc', refresh_token: 'def', expires_in: 3600 }
      globalThis.fetch = mockFetchResponse(responseData)

      const result = await postForm(
        'https://api.example.com/oauth/token',
        { grant_type: 'password', username: 'user', password: 'pass' },
        { headers: { Authorization: 'Basic abc123' } }
      )

      expect(result).toEqual(responseData)

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      expect(calledOptions.method).toBe('POST')
      expect(calledOptions.body).toBeInstanceOf(FormData)
    })
  })

  describe('del', () => {
    it('should make a DELETE request', async () => {
      globalThis.fetch = mockFetchResponse({ ok: true })

      await del('https://api.example.com/service/delete', {
        headers: { Authorization: 'Bearer token' },
        params: { service: 'myService' }
      })

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      expect(calledOptions.method).toBe('DELETE')
    })

    it('should include JSON body when provided', async () => {
      globalThis.fetch = mockFetchResponse({ ok: true })

      await del('https://api.example.com/service/remove', {
        headers: { Authorization: 'Bearer token' }
      }, ['sub1', 'sub2'])

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      expect(calledOptions.body).toBe(JSON.stringify(['sub1', 'sub2']))
    })

    it('should not include body when not provided', async () => {
      globalThis.fetch = mockFetchResponse({ ok: true })

      await del('https://api.example.com/service/delete', {
        headers: { Authorization: 'Bearer token' }
      })

      const calledOptions = (fetch as Mock<typeof fetch>).mock.calls[0][1]!
      expect(calledOptions.body).toBeUndefined()
    })
  })
})
