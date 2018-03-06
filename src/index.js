import { resolve } from 'url'
import { get, post } from './request'
import { defaultSearchParams } from './defaultParams'
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
    } else {
      this._apiKey = apiKey
    }
  }

  get isTokenValid () {
    return this.token && this.token.tokenExpires > +new Date()
  }

  get token () {
    if (this._accessToken === null || this._tokenExpires === null || this._refreshToken === null) return null
    return {
      accessToken: this._accessToken,
      tokenExpires: this._tokenExpires,
      refreshToken: this._refreshToken
    }
  }

  set token ({ accessToken, refreshToken, tokenExpires }) {
    this._accessToken = accessToken
    this._refreshToken = refreshToken
    this._tokenExpires = tokenExpires
  }

  async authenticate (credentials) {
    if (this.apiKey) {
      if (credentials) {
        return this.requestAuthenticatedToken(credentials)
      } else if (this.token === null) {
        throw new Error('You need to authenticate with credentials once')
      } else if (this.isTokenValid === false) {
        return this.requestRefreshToken()
      } else {
        return Promise.resolve(this.token)
      }
    } else {
      if (credentials) {
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

      return this.parseToken(token)
    } catch (e) {
      return Promise.reject(e)
    }
  }

  async requestAuthenticatedToken ({ username, password }) {
    try {
      const token = await post(this.authUrl, {
        formData: {
          username,
          password,
          grant_type: 'password'
        },
        headers: {
          'Authorization': `Basic ${this.apiKey}`
        },
        json: true
      })

      return this.parseToken(token)
    } catch (e) {
      return Promise.reject(e)
    }
  }

  async requestRefreshToken () {
    try {
      const token = await post(this.authUrl, {
        formData: {
          refresh_token: this.token.refreshToken,
          grant_type: 'refresh_token'
        },
        headers: {
          'Authorization': `Basic ${this.apiKey}`
        },
        json: true
      })

      return this.parseToken(token)
    } catch (e) {
      return Promise.reject(e)
    }
  }

  parseToken ({ access_token, refresh_token, expires_in }) {
    this.token = {
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpires: +new Date() + expires_in * 1000
    }

    return Promise.resolve(this.token)
  }

  resetToken () {
    this.token = { accessToken: null, refreshToken: null, tokenExpires: null }
  }

  get searchUrl () {
    return resolve(this.baseUrl, '/v1/api/search')
  }

  get defaultSearchParams () {
    return defaultSearchParams
  }

  async search (query) {
    let { size, dateFrom, dateTo, urgency, searchTerms, lang, sort } = Object.assign(this.defaultSearchParams, query)

    await this.authenticate()

    const filters = ['product:news']
    let q = []

    if (urgency) {
      filters.push(`urgency:${urgency}`)
    }

    if (typeof searchTerms === 'string') {
      if (searchTerms === '') searchTerms = null
      else {
        const regex = /(["']([^"']+)["'])|([^\s]+)/gu
        searchTerms = searchTerms.match(regex)
      }
    }

    if (Array.isArray(searchTerms)) {
      q = searchTerms.map(s => {
        const searchExpression = s.split(':')
        if (!searchExpression[1]) {
          return `*:${s}`
        }
        return s
      })
    }

    const params = {
      lang,
      size,
      sort,
      from: dateFrom,
      to: dateTo,
      fq: filters.join(','),
      q: q.join(',')
    }

    try {
      const data = await get(this.searchUrl, {
        params,
        headers: {
          'Authorization': `Bearer ${this.token.accessToken}`,
          'Content-Type': 'application/json'
        },
        json: true
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
