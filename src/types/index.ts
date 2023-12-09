/* eslint-disable @typescript-eslint/naming-convention */
export type Request = {
  and?: Request[]
  or?: Request[]
  name?: string
  in?: Array<string | number>
  fullText?: boolean
  exclude?: Array<string | number>
}

export type SortOrder = 'asc' | 'desc'

export type BasicParams = {
  sortOrder?: SortOrder
  sortField?: string
  query?: string
  dateTo?: string
  dateFrom?: string
  size?: number
  langs?: string[]
}

export type AdditionalParamValue = string | number | [string | number] | {
  in?: [string | number]
  exclude?: [string | number]
}
export type AdditionalParams = {
  [key: string]: AdditionalParamValue
}

export type Params = BasicParams | AdditionalParams

export type AuthType = 'anonymous' | 'credentials'

export interface AuthorizationHeaders {
  Authorization?: string
}

export type Form = {
  [key: string]: string
}

export type Token = {
  accessToken: string
  refreshToken: string
  tokenExpires: number
  authType: AuthType
}

export type Query = {
  maxRows: number
  sortField: string
  sortOrder: SortOrder
  dateRange: {
    from: string
    to: string
  }
  query?: Request
  uno?: string
  fields?: string[]
  lang?: string
}

export type ClientCredentials = { baseUrl?: string; apiKey: string; clientId?: never; clientSecret?: never } | { baseUrl?: string; apiKey?: never; clientId: string; clientSecret: string}

export type UserCredentials = {
  username: string
  password: string
}
