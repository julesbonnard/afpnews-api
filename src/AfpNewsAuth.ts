import btoa from 'btoa'
import { resolve } from 'url'
import { Client, Headers, Token } from './@types'
import { get, post } from './utils/request'

export default class AfpNewsAuth {
  public baseUrl: string
  public apiKey: string | undefined
  public token: Token | undefined

  constructor (
    {
      apiKey,
      clientId,
      clientSecret,
      baseUrl
    }: Client = {}
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
    if (!this.token) {
      return false
    }
    return this.token.tokenExpires > +new Date()
  }

  public async authenticate (
    { username, password }:
    { username?: string, password?: string } = {}
  ) {
    if (this.apiKey) {
      if (username && password) {
        return this.requestAuthenticatedToken({ username, password })
      } else if (this.token === undefined) {
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
    delete this.token
  }

  public saveToken (token: Token) { //eslint-disable-line no-unused-vars
    // tslint:disable-line no-empty
  }

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

  private async requestAuthenticatedToken (
    { username, password }:
    { username: string, password: string }
  ) {
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
      if (this.token === undefined) {
        throw new Error('Token is invalid')
      }
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
