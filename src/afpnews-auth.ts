import base64 from './utils/base64'
import { AuthorizationHeaders, AuthType, ClientCredentials, Token } from './types'
import { get, post } from './utils/request'

export default class AfpNewsAuth {
  public token: Token | undefined

  protected baseUrl: string

  private apiKey: string | undefined
  private customAuthUrl: string | undefined
  private saveToken: Function

  constructor (
    {
      apiKey,
      clientId,
      clientSecret,
      baseUrl,
      customAuthUrl,
      saveToken
    }: ClientCredentials & { baseUrl?: string } & { saveToken?: (token: Token | null) => void } = {}
  ) {
    this.credentials = { apiKey, clientId, clientSecret, customAuthUrl }
    this.baseUrl = baseUrl || 'https://api.afp.com'
    if (saveToken) {
      this.saveToken = saveToken
    } else {
      this.saveToken = (token: Token) => {} // tslint:disable-line
    }
  }

  set credentials ({ clientId, clientSecret, apiKey, customAuthUrl }: ClientCredentials) {
    if (clientId && clientSecret) {
      delete this.customAuthUrl
      this.apiKey = base64(`${clientId}:${clientSecret}`)
    } else if (apiKey) {
      delete this.customAuthUrl
      this.apiKey = apiKey
    } else if (customAuthUrl) {
      delete this.apiKey
      this.customAuthUrl = customAuthUrl
    }
  }

  get authUrl (): string {
    if (this.customAuthUrl) {
      return this.customAuthUrl
    }
    return `${this.baseUrl}/oauth/token`
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
  ): Promise<Token> {
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
        if (this.customAuthUrl) {
          return this.requestAuthenticatedToken({ username, password })
        } else {
          throw new Error('You need an api key to make authenticated requests')
        }
      } else if (this.token && this.isTokenValid === true) {
        return Promise.resolve(this.token)
      } else {
        return this.requestAnonymousToken()
      }
    }
  }

  public resetToken (): void {
    delete this.token
    this.saveToken(null)
  }

  private async requestAnonymousToken (): Promise<Token> {
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

  get authorizationBasicHeaders (): AuthorizationHeaders {
    if (this.customAuthUrl || !this.apiKey) {
      return {}
    }
    return {
      Authorization: `Basic ${this.apiKey}`
    }
  }

  private async requestAuthenticatedToken (
    { username, password }:
    { username: string, password: string }
  ): Promise<Token> {
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

  private async requestRefreshToken (): Promise<Token> {
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
    authType: AuthType
  ): Token {
    this.token = {
      accessToken: access_token,
      authType,
      refreshToken: refresh_token,
      tokenExpires: +new Date() + expires_in * 1000
    }
    this.saveToken(this.token)

    return this.token
  }
}