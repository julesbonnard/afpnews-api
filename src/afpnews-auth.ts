import { btoa } from 'isomorphic-base64'
import { AuthorizationHeaders, AuthType, ClientCredentials, Token } from './types'
import { get, postForm } from './utils/request'

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
      this.apiKey = btoa(`${clientId}:${clientSecret}`)
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
        return this.token
      }
    } else {
      if (username && password) {
        if (this.customAuthUrl) {
          return this.requestAuthenticatedToken({ username, password })
        } else {
          throw new Error('You need an api key to make authenticated requests')
        }
      } else if (this.isTokenValid === true) {
        return this.token as Token
      }
    }
    return this.requestAnonymousToken()
  }

  public resetToken (): void {
    delete this.token
    this.saveToken(null)
  }

  private async requestAnonymousToken (): Promise<Token> {
    const token = await get(this.authUrl, {
      params: {
        grant_type: 'anonymous'
      }
    })

    return this.parseToken(token, 'anonymous')
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
    const token = await postForm(
      this.authUrl,
      {
        grant_type: 'password',
        password,
        username
      }, {
        headers: this.authorizationBasicHeaders
      }
    )

    return this.parseToken(token, 'credentials')
  }

  private async requestRefreshToken (): Promise<Token> {
    if (this.token === undefined) {
      throw new Error('Token is invalid')
    }
    const newToken = await postForm(
      this.authUrl,
      {
        grant_type: 'refresh_token',
        refresh_token: this.token.refreshToken
      }, {
        headers: this.authorizationBasicHeaders
      }
    )

    return this.parseToken(newToken, this.token.authType)
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
