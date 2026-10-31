import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { get, post, postForm, del, ApiError } from '../../src/utils/request'
import { mockFetchResponse, mockFetchSequence } from '../helpers/mockFetch'

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

    it('should throw ApiError on HTTP error when type is text', async () => {
      globalThis.fetch = mockFetchResponse('<html>error page</html>', 500, 'Internal Server Error')

      await expect(get('https://api.example.com/test', {}, 'text')).rejects.toThrow()
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
    it('should send credentials as a UTF-8 urlencoded body, never in the URL', async () => {
      const responseData = { access_token: 'abc', refresh_token: 'def', expires_in: 3600 }
      globalThis.fetch = mockFetchResponse(responseData)

      const result = await postForm(
        'https://api.example.com/oauth/token',
        { grant_type: 'password', username: 'user@afp.com', password: 'p&ss=1 é' },
        { headers: { Authorization: 'Basic abc123' } }
      )

      expect(result).toEqual(responseData)

      const [calledUrl, calledOptions] = (fetch as Mock<typeof fetch>).mock.calls[0]
      expect(calledUrl).toBe('https://api.example.com/oauth/token')
      // Ce que fetch envoie réellement avec ces options : Content-Type dérivé du corps, avec charset.
      const sent = new Request(calledUrl, calledOptions)
      expect(sent.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded;charset=UTF-8')
      expect(sent.headers.get('Authorization')).toBe('Basic abc123')
      expect(await sent.text()).toBe('grant_type=password&username=user%40afp.com&password=p%26ss%3D1+%C3%A9')
    })

    it('should not retry a token request on 503', async () => {
      globalThis.fetch = mockFetchResponse('<html>Service Unavailable</html>', 503, 'Service Unavailable')

      await expect(postForm('https://api.example.com/oauth/token', { grant_type: 'refresh_token' }, { headers: {} }))
        .rejects.toMatchObject({ code: 503 })
      expect(fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('errors (shapes observed in production)', () => {
    it('should expose the AFP error type of a 401 (invalid_token)', async () => {
      globalThis.fetch = mockFetchResponse({ error: { code: 401, message: 'Invalid token', type: 'invalid_token' } }, 401, 'Unauthorized')

      const error = await get('https://api.example.com/v1/api/search', {}).catch((e: unknown) => e)
      expect(error).toBeInstanceOf(ApiError)
      expect(error).toMatchObject({ code: 401, status: 401, type: 'invalid_token', message: 'Invalid token' })
    })

    it('should throw on an error payload sent with HTTP 200', async () => {
      globalThis.fetch = mockFetchResponse({ error: { code: 404, message: 'Document "x" not found', type: 'SearchServerException' } })

      await expect(get('https://api.example.com/v1/api/get/x', {})).rejects.toMatchObject({ code: 404, status: 200, type: 'SearchServerException' })
    })

    it('should read a string error body (credits API)', async () => {
      globalThis.fetch = mockFetchResponse({ error: 'not authorized' }, 403, 'Forbidden')

      await expect(get('https://api.example.com/credit/health', {})).rejects.toMatchObject({ code: 403, message: 'not authorized' })
    })

    it('should throw an ApiError, not a SyntaxError, on a non-JSON 200 body', async () => {
      globalThis.fetch = mockFetchResponse('<html>ok</html>')

      await expect(get('https://api.example.com/test', {})).rejects.toMatchObject({ name: 'ApiError', message: 'Invalid JSON response' })
    })
  })

  describe('retry on 429 / 5xx', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('should retry once after a transient 503 HTML page', async () => {
      mockFetchSequence([
        { body: '<html>Service Unavailable</html>', status: 503, statusText: 'Service Unavailable' },
        { body: { ok: true } }
      ])

      const pending = get('https://api.example.com/test', {})
      await vi.runAllTimersAsync()

      await expect(pending).resolves.toEqual({ ok: true })
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should not retry a POST by default (a 504 may hide an already-applied write)', async () => {
      mockFetchSequence([{ body: '', status: 504, statusText: 'Gateway Timeout' }, { body: { ok: true } }])

      const pending = post('https://api.example.com/v1/user/filter/add', {}, { headers: {} }).catch((e: unknown) => e)
      await vi.runAllTimersAsync()

      expect(await pending).toMatchObject({ code: 504 })
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('should retry a read POST when asked (search)', async () => {
      mockFetchSequence([{ body: '', status: 503, statusText: 'Service Unavailable' }, { body: { ok: true } }])

      const pending = post('https://api.example.com/v1/api/search', {}, { headers: {}, retry: true })
      await vi.runAllTimersAsync()

      await expect(pending).resolves.toEqual({ ok: true })
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should not retry a DELETE, nor a GET marked retry: false', async () => {
      mockFetchSequence([{ body: '', status: 503, statusText: 'Service Unavailable' }])

      const deleted = del('https://api.example.com/notification/api/service/delete', { headers: {} }).catch((e: unknown) => e)
      const viaGet = get('https://api.example.com/v1/user/filter/delete', { retry: false }).catch((e: unknown) => e)
      await vi.runAllTimersAsync()

      expect(await deleted).toMatchObject({ code: 503 })
      expect(await viaGet).toMatchObject({ code: 503 })
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should give up after a second 503', async () => {
      mockFetchSequence([{ body: '', status: 503, statusText: 'Service Unavailable' }])

      const pending = get('https://api.example.com/test', {}).catch((e: unknown) => e)
      await vi.runAllTimersAsync()

      expect(await pending).toMatchObject({ code: 503, status: 503 })
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should wait until expireAt then retry a 429 when the block is short', async () => {
      const expireAt = new Date(Date.now() + 2000).toISOString()
      mockFetchSequence([
        { body: { expireAt }, status: 429, statusText: 'Too Many Requests' },
        { body: { ok: true } }
      ])

      const pending = get('https://api.example.com/test', {})
      await vi.advanceTimersByTimeAsync(1999)
      expect(fetch).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(1)

      await expect(pending).resolves.toEqual({ ok: true })
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should not wait for a long 429 block and expose expireAt instead', async () => {
      const expireAt = new Date(Date.now() + 60_000)
      globalThis.fetch = mockFetchResponse({ expireAt: expireAt.toISOString() }, 429, 'Too Many Requests')

      const error = await get('https://api.example.com/test', {}).catch((e: unknown) => e)

      expect(error).toMatchObject({ code: 429, status: 429 })
      expect((error as ApiError).expireAt?.getTime()).toBe(expireAt.getTime())
      expect(fetch).toHaveBeenCalledTimes(1)
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
