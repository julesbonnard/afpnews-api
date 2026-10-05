import { defaultSearchParams } from '../config.js'
import { DATE_FIELDS } from '../searchFields.js'
import type { AdditionalParamValue, AfpFieldMapping, SearchFilters, SearchMeta, SearchQueryParams, AfpDocument, AfpFacetValue, ParseOption, LenientParseOption } from '../types.js'
import { QueryBuilder } from '../utils/QueryBuilder.js'
import { get, post } from '../utils/request.js'
import { parseDocument, safeParseDocument } from '../utils/parseDocument.js'
import { MANDATORY_RAW_FIELDS } from '../fields.js'
import { z } from 'zod'
import { Auth } from './auth.js'
import { Story } from './story.js'
import { NotificationCenter } from './notification.js'
import { FilterCenter } from './filter.js'

/**
 * @deprecated Clés à plat de `SearchQueryParams` lues comme filtres (`{ country: 'fra' }`) : à supprimer en 4.0,
 * au profit de `params.filters`. Garde les entrées qui ont la forme d'un filtre et ignore les autres
 * (booléens, valeurs absentes, objets d'options).
 */
const FILTER_OPERATORS = ['in', 'exclude', 'and', 'contains', 'range', 'exists']

function legacyFilters (rest: Record<string, unknown>): SearchFilters {
  const isFilterValue = (value: unknown): value is AdditionalParamValue =>
    typeof value === 'string' || typeof value === 'number' || Array.isArray(value) ||
    (typeof value === 'object' && value !== null && FILTER_OPERATORS.some(operator => operator in value))
  const filters: SearchFilters = {}
  for (const [name, value] of Object.entries(rest)) {
    if (isFilterValue(value)) filters[name] = value
  }
  return filters
}

function parseLeniently (docs: unknown[]): { documents: AfpDocument[]; skipped: number } {
  const documents = docs.flatMap(doc => {
    const parsed = safeParseDocument(doc)
    return parsed ? [parsed] : []
  })
  return { documents, skipped: docs.length - documents.length }
}

// Dispatch commun aux quatre méthodes qui exposent `{ parse, lenient }` (search/mlt/latest/searchWithFilter).
function applyParseOption (
  count: number,
  documents: unknown[],
  options?: { parse?: boolean; lenient?: boolean }
): { count: number; documents: unknown[]; skipped?: number } {
  if (!options?.parse) return { count, documents }
  if (options.lenient) {
    const { documents: parsed, skipped } = parseLeniently(documents)
    return { count, documents: parsed, skipped }
  }
  return { count, documents: documents.map(doc => parseDocument(doc)) }
}

// Taille d'une page de searchAll (une recherche peut aller jusqu'à maxRowsByRequest, mais des pages
// plus petites gardent des réponses légères).
const SEARCH_ALL_PAGE_SIZE = 1000

const facetBuckets = z.object({ value: z.string(), occurence: z.number() }).array()
  .transform(buckets => buckets.map(({ value, occurence }) => ({ name: value, count: occurence })))

