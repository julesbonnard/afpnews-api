import type { z } from 'zod'
import type { Shot } from './utils/shotlist.js'
import type { AfpDocumentClassSchema } from './utils/parseDocument.js'

type StringOrNumber = string | number

/** Intervalle de l'opérateur `range` : bornes incluses par défaut, l'une des deux peut manquer. */
export type SearchRange = {
  from?: StringOrNumber
  to?: StringOrNumber
  fromExcluded?: boolean
  toExcluded?: boolean
}

export type SearchQuery = {
  /** Sans `name` : conditions à combiner. Avec `name` : valeurs que le document doit toutes porter. */
  and?: SearchQuery[] | StringOrNumber[]
  or?: SearchQuery[]
  name?: string
  in?: StringOrNumber[]
  contains?: string | string[]
  fullText?: boolean
  exclude?: StringOrNumber[]
  range?: SearchRange
  /** Nom d'un champ qui doit être présent */
  having?: string
  /** Nom d'un champ qui doit être absent */
  missing?: string
}

export type SearchQuerySortOrder = 'asc' | 'desc'

export type FacetConfig = { size: number; minDocCount: number }
export type WantedFacets = { empty?: boolean; [facetName: string]: FacetConfig | boolean | undefined }
export type SortEntry = { sortField: string; sortOrder: SearchQuerySortOrder }

/**
 * A single value returned by `list()` for a given facet, with its document count.
 * `name` can be `null`/absent when the API has no label for that value.
 */
export type AfpFacetValue = {
  name?: string | null
  count: number
}

/**
 * Filtre sur un champ. Une valeur ou une liste vaut `in`. Un objet combine des opérateurs, chacun
 * donnant une condition (toutes combinées en ET) :
 * - `in` : au moins une des valeurs ; `exclude` : aucune ; `and` : toutes les valeurs ;
 * - `contains` : recherche textuelle (`'"expression exacte"'` entre guillemets) ;
 * - `range` : intervalle ; `exists` : champ présent (`true`) ou absent (`false`).
 */
/**
 * Informations renvoyées par `search()` en plus des documents : facettes demandées via `wantedFacets`,
 * et `relation` (`eq` : total exact ; `gt` : total supérieur à la borne demandée via `exactNumFound`).
 */
export type SearchMeta = {
  facets?: Record<string, AfpFacetValue[]>
  relation?: 'eq' | 'gt'
}

/** Résultat de `mapping()` : chaque champ indexé, par nom. */
export type AfpFieldMapping = Record<string, {
  type: string
  facet: boolean
  analyzer?: string
  term_vector?: string
  store?: boolean
}>

export type AdditionalParamValue =
  string |
  number |
  string[] |
  number[] |
  {
    in?: StringOrNumber[]
    exclude?: StringOrNumber[]
    and?: StringOrNumber[]
    contains?: string
    range?: SearchRange
    exists?: boolean
  }

/** Filtres par champ : `{ country: 'fra', urgency: [1, 2], class: { exclude: ['picture'] } }`. */
export type SearchFilters = Record<string, AdditionalParamValue>

/**
 * Options de recherche. Les filtres par champ se passent dans `filters`.
 * Les clés à plat (`{ country: 'fra' }`) sont encore lues comme filtres mais dépréciées : retrait en 4.0.
 */
export type SearchQueryParams = Partial<{
  sortOrder: SearchQuerySortOrder
  sortField: string
  query: string
  dateTo: string
  dateFrom: string
  size: number
  langs: string[]
  startAt: number
  tz: string
  dateGap: string
  wantCluster: boolean
  wantedFacets: WantedFacets
  sort: SortEntry[]
  /** `true` : total exact ; `false` : pas de total (requête plus légère) ; nombre : total borné à cette valeur */
  exactNumFound: boolean | number
  /** Champ de date auquel s'appliquent `dateFrom`/`dateTo` (`dateRange.targetField`) ; `published` par défaut côté API */
  dateField: string
  filters: SearchFilters
  /** @deprecated Passer les filtres dans `filters`. */
  [key: string]: AdditionalParamValue | boolean | WantedFacets | SortEntry[] | SearchFilters
}>

export type AuthType = 'anonymous' | 'credentials'

export interface AuthorizationHeaders {
  Authorization?: string
}

export type AuthForm = {
  [key: string]: string
}

export type AuthToken = {
  accessToken: string
  refreshToken: string
  tokenExpires: number
  authType: AuthType
}

export type SearchRequest = {
  maxRows: number
  sortField: string
  sortOrder: SearchQuerySortOrder
  dateRange: {
    from: string
    to: string
    targetField?: string
  }
  exactNumFound?: boolean | number
  query?: SearchQuery
  uno?: string
  fields?: string[]
  lang?: string
  startAt?: number
  tz?: string
  dateGap?: string
  wantCluster?: boolean
  wantedFacets?: WantedFacets
  sort?: SortEntry[]
}

