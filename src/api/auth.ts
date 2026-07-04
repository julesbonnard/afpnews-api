import btoa from 'btoa-lite'
import { defaultBaseUrl } from '../config'
import type { AuthorizationHeaders, AuthType, AuthClientCredentials, AuthToken, AuthUserCredentials } from '../types'
import { ApiError, get, postForm } from '../utils/request'
import { EventEmitter } from 'events'
import { z } from 'zod'

const tokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number()
})

const userSchema = z.object({
  user: z.object({
    additionalProperties: z.object({
      infosLdap: z.object({
        uid: z.string().describe('Unique id uppercase'),
        mail: z.string().describe('Email'),
        cn: z.string().describe('Full name'),
        givenName: z.string().describe('Given name'),
        sn: z.string().describe('Last name'),
        title: z.string().describe('Job title'),
        afpRegroupCateg: z.string().describe('Job category'),
        preferredLanguage: z.string().describe('Preferred language in two letters'),
        ctr: z.string().describe('Service abbreviation'),
        description: z.string().describe('Service name'),
      })
    }),
    username: z.string(),
    enabled: z.boolean().optional(),
    clientId: z.string().array(),
  })
})

export class Auth extends EventEmitter {
  public token?: AuthToken
  protected baseUrl
  private apiKey

  constructor (
    {
      baseUrl,
      apiKey,
      clientId,
      clientSecret
    }: AuthClientCredentials = {}
  ) {
    super()
    if (apiKey) {
      this.apiKey = apiKey
    } else if (clientId) {
      this.apiKey = btoa(`${clientId}:${clientSecret}`)
    }

    this.baseUrl = baseUrl || defaultBaseUrl
  }

  get authUrl () {
    return `${this.baseUrl}/oauth/token`
  }

  get isTokenValid () {
    return this.token ? this.token.tokenExpires > +new Date() : false
  }

  get authorizationBearerHeaders (): AuthorizationHeaders {
    return {
      Authorization: this.token && `Bearer ${this.token.accessToken}`
    }
  }

  /**
   * Authenticate with the API
   * @param credentials - An optionnal object containing the username and password
   * @returns The bearer token to authenticate following requests
   */
  public async authenticate (credentials?: AuthUserCredentials) {
    if (credentials) {
      if (!this.apiKey) throw new Error('Missing API Key to make authenticated requests')
      return this.requestAuthenticatedToken(credentials)
    }
    if (this.token) {
      if (this.isTokenValid) return this.token
      if (this.token.authType === 'anonymous') return this.requestAnonymousToken()
      if (!this.apiKey) throw new Error('Invalid token')
      return this.requestRefreshToken()
    }
    return this.requestAnonymousToken()
  }

  /**
   * Get information about the user
   * @returns The user information
   */
  public async getUserInfo () {
    return userSchema.parse(await this.withAuth(() => get(`${this.baseUrl}/v1/user/me`, {
      headers: this.authorizationBearerHeaders
    })))
  }

  /**
   * Reset bearer token
   * @emits tokenChanged
   * @returns void
   */
  public resetToken () {
    delete this.token
    this.emit('tokenChanged')
  }

  /**
   * Execute a callback with authentication, retrying once on 401
   * by refreshing the token before the second attempt.
   */
  protected async withAuth<T> (fn: () => Promise<T>): Promise<T> {
    await this.authenticate()
    try {
      return await fn()
    } catch (error) {
      if (error instanceof ApiError && error.code === 401 && this.token) {
        this.token.tokenExpires = 0
        await this.authenticate()
        return await fn()
      }
      throw error
    }
  }

  private async requestAnonymousToken () {
    const token = tokenSchema.parse(await get(this.authUrl, {
      params: {
        grant_type: 'anonymous'
      }
    }))

    return this.parseToken(token, 'anonymous')
  }

  get authorizationBasicHeaders (): AuthorizationHeaders {
    return {
      Authorization: `Basic ${this.apiKey}`
    }
  }

  private async requestAuthenticatedToken (
    { username, password }:
    AuthUserCredentials
  ) {
    const token = tokenSchema.parse(await postForm(
      this.authUrl,
      {
        grant_type: 'password',
        password,
        username
      }, {
        headers: this.authorizationBasicHeaders
      }
    ))

    return this.parseToken(token, 'credentials')
  }

  private async requestRefreshToken () {
    const { refreshToken, authType } = this.token as AuthToken
    const newToken = tokenSchema.parse(await postForm(
      this.authUrl,
      {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }, {
        headers: this.authorizationBasicHeaders
      }
    ))

    return this.parseToken(newToken, authType)
  }

  private parseToken (
    {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in
    }: z.infer<typeof tokenSchema>,
    authType: AuthType
  ) {
    this.token = {
      accessToken,
      authType,
      refreshToken,
      tokenExpires: +new Date() + expires_in * 1000
    }
    this.emit('tokenChanged', this.token)

    return this.token
  }
}
