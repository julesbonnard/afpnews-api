import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Auth } from '../../src/api/auth'

const TOKEN_RESPONSE = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600
}

function mockFetch(body: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    status,
    statusText: 'OK',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body))
  })
}

describe('Auth', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should use default base URL when none provided', () => {
      const auth = new Auth()
      expect(auth.authUrl).toBe('https://afp-apicore-prod.afp.com/oauth/token')
    })

    it('should use custom base URL', () => {
      const auth = new Auth({ baseUrl: 'https://custom.api.com' })
      expect(auth.authUrl).toBe('https://custom.api.com/oauth/token')
    })

    it('should accept apiKey', () => {
      const auth = new Auth({ apiKey: 'my-api-key' })
      expect(auth.authUrl).toContain('/oauth/token')
    })

    it('should accept clientId and clientSecret', () => {
      const auth = new Auth({ clientId: 'myClient', clientSecret: 'mySecret' })
      expect(auth.authUrl).toContain('/oauth/token')
    })
  })

  describe('isTokenValid', () => {
    it('should return false when no token exists', () => {
      const auth = new Auth()
      expect(auth.isTokenValid).toBe(false)
    })

    it('should return true when token is not expired', () => {
      const auth = new Auth()
      auth.token = {
        accessToken: 'test',
        refreshToken: 'test',
        tokenExpires: Date.now() + 60000,
        authType: 'anonymous'
      }
      expect(auth.isTokenValid).toBe(true)
    })

    it('should return false when token is expired', () => {
      const auth = new Auth()
      auth.token = {
        accessToken: 'test',
        refreshToken: 'test',
        tokenExpires: Date.now() - 1000,
        authType: 'anonymous'
      }
      expect(auth.isTokenValid).toBe(false)
    })
  })

  describe('authorizationBearerHeaders', () => {
    it('should return Authorization header with token', () => {
      const auth = new Auth()
      auth.token = {
        accessToken: 'my-token',
        refreshToken: 'refresh',
        tokenExpires: Date.now() + 60000,
        authType: 'anonymous'
      }
      expect(auth.authorizationBearerHeaders).toEqual({
        Authorization: 'Bearer my-token'
      })
    })

    it('should return undefined Authorization when no token', () => {
      const auth = new Auth()
      expect(auth.authorizationBearerHeaders).toEqual({
        Authorization: undefined
      })
    })
  })

  describe('authenticate', () => {
    it('should request anonymous token when no credentials and no token', async () => {
      mockFetch(TOKEN_RESPONSE)
      const auth = new Auth()
      const token = await auth.authenticate()

      expect(token.accessToken).toBe('test-access-token')
      expect(token.refreshToken).toBe('test-refresh-token')
      expect(token.authType).toBe('anonymous')
      expect(token.tokenExpires).toBeGreaterThan(Date.now())
    })

    it('should return existing valid token without refetching', async () => {
      mockFetch(TOKEN_RESPONSE)
      const auth = new Auth()

      const token1 = await auth.authenticate()
      const fetchCallCount = (fetch as ReturnType<typeof vi.fn>).mock.calls.length

      const token2 = await auth.authenticate()
      expect(token2).toBe(token1)
      expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(fetchCallCount)
    })

    it('should refresh anonymous token when expired', async () => {
      const auth = new Auth()
      auth.token = {
        accessToken: 'old',
        refreshToken: 'old-refresh',
        tokenExpires: Date.now() - 1000,
        authType: 'anonymous'
      }

      mockFetch(TOKEN_RESPONSE)
      const token = await auth.authenticate()

      expect(token.accessToken).toBe('test-access-token')
      expect(token.authType).toBe('anonymous')
    })

    it('should refresh credentials token when expired', async () => {
      const auth = new Auth({ apiKey: 'my-key' })
      auth.token = {
        accessToken: 'old',
        refreshToken: 'old-refresh',
        tokenExpires: Date.now() - 1000,
        authType: 'credentials'
      }

      mockFetch(TOKEN_RESPONSE)
      const token = await auth.authenticate()

      expect(token.accessToken).toBe('test-access-token')
      expect(token.authType).toBe('credentials')
    })

    it('should request authenticated token with credentials', async () => {
      mockFetch(TOKEN_RESPONSE)
      const auth = new Auth({ apiKey: 'my-key' })
      const token = await auth.authenticate({ username: 'user', password: 'pass' })

      expect(token.accessToken).toBe('test-access-token')
      expect(token.authType).toBe('credentials')

      const calledOptions = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]
      expect(calledOptions.method).toBe('POST')
    })

    it('should throw when credentials provided but no apiKey', async () => {
      const auth = new Auth()
      await expect(
        auth.authenticate({ username: 'user', password: 'pass' })
      ).rejects.toThrow('Missing API Key')
    })

    it('should throw when expired credentials token and no apiKey', async () => {
      const auth = new Auth()
      auth.token = {
        accessToken: 'old',
        refreshToken: 'old-refresh',
        tokenExpires: Date.now() - 1000,
        authType: 'credentials'
      }

      await expect(auth.authenticate()).rejects.toThrow('Invalid token')
    })
  })

  describe('resetToken', () => {
    it('should clear the token', () => {
      const auth = new Auth()
      auth.token = {
        accessToken: 'test',
        refreshToken: 'test',
        tokenExpires: Date.now() + 60000,
        authType: 'anonymous'
      }

      auth.resetToken()
      expect(auth.token).toBeUndefined()
    })

    it('should emit tokenChanged event', () => {
      const auth = new Auth()
      auth.token = {
        accessToken: 'test',
        refreshToken: 'test',
        tokenExpires: Date.now() + 60000,
        authType: 'anonymous'
      }

      const listener = vi.fn()
      auth.on('tokenChanged', listener)
      auth.resetToken()
      expect(listener).toHaveBeenCalledOnce()
    })
  })

  describe('tokenChanged event', () => {
    it('should emit tokenChanged with new token on authenticate', async () => {
      mockFetch(TOKEN_RESPONSE)
      const auth = new Auth()

      const listener = vi.fn()
      auth.on('tokenChanged', listener)

      await auth.authenticate()
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token'
        })
      )
    })
  })

  describe('getUserInfo', () => {
    it('should fetch user info with bearer headers', async () => {
      const userResponse = {
        user: {
          username: 'testuser',
          email: 'test@example.com',
          enable: true,
          clientId: ['client1'],
          authorities: ['ROLE_USER']
        }
      }
      mockFetch(userResponse)

      const auth = new Auth()
      auth.token = {
        accessToken: 'my-token',
        refreshToken: 'refresh',
        tokenExpires: Date.now() + 60000,
        authType: 'credentials'
      }

      const result = await auth.getUserInfo()
      expect(result.user.username).toBe('testuser')

      const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(calledUrl).toContain('/v1/user/me')
    })
  })
})
