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

export interface AfpDocument {
  bagItem: [
    {
      creator: string,
      medias: [
        {
          height: number,
          href: string,
          role: string,
          type: string,
          width: number
        }
      ],
      newslines: {
        headline: string,
        byline: string
      },
      provider: string,
      source: string,
      uno: string
    }
  ],
  bagUno: string[],
  caption: string[],
  city: string,
  country: string,
  country_only: string[],
  created: string,
  entity_faces: [
    {
      faces: [
        {
          height: number,
          href: string,
          offsetX: number,
          offsetY: number,
          width: number
        }
      ],
      src: string
    }
  ],
  entity_location: string[],
  entity_person: string[],
  entity_video: string,
  headline: string,
  href: string,
  iptc: string[],
  lang: Lang,
  language: string,
  location: {
    lon: number,
    lat: number
  },
  news: string[],
  objectName: string,
  ofinterestof: string[],
  product: Product,
  provider: string,
  publicIdentifier: string,
  published: string,
  revision: number,
  serial: string,
  slug: string[],
  source: string,
  status: string,
  title: string,
  topic: string[],
  uno: string,
  urgency: Urgency
}

export interface AfpResponse {
  response: {
    docs: AfpDocument[],
    numFound: number
  }
}
