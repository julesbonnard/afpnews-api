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
