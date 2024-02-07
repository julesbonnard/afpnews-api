import { defaultSearchParams } from '../default-search-params'
import { AuthClientCredentials, SearchQueryParams } from '../types'
import { QueryBuilder } from '../utils/QueryBuilder'
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
  constructor (credentials?: AuthClientCredentials) {
    super(credentials)
  }

  protected prepareRequest (params: SearchQueryParams, fields: string[] = []) {
    const {
      size,
      dateFrom,
      dateTo,
      sortField,
      sortOrder,
      langs,
      query,
      ...rest
    } = Object.assign({}, defaultSearchParams, params)

    return new QueryBuilder(fields)
      .setMaxRows(size)
      .setDateRange(dateFrom, dateTo)
      .setSort(sortField, sortOrder)
      .setLangs(langs)
      .setQuery(query)
      .addAdditionalParams(rest)
      .build()
  }

  /**
   * Search documents using the API (without pagination, up to 1.000 documents)
   * @param params - An object containing the search parameters
   * @param fields - An array of fields to include in the response
   * @returns An object containing the documents and their count
   */
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

  /**
   * Search documents using the API (with pagination)
   * @param params - An object containing the search parameters
   * @param fields - An array of fields to include in the response
   * @returns An object containing the documents and their count
   */
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

  /**
   * Get a specific document using its Uno
   * @param uno - A unique identifier for the document
   * @returns The document
   */
  public async get (uno: string) {
    await this.authenticate()

    const data = await get(`${this.baseUrl}/v1/api/get/${uno}`, {
      headers: this.authorizationBearerHeaders
    })
    const { response: { docs }} = getResponse.parse(data)
    return docs[0]
  }

  /**
   * Get more like this documents
   * @param uno - A unique identifier for one document
   * @param lang - The language of the documents
   * @param size - The number of documents to return
   * @returns An object containing the documents and their count
   */
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

  /**
   * List values for a specific facet
   * @param facet - A facet name
   * @param params - An object containing the search parameters
   * @param minDocCount - The minimum number of documents a value must have to be included in the response
   * @returns An object containing the keywords and their count
   */
  public async list (facet: string, params: SearchQueryParams = {}, minDocCount = 1) {
    const body = this.prepareRequest(Object.assign({}, defaultSearchParams, { dateFrom: 'now-2d' }, params), [])

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

  /**
   * Get the HTML content to display a social story
   * @param doc - The doc object for a social story
   * @returns The URL of the social story
   */
  public getStoryHtml (doc: unknown) {
    return Story.call(this, doc)
  }

  /**
   * Access the notification center to subscribe to new documents
   * @returns The notification center
   */
  get notificationCenter () {
    return NotificationCenter.call(this)
  }
}
