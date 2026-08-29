import type { z } from 'zod'
import type { Shot } from './utils/shotlist.js'
import type { AfpDocumentClassSchema } from './utils/parseDocument.js'

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
