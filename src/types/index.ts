export type Field =
  'news' |
  'slug' |
  'city' |
  'country' |
  'title' |
  'caption' |
  'creator' |
  'headline' |
  'entity_person' |
  'entity_location' |
  'lang' |
  'product' |
  'urgency' |
  'status'

export interface Request {
  and?: Request[],
  or?: Request[],
  name?: Field,
  in?: Array<string | number>,
  exclude?: Array<string | number>
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

export type AuthType = 'anonymous' | 'credentials'

export interface AuthorizationHeaders {
  Authorization?: string
}

export interface Form {
  [key: string]: string
}

export interface Token {
  accessToken: string,
  refreshToken: string,
  tokenExpires: number,
  authType: AuthType
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

export interface ClientCredentials {
  apiKey?: string,
  clientId?: string,
  clientSecret?: string,
  customAuthUrl?: string
}

export type Status = 'Canceled' | 'Usable' | 'Embargoed'

export interface AfpDocument {
  advisory: string,
  afpentity: {
    event: [
      {
        qcode: string,
        keyword: string
      }
    ],
    organisation: [
      {
        qcode: string,
        keyword: string
      }
    ],
    person: [
      {
        qcode: string,
        keyword: string
      }
    ]
  },
  bagItem: [
    {
      caption: string,
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
        byline: string,
        slug: string,
        dateline: string,
        copyright: string
      },
      provider: string,
      source: string,
      uno: string
    }
  ],
  bagUno: string[],
  caption: string[],
  channel: string[],
  city: string,
  contributor: string,
  country: string,
  country_only: string[],
  created: string,
  creator: string,
  dept: string,
  embargoed: string,
  entity_company: string[],
  entity_departmeent: string[],
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
  entity_function: string[],
  entity_keyword: string[],
  entity_location: string[],
  entity_media: string[],
  entity_organisation: string[],
  entity_person: string[],
  entity_region: string[],
  entity_video: string,
  event: string[],
  genre: string[],
  headline: string,
  href: string,
  iptc: string[],
  keyword: string[],
  lang: Lang,
  language: string,
  location: {
    lon: number,
    lat: number
  },
  mediatopic: string[],
  news: string[],
  newsItemID: string,
  objectName: string,
  ofinterestof: string[],
  product: Product,
  provider: string,
  publicIdentifier: string,
  published: string,
  region: string,
  revision: number,
  serial: string,
  signal: string,
  slug: string[],
  source: string,
  status: Status,
  summary: string[],
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
