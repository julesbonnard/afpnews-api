export interface Request {
  and?: Request[],
  or?: Request[],
  name?: string,
  in?: Array<string | number>,
  exclude?: Array<string | number>
}

export interface Params {
  sortOrder?: string,
  sortField?: string,
  query?: string,
  langs?: string[],
  urgencies?: number[],
  dateTo?: string,
  dateFrom?: string,
  size?: number,
  products?: string[]
}

export interface Headers {
  Authorization: string,
  'Content-Type': string
}

export interface Form {
  [key: string]: string
}

export interface Token {
  accessToken: string,
  refreshToken: string,
  tokenExpires: number,
  authType: string
}

export interface Credentials {
  username?: string,
  password?: string
}

export interface Query {
  maxRows: number,
  sortField: string,
  sortOrder: string,
  dateRange: {
    from: string,
    to: string
  },
  query: Request
}

export interface Client {
  apiKey?: string,
  clientId?: string,
  clientSecret?: string
}
