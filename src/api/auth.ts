/* eslint-disable @typescript-eslint/naming-convention */
import btoa from 'btoa-lite'
import { AuthorizationHeaders, AuthType, ClientCredentials, Token, UserCredentials } from '../types'
import { get, postForm } from '../utils/request'
import { EventEmitter } from 'events'
import { z } from 'zod'

const tokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number()
})

export default class Auth extends EventEmitter {
  public token?: Token
  protected baseUrl
  private apiKey

  constructor (
    {
      baseUrl,
      apiKey,
      clientId,
      clientSecret
    }: ClientCredentials
  ) {
    super()
    if (apiKey) {
      this.apiKey = apiKey
    } else if (clientId) {
      this.apiKey = btoa(`${clientId}:${clientSecret}`)
    }

    this.baseUrl = baseUrl || 'https://afp-apicore-prod.afp.com'
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

  public async authenticate (credentials?: UserCredentials) {
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

  public resetToken () {
    delete this.token
    this.emit('tokenChanged')
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
    UserCredentials
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
    const { refreshToken, authType } = this.token as Token
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
