import { resolve } from 'url'
import { get, post } from './utils/request'
import defaultSearchParams from './defaultSearchParams'
import buildQuery from './utils/queryBuilder'
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

  get apiUrl () {
    return resolve(this.baseUrl, '/v1/api')
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
    if ([this._accessToken, this._tokenExpires, this._refreshToken, this._authType].some(d => d === undefined)) return null
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

      return this.parseToken(token, 'anonymous')
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

      return this.parseToken(token, 'credentials')
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

      return this.parseToken(newToken, this.token.authType)
    } catch (e) {
      return Promise.reject(e)
    }
  }

  parseToken ({ access_token, refresh_token, expires_in }, authType) {
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

  get defaultSearchParams () {
    return defaultSearchParams
  }

  async search (params) {
    let { products, size, dateFrom, dateTo, urgencies, query, langs, sortField, sortOrder } = Object.assign({}, this.defaultSearchParams, params)

    await this.authenticate()

    const request = {
      and: []
    }

    request.and = request.and.concat([
      {
        name: 'lang',
        in: langs
      },
      {
        name: 'product',
        in: products
      },
      {
        name: 'urgency',
        in: urgencies
      }
    ])

    try {
      request.and = request.and.concat(buildQuery(query))
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
      const data = await post(`${this.apiUrl}/search`, body, {
        headers: {
          'Authorization': `Bearer ${this.token.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      const { docs: documents, numFound: count } = data.response

      return Promise.resolve({
        documents,
        count
      })
    } catch (e) {
      return Promise.reject(e)
    }
  }

  async get (uno) {
    await this.authenticate()

    try {
      const data = await get(`${this.apiUrl}/get/${uno}`, {
        headers: {
          'Authorization': `Bearer ${this.token.accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      const { docs } = data.response
      return Promise.resolve({
        document: docs[0]
      })
    } catch (e) {
      return Promise.reject(e)
    }
  }
}
