import type { Shot } from './utils/shotlist.js'

type StringOrNumber = string | number

export type SearchQuery = {
  and?: SearchQuery[]
  or?: SearchQuery[]
  name?: string
  in?: StringOrNumber[]
  contains?: string[]
  fullText?: boolean
  exclude?: StringOrNumber[]
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

export type AdditionalParamValue =
  string |
  number |
  string[] |
  number[] |
  {
    in?: StringOrNumber[]
    exclude?: StringOrNumber[]
  }

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
  [key: string]: AdditionalParamValue | boolean | WantedFacets | SortEntry[]
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
  }
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

export type AfpDocumentClass =
  'text' |
  'factcheck' |
  'multimedia' |
  'picture' |
  'graphic' |
  'video' |
  'videography' |
  'webstory'

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
  type: 'Photo' | 'Video'
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
 * Canonical, presentation-agnostic representation of an AFP document.
 * Returned by `parseDocument()` and by `get`/`search`/`searchAll` when called with `{ parse: true }`.
 * Fields specific to a subset of `class` values (`caption`, `shots`, `topshot`, `topics`, `href`)
 * are only populated for the classes they apply to.
 */
export type AfpDocument = {
  uno: string
  shortId?: string
  class: AfpDocumentClass
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
