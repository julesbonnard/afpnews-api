// @ts-ignore
import btoa from 'btoa'
import { resolve } from 'url'
import { get, post } from './utils/request'
import { Credentials, Headers, Token } from './utils/types'

export default class AfpNewsAuth {
  public baseUrl: string
  public apiKey: string

  private authType: string
  private tokenExpires: number
  private refreshToken: string
  private accessToken: string

  constructor (
    {
      apiKey,
      clientId,
      clientSecret,
      baseUrl
    }: Client | { baseUrl?: string } = {}
  ) {
    if (clientId && clientSecret) {
      this.apiKey = btoa(`${clientId}:${clientSecret}`)
    } else if (apiKey) {
      this.apiKey = apiKey
    }
    this.baseUrl = baseUrl || 'https://api.afp.com'
    this.resetToken()
  }

  get authUrl (): string {
    return resolve(this.baseUrl, '/oauth/token')
  }

  get isTokenValid (): boolean {
    return this.token && this.token.tokenExpires > +new Date()
  }

  get token (): Token {
    if ([
      this.accessToken,
      this.tokenExpires,
      this.refreshToken,
      this.authType
    ].some((d) => d === undefined)) {
      return null
    }
    return {
      accessToken: this.accessToken,
      authType: this.authType,
      refreshToken: this.refreshToken,
      tokenExpires: this.tokenExpires
    }
  }

  set token ({ accessToken, refreshToken, tokenExpires, authType }: Token) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    this.tokenExpires = tokenExpires
    this.authType = authType
  }

  public async authenticate ({ username, password }: Credentials = {}) {
    if (this.apiKey) {
      if (username && password) {
        return this.requestAuthenticatedToken({ username, password })
      } else if (this.token === null) {
        throw new Error('You need to authenticate with credentials once')
      } else if (this.isTokenValid === false) {
        return this.requestRefreshToken()
      } else {
        return Promise.resolve(this.token)
      }
    } else {
      if (username && password) {
        throw new Error('You need an api key to make authenticated requests')
      } else if (this.isTokenValid === true) {
        return Promise.resolve(this.token)
      } else {
        return this.requestAnonymousToken()
      }
    }
  }

  public resetToken () {
    delete this.accessToken
    delete this.refreshToken
    delete this.tokenExpires
    delete this.authType
  }

  public saveToken (token: Token) {} // tslint:disable-line no-empty

  private async requestAnonymousToken () {
    try {
      const token = await get(this.authUrl, {
        params: {
          grant_type: 'anonymous'
        }
      })

      return this.parseToken(token, 'anonymous')
    } catch (e) {
      return Promise.reject(e)
    }
  }

  get authorizationBasicHeaders (): Headers {
    return {
      'Authorization': `Basic ${this.apiKey}`,
      'Content-Type': 'application/json'
    }
  }

  private async requestAuthenticatedToken ({ username, password }: Credentials) {
    try {
      const token = await post(this.authUrl, {}, {
        formData: {
          grant_type: 'password',
          password,
          username
        },
        headers: this.authorizationBasicHeaders
      })

      return this.parseToken(token, 'credentials')
    } catch (e) {
      return Promise.reject(e)
    }
  }

  private async requestRefreshToken () {
    try {
      const newToken = await post(this.authUrl, {}, {
        formData: {
          grant_type: 'refresh_token',
          refresh_token: this.token.refreshToken
        },
        headers: this.authorizationBasicHeaders
      })

      return this.parseToken(newToken, this.token.authType)
    } catch (e) {
      return Promise.reject(e)
    }
  }

  private parseToken (
    {
      access_token,
      refresh_token,
      expires_in
    }: {
      access_token: string,
      refresh_token: string,
      expires_in: number
    },
    authType: string
  ) {
    this.token = {
      accessToken: access_token,
      authType,
      refreshToken: refresh_token,
      tokenExpires: +new Date() + expires_in * 1000
    }

    this.saveToken(this.token)

    return Promise.resolve(this.token)
  }
}
