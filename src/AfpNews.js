import { resolve } from 'url'
import { get, post } from './request'
import { defaultSearchParams } from './defaultParams'

class AfpNews {
  constructor ({ apiKey, baseUrl } = {}) {
    this._apiKey = apiKey
    this.baseUrl = baseUrl || 'https://api.afpforum.com'
    this.resetToken()
  }

  get authUrl () {
    return resolve(this.baseUrl, '/oauth/token')
  }

  get isAccessTokenValid () {
    return this._accessToken !== null && this._refreshToken !== null && this._tokenExpires !== null && this._tokenExpires > +new Date()
  }

  get token () {
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
    if (this._apiKey) {
      if (credentials) {
        return this.requestAuthenticatedToken(credentials)
      } else if (this.token.accessToken === null) {
        throw new Error('You need to authenticate with credentials once')
      } else if (this.isAccessTokenValid === false) {
        return this.requestRefreshToken()
      } else {
        return Promise.resolve(this.token)
      }
    } else {
      if (this.credentials) {
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
          'Authorization': `Basic ${this._apiKey}`
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
          refresh_token: this._refreshToken,
          grant_type: 'refresh_token'
        },
        headers: {
          'Authorization': `Basic ${this._apiKey}`
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
    let { size, dateFrom, dateTo, urgency, searchTerms, lang, startat, sort } = Object.assign(defaultSearchParams, query)

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
      startat,
      lang,
      size: parseInt(size),
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
          'Authorization': `Bearer ${this._accessToken}`,
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

module.exports = AfpNews