export type AuthClientCredentials = 
  {
    baseUrl?: string
    apiKey?: string
    clientId?: never
    clientSecret?: never
  } |
  {
    baseUrl?: string
    apiKey?: never
    clientId: string
    clientSecret: string
  }

export type AuthUserCredentials = {
  username: string
  password: string
}

export type AfpDocumentClass = z.infer<typeof AfpDocumentClassSchema>

export type AfpDocumentStatus = 'Usable' | 'Canceled' | 'Embargoed' | 'WithHeld'

export type AfpDocumentSignal = 'correction' | 'update'

export type AfpEvent = {
  id: string
  name: string
}

export type AfpCountry = {
  id?: string
  name?: string
}

export type AfpParagraph = {
  index: number
  text: string
}

export type AfpMediaRendition = {
  role: string
  type: 'Photo' | 'Video' | 'Graphic'
  width: number
  height: number
  href: string
  sizeInBytes?: number
}

export type AfpMedia = {
  uno: string
  creator?: string
  provider?: string
  caption?: string
  dateline: string
  renditions: AfpMediaRendition[]
}

/**
 * Fields common to every `AfpDocument`, regardless of `class`. Fields specific to a subset of
 * classes (`caption`, `shots`, `topshot`, `topics`, `href`, `hasBeenAlerted`) stay optional here
 * so they remain accessible without narrowing — each per-class member below tightens the ones it
 * guarantees to a required type, for callers that do switch/narrow on `class`.
 */
export type AfpDocumentCommon = {
  uno: string
  shortId?: string
  source?: string
  headline?: string
  paragraphs: AfpParagraph[]
  lang: string
  country: AfpCountry
  city?: string
  creator?: string
  provider: string
  genre?: string
  urgency: number
  wordCount?: number
  events: AfpEvent[]
  slugs?: string[]
  keywords?: string[]
  disclaimer?: string[]
  advisory?: string
  created: Date
  published: Date
  embargoed?: Date
  revision: number
  status: AfpDocumentStatus
  signal?: AfpDocumentSignal
  hasBeenAlerted?: boolean
  medias: AfpMedia[]
  topics?: string[]
  topshot?: boolean
  caption?: string
  shots?: Shot[]
  href?: string
  title?: string
  creditLine?: string
  aspectRatios?: string[]
}

export type AfpTextDocument = AfpDocumentCommon & {
  class: 'text' | 'factcheck'
  hasBeenAlerted: boolean
}

export type AfpMultimediaDocument = AfpDocumentCommon & {
  class: 'multimedia'
  hasBeenAlerted: boolean
}

export type AfpPictureDocument = AfpDocumentCommon & {
  class: 'picture' | 'graphic'
  topshot: boolean
}

export type AfpVideoDocument = AfpDocumentCommon & {
  class: 'video' | 'videography'
  caption: string
  shots: Shot[]
}

export type AfpWebStoryDocument = AfpDocumentCommon & {
  class: 'webstory'
}

/**
 * Canonical, presentation-agnostic representation of an AFP document.
 * Returned by `parseDocument()` and by `get`/`search`/`searchAll` when called with `{ parse: true }`.
 * A discriminated union on `class` — switch/narrow on it to get the fields a given class
 * guarantees as required, or access any field directly (still optional-typed) without narrowing.
 */
export type AfpDocument =
  | AfpTextDocument
  | AfpMultimediaDocument
  | AfpPictureDocument
  | AfpVideoDocument
  | AfpWebStoryDocument

export type ParseOption = { parse: true; lenient?: false }
// Saute les documents malformés au lieu de faire échouer tout le lot (voir `parseLeniently` dans docs.ts).
export type LenientParseOption = { parse: true; lenient: true }

/**
 * Union des tuples d'arguments des 3 surcharges de `search()`, pour typer un wrapper de
 * forwarding générique (ex. un `Proxy`) sans le piège `Parameters<typeof instance.search>`,
 * qui ne résout qu'à la dernière surcharge et tronquerait `options`.
 */
export type SearchArgs =
  | [params?: SearchQueryParams, fields?: string[]]
  | [params: SearchQueryParams, fields: string[], options: ParseOption]
  | [params: SearchQueryParams, fields: string[], options: LenientParseOption]

/** Même besoin que `SearchArgs`, pour `mlt()`. */
export type MltArgs =
  | [uno: string, lang: string, size?: number, fields?: string[]]
  | [uno: string, lang: string, size: number | undefined, fields: string[], options: ParseOption]
  | [uno: string, lang: string, size: number | undefined, fields: string[], options: LenientParseOption]

/** Même besoin que `SearchArgs`, pour `get()`. */
export type GetArgs =
  | [uno: string]
  | [uno: string, options: ParseOption]
