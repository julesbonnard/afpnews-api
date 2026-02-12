import { describe, it, expect, vi, beforeEach } from 'vitest'
import { get, post, postForm, del } from '../../src/utils/request'
import { mockFetch, mockFetchRejection } from '../helpers'

describe('request utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('get', () => {
    it('should make a GET request and return JSON by default', async () => {
      const data = { response: { docs: [] } }
      mockFetch(data)

      const result = await get('https://api.example.com/test', {})
      expect(result).toEqual(data)
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('should append query params to URL', async () => {
      const data = { ok: true }
      mockFetch(data)

      await get('https://api.example.com/test', {
        params: { grant_type: 'anonymous', foo: 'bar' }
      })

      const calledUrl = vi.mocked(fetch).mock.calls[0][0]
      expect(calledUrl).toContain('grant_type=anonymous')
      expect(calledUrl).toContain('foo=bar')
    })

    it('should pass authorization headers', async () => {
      mockFetch({ ok: true })

      await get('https://api.example.com/test', {
        headers: { Authorization: 'Bearer token123' }
      })

      const calledOptions = vi.mocked(fetch).mock.calls[0][1]
      const headers = calledOptions!.headers as Headers
      expect(headers.get('Authorization')).toBe('Bearer token123')
      expect(headers.get('Accept')).toBe('application/json')
    })

    it('should return text when type is text', async () => {
      mockFetch('<html>content</html>')

      const result = await get('https://api.example.com/test', {}, 'text')
      expect(result).toBe('<html>content</html>')
    })

    it('should throw ApiError on HTTP error with error body', async () => {
      mockFetch(
        { error: { code: 401, message: 'Invalid token; please re-authenticate' } },
        401
      )

      await expect(get('https://api.example.com/test', {})).rejects.toThrow('Invalid token')
    })

    it('should throw ApiError with status text when error body is not parseable', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ unexpected: 'format' }),
        text: () => Promise.resolve('error')
      } as Response)

      await expect(get('https://api.example.com/test', {})).rejects.toThrow()
    })

    it('should throw on network failure', async () => {
      mockFetchRejection(new Error('Network error'))

      await expect(get('https://api.example.com/test', {})).rejects.toThrow('Network error')
    })

    it('should throw ApiError on text mode HTTP error with error body', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ error: { code: 403, message: 'Access denied' } }),
        text: () => Promise.resolve('Forbidden')
      } as Response)

      await expect(get('https://api.example.com/test', {}, 'text')).rejects.toThrow('Access denied')
    })

    it('should throw ApiError on text mode HTTP error with non-parseable body', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ unexpected: 'format' }),
        text: () => Promise.resolve('error')
      } as Response)

      await expect(get('https://api.example.com/test', {}, 'text')).rejects.toThrow()
    })
  })

  describe('post', () => {
    it('should make a POST request with JSON body', async () => {
      const responseData = { response: { docs: [], numFound: 0 } }
      mockFetch(responseData)

      const body = { maxRows: 10, sortField: 'published' }
      const result = await post('https://api.example.com/search', body, {
        headers: { Authorization: 'Bearer token123' }
      })

      expect(result).toEqual(responseData)

      const calledOptions = vi.mocked(fetch).mock.calls[0][1]
      expect(calledOptions!.method).toBe('POST')
      expect(calledOptions!.body).toBe(JSON.stringify(body))

      const headers = calledOptions!.headers as Headers
      expect(headers.get('Content-Type')).toBe('application/json')
    })

    it('should append query params to URL for post', async () => {
      mockFetch({ ok: true })

      await post('https://api.example.com/list/slug', {}, {
        headers: { Authorization: 'Bearer token' },
        params: { minDocCount: 1 }
      })

      const calledUrl = vi.mocked(fetch).mock.calls[0][0]
      expect(calledUrl).toContain('minDocCount=1')
    })

    it('should throw ApiError on HTTP error', async () => {
      mockFetch(
        { error: { code: 500, message: 'Internal Server Error' } },
        500
      )

      await expect(
        post('https://api.example.com/search', {}, {
          headers: { Authorization: 'Bearer token' }
        })
      ).rejects.toThrow('Internal Server Error')
    })

    it('should throw on network failure', async () => {
      mockFetchRejection(new Error('Network error'))

      await expect(
        post('https://api.example.com/search', {}, {
          headers: { Authorization: 'Bearer token' }
        })
      ).rejects.toThrow('Network error')
    })
  })

  describe('postForm', () => {
    it('should make a POST request with FormData', async () => {
      const responseData = { access_token: 'abc', refresh_token: 'def', expires_in: 3600 }
      mockFetch(responseData)

      const result = await postForm(
        'https://api.example.com/oauth/token',
        { grant_type: 'password', username: 'user', password: 'pass' },
        { headers: { Authorization: 'Basic abc123' } }
      )

      expect(result).toEqual(responseData)

      const calledOptions = vi.mocked(fetch).mock.calls[0][1]
      expect(calledOptions!.method).toBe('POST')
      expect(calledOptions!.body).toBeInstanceOf(FormData)
    })

    it('should include form data with correct values', async () => {
      mockFetch({ ok: true })

      await postForm(
        'https://api.example.com/oauth/token',
        { grant_type: 'password', username: 'user', password: 'pass' },
        { headers: { Authorization: 'Basic abc123' } }
      )

      const calledOptions = vi.mocked(fetch).mock.calls[0][1]
      const formData = calledOptions!.body as FormData
      expect(formData.get('grant_type')).toBe('password')
      expect(formData.get('username')).toBe('user')
      expect(formData.get('password')).toBe('pass')
    })

    it('should throw ApiError on HTTP error', async () => {
      mockFetch(
        { error: { code: 401, message: 'Bad credentials' } },
        401
      )

      await expect(
        postForm(
          'https://api.example.com/oauth/token',
          { grant_type: 'password', username: 'user', password: 'wrong' },
          { headers: { Authorization: 'Basic abc123' } }
        )
      ).rejects.toThrow('Bad credentials')
    })
  })

  describe('del', () => {
    it('should make a DELETE request', async () => {
      mockFetch({ ok: true })

      await del('https://api.example.com/service/delete', {
        headers: { Authorization: 'Bearer token' },
        params: { service: 'myService' }
      })

      const calledOptions = vi.mocked(fetch).mock.calls[0][1]
      expect(calledOptions!.method).toBe('DELETE')
    })

    it('should include JSON body when provided', async () => {
      mockFetch({ ok: true })

      await del('https://api.example.com/service/remove', {
        headers: { Authorization: 'Bearer token' }
      }, ['sub1', 'sub2'])

      const calledOptions = vi.mocked(fetch).mock.calls[0][1]
      expect(calledOptions!.body).toBe(JSON.stringify(['sub1', 'sub2']))
    })

    it('should not include body when not provided', async () => {
      mockFetch({ ok: true })

      await del('https://api.example.com/service/delete', {
        headers: { Authorization: 'Bearer token' }
      })

      const calledOptions = vi.mocked(fetch).mock.calls[0][1]
      expect(calledOptions!.body).toBeUndefined()
    })

    it('should throw ApiError on HTTP error', async () => {
      mockFetch(
        { error: { code: 404, message: 'Not Found' } },
        404
      )

      await expect(
        del('https://api.example.com/service/delete', {
          headers: { Authorization: 'Bearer token' }
        })
      ).rejects.toThrow('Not Found')
    })

    it('should throw on network failure', async () => {
      mockFetchRejection(new Error('Network error'))

      await expect(
        del('https://api.example.com/service/delete', {
          headers: { Authorization: 'Bearer token' }
        })
      ).rejects.toThrow('Network error')
    })
  })
})
