export type Field =
  'news' |
  'slug' |
  'city' |
  'country' |
  'title' |
  'caption' |
  'creator' |
  'headline' |
  'entity_person' |
  'entity_location' |
  'lang' |
  'product' |
  'urgency'

export interface LuceneQueryParsed {
  left: LuceneQueryParsed,
  operator: 'AND' | 'OR' | '<implicit>',
  right: LuceneQueryParsed,
  term: string,
  field: Field | '<implicit>',
  prefix: '-'
}

export interface Request {
  and?: Request[],
  or?: Request[],
  name?: Field,
  in?: Array<string | number>,
  exclude?: Array<string | number>
}

export type Lang =
  'fr' |
  'en' |
  'de' |
  'es' |
  'pt' |
  'ar' |
  'zh-tw' |
  'zh-cn'

export type Urgency = 1 | 2 | 3 | 4 | 5

export type Product =
  'news' |
  'multimedia' |
  'photo' |
  'infographie' |
  'sid' |
  'videographie' |
  'livereport' |
  'sidtv' |
  'parismode' |
  'afptvweb' |
  'afptv1st'

export type SortField = 'published'
export type SortOrder = 'asc' | 'desc'

export interface Params {
  sortOrder: SortOrder,
  sortField: SortField,
  query?: string,
  langs: Lang[],
  urgencies: Urgency[],
  dateTo: string,
  dateFrom: string,
  size: number,
  products: Product[]
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

export interface Query {
  maxRows: number,
  sortField: SortField,
  sortOrder: SortOrder,
  dateRange: {
    from: string,
    to: string
  },
  query: Request
}

export interface Client {
  apiKey?: string,
  clientId?: string,
  clientSecret?: string,
  baseUrl?: string
}

export interface MediaSize {
  width: number,
  height: number,
  href: string
}

export interface Media {
  uno: string,
  sizes: Array<MediaSize>,
  creator: string,
  provider: string,
  caption: string,
  source: string
}

export interface Document {
  uno: string,
  country: string,
  city: string,
  provider: string,
  creator: string,
  source: string,
  iptc: Array<string>,
  slugs: Array<string>,
  news: Array<string>,
  urgency: Urgency,
  product: Product,
  lang: Lang,
  published: string,
  headline: string,
  medias: Array<Media>
}

export interface ApiResponse {
  response: {
    docs: Document[],
    numFound: number
  }
}
