export type SearchQuery = {
  and?: SearchQuery[]
  or?: SearchQuery[]
  name?: string
  in?: Array<string | number>
  fullText?: boolean
  exclude?: Array<string | number>
}

export type SearchQuerySortOrder = 'asc' | 'desc'

export type AdditionalParamValue = 
  string | 
  number | 
  string[] | 
  number[] | 
  {
    in?: [string | number]
    exclude?: [string | number]
  }

export type SearchQueryParams = Partial<{
  sortOrder: SearchQuerySortOrder
  sortField: string
  query: string
  dateTo: string
  dateFrom: string
  size: number
  langs: string[]
  [key: string]: AdditionalParamValue
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
