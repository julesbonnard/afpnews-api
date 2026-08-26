import { defaultSearchParams } from '../config.js'
import type { AuthClientCredentials, SearchQueryParams, AfpDocument, AfpFacetValue } from '../types.js'
import { QueryBuilder } from '../utils/QueryBuilder.js'
import { get, post } from '../utils/request.js'
import { parseDocument } from '../utils/parseDocument.js'
import { MANDATORY_RAW_FIELDS } from '../fields.js'
import { z } from 'zod'
import { Auth } from './auth.js'
import { Story } from './story.js'
import { NotificationCenter } from './notification.js'
import { FilterCenter } from './filter.js'

type ParseOption = { parse: true }

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
      name: z.string().nullable().optional(),
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

  // `fields: []` veut dire "aucune restriction" côté API (toutes les colonnes) — ne jamais y
  // injecter le socle, ça le transformerait en restriction. Uniquement pertinent avec `parse`,
  // sinon `parseDocument()` n'est pas appelé et le socle brut n'a pas besoin d'être garanti.
  private withMandatorySocle (fields: string[], parse?: boolean): string[] {
    if (!parse || fields.length === 0) return fields
    return [...new Set([...fields, ...MANDATORY_RAW_FIELDS])]
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
      startAt,
      tz,
      dateGap,
      wantCluster,
      wantedFacets,
      sort,
      ...rest
    } = Object.assign({}, defaultSearchParams, params)

    return new QueryBuilder(fields)
      .setMaxRows(size)
      .setDateRange(dateFrom, dateTo)
      .setSort(sortField, sortOrder)
      .setLangs(langs)
      .setQuery(query)
      .setStartAt(startAt)
      .setTz(tz)
      .setDateGap(dateGap)
      .setWantCluster(wantCluster)
      .setWantedFacets(wantedFacets)
      .setMultiSort(sort)
      .addAdditionalParams(rest)
      .build()
  }

  /**
   * Search documents using the API (without pagination, up to 1.000 documents)
   * @param params - An object containing the search parameters
   * @param fields - An array of fields to include in the response
   * @returns An object containing the documents and their count
   */
  public async search (params?: SearchQueryParams, fields?: string[]): Promise<{ count: number; documents: unknown[] }>
  /**
   * Search documents and parse them into the canonical `AfpDocument` model
   * @param params - An object containing the search parameters
   * @param fields - An array of fields to include in the response
   * @param options - Pass `{ parse: true }` to get typed `AfpDocument`s
   * @returns An object containing the parsed documents and their count
   */
  public async search (params: SearchQueryParams, fields: string[], options: ParseOption): Promise<{ count: number; documents: AfpDocument[] }>
  public async search (params: SearchQueryParams = {}, fields: string[] = [], options?: { parse?: boolean }): Promise<{ count: number; documents: unknown[] }> {
    const body = this.prepareRequest(params, this.withMandatorySocle(fields, options?.parse))

    const data = await this.withAuth(() => post(`${this.baseUrl}/v1/api/search`, body, {
      headers: this.authorizationBearerHeaders,
      params: { wt: 'json' }
    }))

    const { response: { docs: documents, numFound: count } } = searchResponse.parse(data)

    return {
      count,
      documents: options?.parse ? documents.map(doc => parseDocument(doc)) : documents
    }
  }

  /**
   * Search documents using the API (with pagination)
   * @param params - An object containing the search parameters
   * @param fields - An array of fields to include in the response
   * @returns An object containing the documents and their count
   */
  public searchAll (params?: SearchQueryParams, fields?: string[]): AsyncGenerator<unknown>
  /**
   * Search documents using the API (with pagination), parsed into the canonical `AfpDocument` model
   * @param params - An object containing the search parameters
   * @param fields - An array of fields to include in the response
   * @param options - Pass `{ parse: true }` to get typed `AfpDocument`s
   * @returns An async generator yielding parsed documents
   */
  public searchAll (params: SearchQueryParams, fields: string[], options: ParseOption): AsyncGenerator<AfpDocument>
  public async * searchAll (params: SearchQueryParams = {}, fields: string[] = [], options?: { parse?: boolean }): AsyncGenerator<unknown> {
    const direction = params.sortOrder === 'asc' ? 'dateFrom' : 'dateTo'
    const maxRequestSize = 1000
    const maxSize = params.size || defaultSearchParams.size
    const effectiveFields = this.withMandatorySocle(fields, options?.parse)
    let i = 0
    while (i < maxSize) {
      params.size = Math.min(maxSize - i, maxRequestSize)
      const { count, documents } = await this.search(params, effectiveFields)
      if (!documents.length) return
      for (const doc of documents) {
        i++
        yield options?.parse ? parseDocument(doc) : doc
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
  public async get (uno: string): Promise<unknown>
  /**
   * Get a specific document using its Uno, parsed into the canonical `AfpDocument` model
   * @param uno - A unique identifier for the document
   * @param options - Pass `{ parse: true }` to get a typed `AfpDocument`
   * @returns The parsed document
   */
  public async get (uno: string, options: ParseOption): Promise<AfpDocument>
  public async get (uno: string, options?: { parse?: boolean }): Promise<unknown> {
    const data = await this.withAuth(() => get(`${this.baseUrl}/v1/api/get/${uno}`, {
      headers: this.authorizationBearerHeaders,
      params: { wt: 'json' }
    }))
    const { response: { docs }} = getResponse.parse(data)
    const doc = docs[0]
    return options?.parse ? parseDocument(doc) : doc
  }

  /**
   * Get more like this documents
   * @param uno - A unique identifier for one document
   * @param lang - The language of the documents
   * @param size - The number of documents to return
   * @returns An object containing the documents and their count
   */
  public async mlt (uno: string, lang: string, size?: number): Promise<{ count: number; documents: unknown[] }>
  /**
   * Get more like this documents, parsed into the canonical `AfpDocument` model
   * @param uno - A unique identifier for one document
   * @param lang - The language of the documents
   * @param size - The number of documents to return
   * @param options - Pass `{ parse: true }` to get typed `AfpDocument`s
   * @returns An object containing the parsed documents and their count
   */
  public async mlt (uno: string, lang: string, size: number | undefined, options: ParseOption): Promise<{ count: number; documents: AfpDocument[] }>
  public async mlt (uno: string, lang: string, size: number = 10, options?: { parse?: boolean }): Promise<{ count: number; documents: unknown[] }> {
    const data = await this.withAuth(() => get(`${this.baseUrl}/v1/api/mlt`, {
      headers: this.authorizationBearerHeaders,
      params: {
        uno,
        lang,
        size,
        wt: 'json'
      }
    }))

    const { response: { docs: documents, numFound: count } } = searchResponse.parse(data)

    return {
      count,
      documents: options?.parse ? documents.map(doc => parseDocument(doc)) : documents
    }
  }

  /**
   * List values for a specific facet
   * @param facet - A facet name
   * @param params - An object containing the search parameters
   * @param minDocCount - The minimum number of documents a value must have to be included in the response
   * @returns An object containing the keywords (typed, zod-validated `AfpFacetValue[]`) and their count
   */
  public async list (facet: string, params: SearchQueryParams = {}, minDocCount = 1): Promise<{ count: number; keywords: AfpFacetValue[] }> {
    const body = this.prepareRequest(Object.assign({}, defaultSearchParams, { dateFrom: 'now-2d' }, params), [])

    const data = await this.withAuth(() => post(`${this.baseUrl}/v1/api/list/${facet}`, body, {
      headers: this.authorizationBearerHeaders,
      params: {
        minDocCount,
        wt: 'json'
      }
    }))

    const { response: { topics: keywords, numFound: count } } = listResponse.parse(data)

    return {
      count,
      keywords
    }
  }

  /**
   * Get the latest documents
   * @param params - Optional query params: lang, tz, tr
   * @returns An object containing the documents and their count
   */
  public async latest (params?: { lang?: string; tz?: string; tr?: string }): Promise<{ count: number; documents: unknown[] }>
  /**
   * Get the latest documents, parsed into the canonical `AfpDocument` model
   * @param params - Optional query params: lang, tz, tr
   * @param options - Pass `{ parse: true }` to get typed `AfpDocument`s
   * @returns An object containing the parsed documents and their count
   */
  public async latest (params: { lang?: string; tz?: string; tr?: string }, options: ParseOption): Promise<{ count: number; documents: AfpDocument[] }>
  public async latest (params: { lang?: string; tz?: string; tr?: string } = {}, options?: { parse?: boolean }): Promise<{ count: number; documents: unknown[] }> {
    const data = await this.withAuth(() => get(`${this.baseUrl}/v1/api/latest`, {
      headers: this.authorizationBearerHeaders,
      params: {
        ...params,
        wt: 'json'
      }
    }))

    const { response: { docs: documents, numFound: count } } = searchResponse.parse(data)

    return {
      count,
      documents: options?.parse ? documents.map(doc => parseDocument(doc)) : documents
    }
  }

  /**
   * Get the API field mapping
   * @param lang - The language for the mapping
   * @returns The mapping object
   */
  public async mapping (lang: string) {
    const data = await this.withAuth(() => get(`${this.baseUrl}/v1/api/mapping`, {
      headers: this.authorizationBearerHeaders,
      params: { wt: 'json', lang }
    }))

    const { response: { mapping } } = z.object({
      response: z.object({
        mapping: z.unknown()
      })
    }).parse(data)

    return mapping
  }

  /**
   * Search documents using a saved filter
   * @param filter - The filter name
   * @param options - Optional startat and size parameters
   * @returns An object containing the documents and their count
   */
  public async searchWithFilter (filter: string, options?: { startat?: number; size?: number }): Promise<{ count: number; documents: unknown[] }>
  /**
   * Search documents using a saved filter, parsed into the canonical `AfpDocument` model
   * @param filter - The filter name
   * @param options - Optional startat and size parameters
   * @param parseOptions - Pass `{ parse: true }` to get typed `AfpDocument`s
   * @returns An object containing the parsed documents and their count
   */
  public async searchWithFilter (filter: string, options: { startat?: number; size?: number }, parseOptions: ParseOption): Promise<{ count: number; documents: AfpDocument[] }>
  public async searchWithFilter (filter: string, options: { startat?: number; size?: number } = {}, parseOptions?: { parse?: boolean }): Promise<{ count: number; documents: unknown[] }> {
    const data = await this.withAuth(() => get(`${this.baseUrl}/v1/api/search_with_filter`, {
      headers: this.authorizationBearerHeaders,
      params: {
        filter,
        ...options,
        wt: 'json'
      }
    }))

    const { response: { docs: documents, numFound: count } } = searchResponse.parse(data)

    return {
      count,
      documents: parseOptions?.parse ? documents.map(doc => parseDocument(doc)) : documents
    }
  }

  /**
   * Get an RSS/ATOM feed based on a saved filter
   * @param filter - The filter name
   * @param options - Optional startat, size, role and wt parameters
   * @returns The feed content as text
   */
  public async feed (filter: string, options: { startat?: number; size?: number; role?: string; wt?: string } = {}) {
    const data = await this.withAuth(() => get(`${this.baseUrl}/v1/user/feed`, {
      headers: this.authorizationBearerHeaders,
      params: {
        filter,
        wt: 'xml',
        ...options
      }
    }, 'text', 'application/rss+xml'))

    return data
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

  /**
   * Access the filter center to manage saved filters
   * @returns The filter center
   */
  get filterCenter () {
    return FilterCenter.call(this)
  }
}