const searchResponse = z.object({
  response: z.object({
    docs: z.unknown().array().default([]),
    numFound: z.number().default(0),
    facets: z.record(z.string(), facetBuckets).optional(),
    relation: z.enum(['eq', 'gt']).optional()
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

// Forme constatée en prod (le YAML décrit à tort `response.fields[]`).
const mappingResponse = z.object({
  response: z.object({
    mapping: z.record(z.string(), z.looseObject({
      type: z.string(),
      facet: z.boolean(),
      analyzer: z.string().optional(),
      term_vector: z.string().optional(),
      store: z.boolean().optional()
    }))
  })
})

const getResponse = z.object({
  response: z.object({
    docs: z.unknown().array().length(1)
  })
})

export class Docs extends Auth {
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
      exactNumFound,
      dateField,
      filters,
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
      .setExactNumFound(exactNumFound)
      .setDateField(dateField)
      .addFilters(legacyFilters(rest))
      .addFilters(filters)
      .build()
  }

  /**
   * Search documents using the API (without pagination, up to 1.000 documents)
   * @param params - An object containing the search parameters
   * @param fields - An array of fields to include in the response
   * @returns An object containing the documents and their count
   */
  public async search (params?: SearchQueryParams, fields?: string[]): Promise<{ count: number; documents: unknown[] } & SearchMeta>
  /**
   * Search documents and parse them into the canonical `AfpDocument` model
   * @param params - An object containing the search parameters
   * @param fields - An array of fields to include in the response
   * @param options - Pass `{ parse: true }` to get typed `AfpDocument`s
   * @returns An object containing the parsed documents and their count
   */
  public async search (params: SearchQueryParams, fields: string[], options: ParseOption): Promise<{ count: number; documents: AfpDocument[] } & SearchMeta>
  /**
   * Search documents and parse them into the canonical `AfpDocument` model, skipping any
   * document that fails to parse instead of failing the whole request
   * @param params - An object containing the search parameters
   * @param fields - An array of fields to include in the response
   * @param options - Pass `{ parse: true, lenient: true }` to skip malformed documents
   * @returns An object containing the parsed documents, their count, and how many were skipped
   */
  public async search (params: SearchQueryParams, fields: string[], options: LenientParseOption): Promise<{ count: number; documents: AfpDocument[]; skipped: number } & SearchMeta>
  public async search (params: SearchQueryParams = {}, fields: string[] = [], options?: { parse?: boolean; lenient?: boolean }): Promise<{ count: number; documents: unknown[]; skipped?: number } & SearchMeta> {
    const body = this.prepareRequest(params, this.withMandatorySocle(fields, options?.parse))

    const data = await this.withAuth(() => post(`${this.baseUrl}/v1/api/search`, body, {
      headers: this.authorizationBearerHeaders,
      retry: true,
      params: { wt: 'json' }
    }))

    const { response: { docs: documents, numFound: count, facets, relation } } = searchResponse.parse(data)

    return { ...applyParseOption(count, documents, options), ...(facets && { facets }), ...(relation && { relation }) }
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
  /**
   * Search documents using the API (with pagination), parsed into the canonical `AfpDocument`
   * model, skipping any document that fails to parse instead of failing the whole scan
   * @param params - An object containing the search parameters
   * @param fields - An array of fields to include in the response
   * @param options - Pass `{ parse: true, lenient: true }` to skip malformed documents
   * @returns An async generator yielding parsed documents (silently fewer than requested if some were skipped)
   */
  public searchAll (params: SearchQueryParams, fields: string[], options: LenientParseOption): AsyncGenerator<AfpDocument>
  public async * searchAll (params: SearchQueryParams = {}, fields: string[] = [], options?: { parse?: boolean; lenient?: boolean }): AsyncGenerator<unknown> {
    const maxSize = params.size ?? defaultSearchParams.size
    const sortField = params.sortField ?? defaultSearchParams.sortField
    // Pagination par curseur sur le champ de tri quand c'est une date (la fenêtre doit alors porter sur ce
    // champ, d'où dateField) ; sinon simple pagination par startAt.
    const cursorOnDate = (DATE_FIELDS as readonly string[]).includes(sortField)
    const bound = params.sortOrder === 'asc' ? 'dateFrom' : 'dateTo'
    const pageParams: SearchQueryParams = { ...params, ...(cursorOnDate && { dateField: sortField }) }
    // fields: [] = toutes les colonnes ; sinon le curseur a besoin du champ de tri et de uno.
    const pageFields = fields.length > 0 ? [...new Set([...this.withMandatorySocle(fields, options?.parse), sortField, 'uno'])] : fields

    let yielded = 0
    let startAt = params.startAt ?? 0
    let boundary: unknown
    // Documents déjà renvoyés qui portent la valeur de borne : la page suivante, bornée de façon inclusive,
    // commence par eux. On les saute avec startAt (pas de doublon, pas de boucle si toute une page partage
    // la même date) ; la déduplication par uno reste un filet de sécurité.
    // ponytail: suppose un ordre stable entre documents de même date ; sinon l'un d'eux peut être sauté.
    // Si ça se produit, ajouter un second tri sur `timestamp` (recette « flux temps réel » de la doc).
    let unosAtBoundary = new Set<string>()

    while (yielded < maxSize) {
      const size = Math.min(maxSize - yielded, SEARCH_ALL_PAGE_SIZE)
      const { documents } = await this.search({ ...pageParams, size, startAt }, pageFields)
      const yieldedBefore = yielded

      for (const doc of documents) {
        const { uno, [sortField]: value } = doc as Record<string, unknown>
        if (typeof uno === 'string' && value === boundary && unosAtBoundary.has(uno)) continue
        yielded++
        if (!options?.parse) yield doc
        else if (!options.lenient) yield parseDocument(doc)
        else {
          const parsed = safeParseDocument(doc)
          if (parsed) yield parsed
        }
      }

      // Page incomplète : fin des résultats. Page sans aucun nouveau document : on n'avance plus, on s'arrête.
      if (documents.length < size || yielded === yieldedBefore) return

      if (!cursorOnDate) {
        startAt += documents.length
        continue
      }

      const last = documents[documents.length - 1] as Record<string, unknown>
      const lastValue = last[sortField]
      if (typeof lastValue !== 'string') throw new Error(`searchAll: document without "${sortField}", cannot paginate`)
      const atLast = documents
        .map(doc => doc as Record<string, unknown>)
        .filter(doc => doc[sortField] === lastValue)
        .map(doc => String(doc.uno))
      unosAtBoundary = lastValue === boundary ? new Set([...unosAtBoundary, ...atLast]) : new Set(atLast)
      boundary = lastValue
      pageParams[bound] = lastValue
      startAt = unosAtBoundary.size
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
   * @param fields - An array of fields to include in the response
   * @returns An object containing the documents and their count
   */
  public async mlt (uno: string, lang: string, size?: number, fields?: string[]): Promise<{ count: number; documents: unknown[] }>
  /**
   * Get more like this documents, parsed into the canonical `AfpDocument` model
   * @param uno - A unique identifier for one document
   * @param lang - The language of the documents
   * @param size - The number of documents to return
   * @param fields - An array of fields to include in the response
   * @param options - Pass `{ parse: true }` to get typed `AfpDocument`s
   * @returns An object containing the parsed documents and their count
   */
  public async mlt (uno: string, lang: string, size: number | undefined, fields: string[], options: ParseOption): Promise<{ count: number; documents: AfpDocument[] }>
  /**
   * Get more like this documents, parsed into the canonical `AfpDocument` model, skipping any
   * document that fails to parse instead of failing the whole request
   * @param uno - A unique identifier for one document
   * @param lang - The language of the documents
   * @param size - The number of documents to return
   * @param fields - An array of fields to include in the response
   * @param options - Pass `{ parse: true, lenient: true }` to skip malformed documents
   * @returns An object containing the parsed documents, their count, and how many were skipped
   */
  public async mlt (uno: string, lang: string, size: number | undefined, fields: string[], options: LenientParseOption): Promise<{ count: number; documents: AfpDocument[]; skipped: number }>
  public async mlt (uno: string, lang: string, size: number = 10, fields: string[] = [], options?: { parse?: boolean; lenient?: boolean }): Promise<{ count: number; documents: unknown[]; skipped?: number }> {
    // Contrairement à search (fields dans le body POST), l'API expose ici `fl` (convention Solr),
    // sur la requête GET — vérifié en conditions réelles, `fields` est silencieusement ignoré ici.
    const fl = this.withMandatorySocle(fields, options?.parse)

    const data = await this.withAuth(() => get(`${this.baseUrl}/v1/api/mlt`, {
      headers: this.authorizationBearerHeaders,
      params: {
        uno,
        lang,
        size,
        ...(fl.length > 0 ? { fl: fl.join(',') } : {}),
        wt: 'json'
      }
    }))

    const { response: { docs: documents, numFound: count } } = searchResponse.parse(data)

    return applyParseOption(count, documents, options)
  }

  /**
   * List values for a specific facet
   * @param facet - A facet name
   * @param params - An object containing the search parameters
   * @param minDocCount - The minimum number of documents a value must have to be included in the response
   * @returns An object containing the keywords (typed, zod-validated `AfpFacetValue[]`) and their count
   */
  public async list (facet: string, params: SearchQueryParams = {}, minDocCount = 1): Promise<{ count: number; keywords: AfpFacetValue[] }> {
    // `size` = nombre de valeurs de facette, en query ; 100 est le défaut constaté côté API.
    const { size = 100, ...searchParams } = params
    const body = this.prepareRequest(Object.assign({}, defaultSearchParams, { dateFrom: 'now-2d' }, searchParams), [])

    const data = await this.withAuth(() => post(`${this.baseUrl}/v1/api/list/${facet}`, body, {
      headers: this.authorizationBearerHeaders,
      retry: true,
      params: {
        minDocCount,
        size,
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
  /**
   * Get the latest documents, parsed into the canonical `AfpDocument` model, skipping any
   * document that fails to parse instead of failing the whole request
   * @param params - Optional query params: lang, tz, tr
   * @param options - Pass `{ parse: true, lenient: true }` to skip malformed documents
   * @returns An object containing the parsed documents, their count, and how many were skipped
   */
  public async latest (params: { lang?: string; tz?: string; tr?: string }, options: LenientParseOption): Promise<{ count: number; documents: AfpDocument[]; skipped: number }>
  public async latest (params: { lang?: string; tz?: string; tr?: string } = {}, options?: { parse?: boolean; lenient?: boolean }): Promise<{ count: number; documents: unknown[]; skipped?: number }> {
    const data = await this.withAuth(() => get(`${this.baseUrl}/v1/api/latest`, {
      headers: this.authorizationBearerHeaders,
      params: {
        ...params,
        wt: 'json'
      }
    }))

    const { response: { docs: documents, numFound: count } } = searchResponse.parse(data)

    return applyParseOption(count, documents, options)
  }

  /**
   * Get the API field mapping: every indexed field (464 in prod, Oct. 2026) with its type and whether it is
   * facetable. `lang` is required (the API returns an empty mapping without it) but does not change the result.
   * @param lang - The language for the mapping
   * @returns The mapping, keyed by field name
   */
  public async mapping (lang: string): Promise<AfpFieldMapping> {
    const data = await this.withAuth(() => get(`${this.baseUrl}/v1/api/mapping`, {
      headers: this.authorizationBearerHeaders,
      params: { wt: 'json', lang }
    }))

    return mappingResponse.parse(data).response.mapping
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
  /**
   * Search documents using a saved filter, parsed into the canonical `AfpDocument` model,
   * skipping any document that fails to parse instead of failing the whole request
   * @param filter - The filter name
   * @param options - Optional startat and size parameters
   * @param parseOptions - Pass `{ parse: true, lenient: true }` to skip malformed documents
   * @returns An object containing the parsed documents, their count, and how many were skipped
   */
  public async searchWithFilter (filter: string, options: { startat?: number; size?: number }, parseOptions: LenientParseOption): Promise<{ count: number; documents: AfpDocument[]; skipped: number }>
  public async searchWithFilter (filter: string, options: { startat?: number; size?: number } = {}, parseOptions?: { parse?: boolean; lenient?: boolean }): Promise<{ count: number; documents: unknown[]; skipped?: number }> {
    const data = await this.withAuth(() => get(`${this.baseUrl}/v1/api/search_with_filter`, {
      headers: this.authorizationBearerHeaders,
      params: {
        filter,
        ...options,
        wt: 'json'
      }
    }))

    const { response: { docs: documents, numFound: count } } = searchResponse.parse(data)

    return applyParseOption(count, documents, parseOptions)
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
