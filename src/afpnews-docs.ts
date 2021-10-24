import AfpNewsAuth from './afpnews-auth'
import defaultSearchParams from './default-search-params'
import { AfpResponseDocuments, AfpResponseTopics, AfpResponseOnlineTopics, AfpResponseOnlineIndex, ClientCredentials, Lang, Params, Query, Request, Token, SortField, SortOrder } from './types'
import buildQuery from './utils/query-builder'
import { get, post } from './utils/request'

export default class AfpNewsSearch extends AfpNewsAuth {
  constructor (credentials: ClientCredentials & { baseUrl?: string; saveToken?: (token: Token | null) => void } = {}) {
    super(credentials)
  }

  get defaultSearchParams (): Params {
    return defaultSearchParams as Params
  }

  public async search (params?: Params | null, fields?: string[]) {
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

    const optionnalParams: any = {}
    const optionnalRequest: [any?] = []

    if (langs) {
      if (langs.length === 1) {
        optionnalParams.lang = langs[0]
      } else if (langs.length > 1) {
        optionnalRequest.push({
          in: langs,
          name: 'lang'
        })
      }
    }

    if (products && products.length > 0) {
      optionnalRequest.push({
        in: products,
        name: 'product'
      })
    }

    if (urgencies && urgencies.length > 0) {
      optionnalRequest.push({
        in: urgencies,
        name: 'urgency'
      })
    }

    if (sources && sources.length > 0) {
      optionnalRequest.push({
        in: sources,
        name: 'source'
      })
    }

    if (topics && topics.length > 0) {
      optionnalRequest.push({
        in: topics,
        name: 'topic'
      })
    }

    const request: Request = {
      and: [
        ...optionnalRequest,
        ...buildQuery(query)
      ]
    }

    const body: Query = {
      dateRange: {
        from: dateFrom as string,
        to: dateTo as string
      },
      maxRows: maxRows as number,
      query: request,
      ...optionnalParams,
      fields,
      sortField: sortField as SortField,
      sortOrder: sortOrder as SortOrder
    }

    const data: AfpResponseDocuments = await post(`${this.baseUrl}/v1/api/search`, body, {
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

    const data: AfpResponseDocuments = await get(`${this.baseUrl}/v1/api/get/${uno}`, {
      headers: this.authorizationBearerHeaders
    })
    const docs = data.response.docs
    return docs[0]
  }

  public async mlt (uno: string, lang: Lang, size: number = 10) {
    await this.authenticate()

    const data: AfpResponseDocuments = await get(`${this.baseUrl}/v1/api/mlt`, {
      headers: this.authorizationBearerHeaders,
      params: {
        uno,
        lang,
        size
      }
    })

    const { docs: documents, numFound: count } = data.response

    return {
      count,
      documents
    }
  }

  public async list (facet: string, params?: Params, minDocCount = 1) {
    const {
      products,
      dateFrom,
      dateTo,
      urgencies,
      query,
      langs,
      sources,
      topics
    } = Object.assign({}, this.defaultSearchParams, { dateFrom: 'now-2d' }, params)

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

    const body: any = {
      dateRange: {
        from: dateFrom,
        to: dateTo
      },
      query: request
    }

    const data: AfpResponseTopics = await post(`${this.baseUrl}/v1/api/list/${facet}`, body, {
      headers: this.authorizationBearerHeaders,
      params: {
        minDocCount
      }
    })

    const { topics: keywords, numFound: count } = data.response

    return {
      count,
      keywords
    }
  }
}
