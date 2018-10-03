import { resolve } from 'url'
import { get, post } from './request'
import { defaultSearchParams } from './defaultParams'
import { buildQuery } from './queryBuilder'
import btoa from 'btoa'

export default class AfpNews {
  constructor ({ apiKey, clientId, clientSecret, baseUrl } = {}) {
    this.apiKey = { apiKey, clientId, clientSecret }
    this.baseUrl = baseUrl || 'https://api.afp.com'
    this.resetToken()
  }

  get authUrl () {
    return resolve(this.baseUrl, '/oauth/token')
  }

  get apiKey () {
    return this._apiKey
  }

  set apiKey ({ apiKey, clientId, clientSecret }) {
    if (clientId && clientSecret) {
      this._apiKey = btoa(`${clientId}:${clientSecret}`)
    } else if (apiKey) {
      this._apiKey = apiKey
    } else {
      delete this._apiKey
    }
  }

  get isTokenValid () {
    return this.token && this.token.tokenExpires > +new Date()
  }

  get token () {
    if (this._accessToken === undefined || this._tokenExpires === undefined || !this._refreshToken === undefined || this._authType === undefined) return null
    return {
      accessToken: this._accessToken,
      tokenExpires: this._tokenExpires,
      refreshToken: this._refreshToken,
      authType: this._authType
    }
  }

  set token ({ accessToken, refreshToken, tokenExpires, authType }) {
    this._accessToken = accessToken
    this._refreshToken = refreshToken
    this._tokenExpires = tokenExpires
    this._authType = authType
  }

  async authenticate ({ username, password } = {}) {
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
      } else {
        return this.requestAnonymousToken()
      }
    }
  }

  async requestAnonymousToken () {
    try {
      const token = await get(this.authUrl, {
        params: {
          grant_type: 'anonymous'
        },
        json: true
      })

      token.authType = 'anonymous'

      return this.parseToken(token)
    } catch (e) {
      return Promise.reject(e)
    }
  }

  get authorizationBasicHeaders () {
    return {
      'Authorization': `Basic ${this.apiKey}`
    }
  }

  async requestAuthenticatedToken ({ username, password }) {
    try {
      const token = await post(this.authUrl, {}, {
        formData: {
          username,
          password,
          grant_type: 'password'
        },
        headers: this.authorizationBasicHeaders,
        json: true
      })

      token.authType = 'credentials'

      return this.parseToken(token)
    } catch (e) {
      return Promise.reject(e)
    }
  }

  async requestRefreshToken () {
    try {
      const newToken = await post(this.authUrl, {}, {
        formData: {
          refresh_token: this.token.refreshToken,
          grant_type: 'refresh_token'
        },
        headers: this.authorizationBasicHeaders
      })

      newToken.authType = this.token.authType

      return this.parseToken(newToken)
    } catch (e) {
      return Promise.reject(e)
    }
  }

  parseToken ({ access_token, refresh_token, expires_in, authType }) {
    this.token = {
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpires: +new Date() + expires_in * 1000,
      authType
    }

    return Promise.resolve(this.token)
  }

  resetToken () {
    delete this._accessToken
    delete this._refreshToken
    delete this._tokenExpires
    delete this._authType
  }

  get searchUrl () {
    return resolve(this.baseUrl, '/v1/api/search')
  }

  get defaultSearchParams () {
    return defaultSearchParams
  }

  async search (params) {
    let { products, size, dateFrom, dateTo, urgencies, query, langs, sortField, sortOrder } = Object.assign({}, this.defaultSearchParams, params)

    await this.authenticate()

    let request = {
      and: []
    }

    request.and.push({
      name: 'lang',
      in: langs
    })

    request.and.push({
      name: 'product',
      in: products
    })

    request.and.push({
      name: 'urgency',
      in: urgencies
    })

    try {
      const queryBuilt = buildQuery(query)
      request.and = request.and.concat(queryBuilt)
    } catch (e) {
      return Promise.reject(new Error('Invalid request'))
    }

    const body = {
      maxRows: size,
      sortField,
      sortOrder,
      dateRange: {
        from: dateFrom,
        to: dateTo
      },
      query: request
    }

    try {
      const data = await post(this.searchUrl, body, {
        headers: {
          'Authorization': `Bearer ${this.token.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      const { docs, numFound } = data.response

      return Promise.resolve({
        documents: docs || [],
        count: numFound
      })
    } catch (e) {
      return Promise.reject(e)
    }
  }
}
