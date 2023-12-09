import AfpNewsAuth from './afpnews-auth'
import defaultSearchParams from './default-search-params'
import { AdditionalParams, ClientCredentials, Params, Query, Request } from './types'
import buildQuery from './utils/query-builder'
import { get, post } from './utils/request'
import { z } from 'zod'

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

export default class AfpNewsSearch extends AfpNewsAuth {
  constructor (credentials: ClientCredentials) {
    super(credentials)
  }

  get defaultSearchParams () {
    return defaultSearchParams
  }

  private prepareRequest (params: Params, fields: string[] = []) {
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
      maxRows: 1,
      sortField,
      sortOrder
    } as Query

    if (langs && (!query || !query.includes('lang:'))) {
      body.lang = langs.join(',')
    }

    const additionalParams: Required<Pick<Request, 'and'>> = {
      and: []
    }
    if (Object.keys(rest).length > 0) {
      for (const name in rest) {
        const param: Request = {
          name
        }
        const value = (rest as AdditionalParams)[name]
        if (typeof value === 'number' ||typeof value === 'string') {
          param['in'] = [value]
        } else if (Array.isArray(value)) {
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

    console.log(JSON.stringify(body, null, 2))
    return body
  }

  public async search (params: Params = {}, fields: string[] = []) {
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

  public async list (facet: string, params: Params = {}, minDocCount = 1) {
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
}
