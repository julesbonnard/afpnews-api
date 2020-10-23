import AfpNewsAuth from './afpnews-auth'
import defaultSearchParams from './default-search-params'
import defaultListParams from './default-list-params'
import { AfpResponseDocuments, AfpResponseTopics, AfpResponseOnlineTopics, AfpResponseOnlineIndex, AuthorizationHeaders, ClientCredentials, ListParams, Params, Query, Request, Token, SortField, SortOrder } from './types'
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

  get defaultListParams (): ListParams {
    return defaultListParams as ListParams
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
        from: dateFrom as string,
        to: dateTo as string
      },
      maxRows: maxRows as number,
      query: request,
      sortField: sortField as SortField,
      sortOrder: sortOrder as SortOrder
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
    const docs = data.response.docs
    return docs[0]
  }

  public async list (facet: string, listParams?: ListParams) {
    const {
      minDocCount,
      products,
      dateFrom,
      dateTo,
      urgencies,
      query,
      langs,
      sources,
      topics
    } = Object.assign({}, this.defaultListParams, listParams)

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

    const data: AfpResponseTopics = await post(`${this.apiUrl}/list/${facet}?minDocCount=${minDocCount}`, body, {
      headers: this.authorizationBearerHeaders
    })

    const { topics: keywords, numFound: count } = data.response

    return {
      count,
      keywords
    }
  }

  public async topics (lang: string) {
    await this.authenticate()

    const data: AfpResponseOnlineTopics = await get(`${this.baseUrl}/onlinenews/api/topics?lang=${lang}`, {
      headers: this.authorizationBearerHeaders
    })

    const { topics } = data.response

    return topics.map(d => d.name)
  }

  public async index (topic: string, lang: string) {
    await this.authenticate()

    const data: AfpResponseOnlineIndex = await get(`${this.baseUrl}/onlinenews/api/index?topic=${topic}&lang=${lang}`, {
      headers: this.authorizationBearerHeaders
    })

    const { documents } = data.response.docs

    return documents.map(d => d.uno)
  }

  public async feed (topic: string, lang: string) {
    await this.authenticate()

    // const data = await get(`${this.apiUrl}/onlinenews/api/feed?topic=${topic}&lang=${lang}`, {
    //   headers: this.authorizationBearerHeaders
    // })

    // const { topics } = data.response

    // return {
    //   topics
    // }

    const index = await this.index(topic, lang)
    const { documents } = await this.search({
      query: `uno:(${index.join(' OR ')})`
    })
    return documents.sort((a, b) => index.indexOf(a.uno) - index.indexOf(b.uno))
  }
}
