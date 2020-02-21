import AfpNewsAuth from './afpnews-auth'
import defaultSearchParams from './default-search-params'
import { AfpResponseDocuments, AfpResponseTopics, AuthorizationHeaders, ClientCredentials, Lang, Params, Product, Urgency, Query, Request, Token } from './types'
import buildQuery from './utils/query-builder'
import { get, post } from './utils/request'

export default class AfpNews extends AfpNewsAuth {
  constructor (credentials: ClientCredentials & { baseUrl?: string, saveToken?: (token: Token | null) => void } = {}) {
    super(credentials)
  }

  get apiUrl (): string {
    return `${this.baseUrl}/v1/api`
  }

  get defaultSearchParams (): Params {
    return defaultSearchParams as Params
  }

  get authorizationBearerHeaders (): AuthorizationHeaders {
    if (!this.token) {
      return {}
    }
    return {
      Authorization: `Bearer ${this.token.accessToken}`
    }
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
      sortOrder,
      sources,
      topics
    } = Object.assign({}, this.defaultSearchParams, params)

    await this.authenticate()

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
        {
          in: sources,
          name: 'source'
        },
        {
          in: topics,
          name: 'topic'
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

    const data: AfpResponseDocuments = await post(`${this.apiUrl}/search`, body, {
      headers: this.authorizationBearerHeaders
    })

    const { docs: documents, numFound: count } = data.response

    return {
      count,
      documents
    }
  }

  public async get (uno: string) {
    await this.authenticate()

    const data: AfpResponseDocuments = await get(`${this.apiUrl}/get/${uno}`, {
      headers: this.authorizationBearerHeaders
    })
    const { docs } = data.response
    return {
      document: docs[0]
    }
  }

  public async list (facet: string, params?: { products: Product[], urgencies: Urgency[], minDocCount: number, dateFrom: string, dateTo: string, langs: Lang[], query: string }) {
    const {
      minDocCount,
      dateFrom,
      dateTo,
      langs,
      query,
      products,
      urgencies
    } = Object.assign({}, {
      minDocCount: 1,
      dateFrom: 'now-1d',
      dateTo: 'now',
      langs: [],
      query: '',
      products: [],
      urgencies: []
    }, params)

    await this.authenticate()

    const request: Request = {
      and: [
        {
          in: langs,
          name: 'lang'
        },
        ...buildQuery(query)
      ]
    }

    const body: any = {
      dateRange: {
        from: dateFrom,
        to: dateTo
      },
      query: request
    }

    const data: AfpResponseTopics = await post(`${this.apiUrl}/list/${facet}?minDocCount=${minDocCount}`, body, {
      headers: this.authorizationBearerHeaders
    })

    const { topics, numFound: count } = data.response

    return {
      count,
      topics
    }
  }
}
