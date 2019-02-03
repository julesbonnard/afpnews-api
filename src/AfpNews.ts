import { resolve } from 'url'
import { AfpResponse, Client, Params, Query, Request } from './@types'
import AfpNewsAuth from './AfpNewsAuth'
import defaultSearchParams from './defaultSearchParams'
import buildQuery from './utils/queryBuilder'
import { get, post } from './utils/request'

export default class AfpNews extends AfpNewsAuth {
  constructor (credentials: Client | { baseUrl?: string } = {}) {
    super(credentials)
  }

  get apiUrl (): string {
    return resolve(this.baseUrl, '/v1/api')
  }

  get defaultSearchParams (): Params {
    return defaultSearchParams as Params
  }

  public async search (params?: Params) {
    const {
      products,
      size: maxRows,
      dateFrom,
      dateTo,
      urgencies,
      query,
      langs,
      sortField,
      sortOrder
    } = Object.assign({}, this.defaultSearchParams, params)

    await this.authenticate()

    try {
      const request: Request = {
        and: [
          {
            in: langs,
            name: 'lang'
          },
          {
            in: products,
            name: 'product'
          },
          {
            in: urgencies,
            name: 'urgency'
          },
          ...buildQuery(query)
        ]
      }

      const body: Query = {
        dateRange: {
          from: dateFrom,
          to: dateTo
        },
        maxRows,
        query: request,
        sortField,
        sortOrder
      }

      if (this.token === undefined) {
        throw new Error('Token is invalid')
      }
      const data: AfpResponse = await post(`${this.apiUrl}/search`, body, {
        headers: {
          'Authorization': `Bearer ${this.token.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      const { docs: documents, numFound: count } = data.response

      return Promise.resolve({
        count,
        documents
      })
    } catch (e) {
      return Promise.reject(e)
    }
  }

  public async get (uno: string) {
    await this.authenticate()

    try {
      if (this.token === undefined) {
        throw new Error('Token is invalid')
      }
      const data: AfpResponse = await get(`${this.apiUrl}/get/${uno}`, {
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
