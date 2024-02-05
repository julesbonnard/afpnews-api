import { defaultSearchParams } from '../default-search-params'
import { AuthClientCredentials, SearchQueryParams, SearchRequest, SearchQuery } from '../types'
import { buildQuery } from '../utils/query-builder'
import { get, post } from '../utils/request'
import { z } from 'zod'
import { Auth } from './auth'
import { Story } from './story'
import { NotificationCenter } from './notification'

const docParser = z.object({
  published: z.string()
})

const searchResponse = z.object({
  response: z.object({
    docs: z.unknown().array().default([]),
    numFound: z.number().default(0)
  })
})

const listResponse = z.object({
  response: z.object({
    topics: z.object({
      name: z.string(),
      count: z.number()
    }).array().default([]),
    numFound: z.number().default(0)
  })
})

const getResponse = z.object({
  response: z.object({
    docs: z.unknown().array().length(1)
  })
})

export class Docs extends Auth {
  constructor (credentials: AuthClientCredentials) {
    super(credentials)
  }

  get defaultSearchParams () {
    return defaultSearchParams
  }

  protected prepareRequest (params: SearchQueryParams, fields: string[] = []) {
    const {
      size: maxRows,
      dateFrom,
      dateTo,
      sortField,
      sortOrder,
      langs,
      query,
      ...rest
    } = Object.assign({}, this.defaultSearchParams, params)

    const body = {
      dateRange: {
        from: dateFrom,
        to: dateTo
      },
      maxRows,
      sortField,
      sortOrder
    } as SearchRequest

    if (langs && langs.length > 0 && (!query || !query.includes('lang:'))) {
      body.lang = langs.join(',')
    }

    const additionalParams: Required<Pick<SearchQuery, 'and'>> = {
      and: []
    }
    if (Object.keys(rest).length > 0) {
      for (const name in rest) {
        const value = rest[name]
        if (!value) continue
        const param: SearchQuery = {
          name
        }
        if (typeof value === 'number' || typeof value === 'string') {
          param['in'] = [value]
        } else if (Array.isArray(value)) {
          if (value.length === 0) continue
          param['in'] = value
        } else {
          if (value.in) {
            additionalParams.and.push({
              ...param,
              in: value.in
            })
          }
          if (value.exclude) {
            additionalParams.and.push({
              ...param,
              exclude: value.exclude
            })
          }
          continue
        }
        additionalParams.and.push(param)
      }
    }

    const builtQuery = buildQuery(query)

    body.query = additionalParams.and.length > 0 ? {
      and: additionalParams.and.concat(builtQuery || [])
    } : builtQuery

    body.fields = fields

    return body
  }

  public async search (params: SearchQueryParams = {}, fields: string[] = []) {
    const body = this.prepareRequest(params, fields)

    await this.authenticate()
    const data = await post(`${this.baseUrl}/v1/api/search`, body, {
      headers: this.authorizationBearerHeaders
    })

    const { response: { docs: documents, numFound: count } } = searchResponse.parse(data)

    return {
      count,
      documents
    }
  }

  public async * searchAll (params: SearchQueryParams = {}, fields: string[] = []) {
    const direction = params.sortOrder === 'asc' ? 'dateFrom' : 'dateTo'
    const maxRequestSize = 1000
    const maxSize = params.size || defaultSearchParams.size
    let i = 0
    while (i < maxSize) {
      params.size = Math.min(maxSize - i, maxRequestSize)
      const { count, documents } = await this.search(params, fields)
      if (!documents.length) return
      for (const doc of documents) {
        i++
        yield doc
      }
      if (documents.length < params.size || count <= documents.length) return
      params[direction] = docParser.parse(documents.pop()).published
    }
  }

  public async get (uno: string) {
    await this.authenticate()

    const data = await get(`${this.baseUrl}/v1/api/get/${uno}`, {
      headers: this.authorizationBearerHeaders
    })
    const { response: { docs }} = getResponse.parse(data)
    return docs[0]
  }

  public async mlt (uno: string, lang: string, size: number = 10) {
    await this.authenticate()

    const data = await get(`${this.baseUrl}/v1/api/mlt`, {
      headers: this.authorizationBearerHeaders,
      params: {
        uno,
        lang,
        size
      }
    })

    const { response: { docs: documents, numFound: count } } = searchResponse.parse(data)

    return {
      count,
      documents
    }
  }

  public async list (facet: string, params: SearchQueryParams = {}, minDocCount = 1) {
    const body = this.prepareRequest(Object.assign({}, this.defaultSearchParams, { dateFrom: 'now-2d' }, params), [])

    await this.authenticate()

    const data = await post(`${this.baseUrl}/v1/api/list/${facet}`, body, {
      headers: this.authorizationBearerHeaders,
      params: {
        minDocCount
      }
    })

    const { response: { topics: keywords, numFound: count } } = listResponse.parse(data)

    return {
      count,
      keywords
    }
  }

  public getStoryHtml (doc: unknown) {
    return Story.call(this, doc)
  }

  get notificationCenter () {
    return NotificationCenter.call(this)
  }
}
