import { z } from 'zod'
import type { AfpDocument, AfpDocumentCommon, AfpDocumentSignal, AfpEvent, AfpParagraph, AfpMedia, AfpMediaRendition } from '../types.js'
import { parseShotList } from './shotlist.js'

const EventSchema = z.object({
  qcode: z.string(),
  keyword: z.string()
})

const SignalEnum = z.enum(['correction', 'update', 'cwarn'])
const SignalInput = z.union([SignalEnum, z.array(SignalEnum)])

const STATUSES = ['Usable', 'Canceled', 'Embargoed', 'WithHeld'] as const
const StatusInput = z.string()
  .transform(value => value.trim() === '' ? 'Usable' : STATUSES.find(status => status.toLowerCase() === value.toLowerCase()) ?? value)
  .pipe(z.enum(STATUSES))

const tolerant = <T extends z.ZodType>(schema: T) => schema.optional().catch(undefined)
const StringList = z.union([z.string(), z.string().array()]).transform(v => Array.isArray(v) ? v : [v])

const UsageRightSchema = z.object({ phrase: z.string(), name: z.string().optional() })
const ExclusionSchema = z.object({ name: z.string(), type: z.string().optional(), untilDate: z.coerce.date().optional() })
const ExcludeAudienceSchema = z.object({ qcode: z.string(), text: z.string().optional() })
const RatingSchema = z.object({
  ratingtype: z.string(),
  value: z.coerce.number(),
  scalemin: z.coerce.number().optional(),
  scalemax: z.coerce.number().optional(),
  scaleunit: z.string().optional()
})

const HopHistorySchema = z.object({
  hop: z.array(z.object({
    action: z.array(z.object({
      uri: z.string().optional(),
      qcode: z.string().optional()
    }))
  }))
})

export const AfpDocumentClassSchema = z.enum([
  'text',
  'factcheck',
  'multimedia',
  'picture',
  'graphic',
  'video',
  'videography',
  'webstory'
])

const MediaComponentSchema = z.object({
  role: z.string(),
  type: z.string(),
  href: z.url(),
  width: z.number().optional(),
  height: z.number().optional(),
  sizeInBytes: z.number().optional(),
  rendition: z.string().optional(),
  duration: z.number().optional()
})

function makeFilteredArraySchema<T extends z.ZodType> (schema: T) {
  return z.array(z.unknown()).transform(items =>
    items.filter((item): item is z.infer<T> => schema.safeParse(item).success)
  )
}

type MediaComponent = z.infer<typeof MediaComponentSchema>

const isRendition = (component: MediaComponent): component is AfpMediaRendition =>
  ['Photo', 'Video', 'Graphic'].includes(component.type) && component.width !== undefined && component.height !== undefined

const BagItemSchema = z.object({
  uno: z.string(),
  creator: z.string().optional(),
  provider: z.object({ name: z.string() }).optional(),
  caption: z.string().optional(),
  newslines: z.object({ dateline: z.string().default('') }).optional(),
  medias: makeFilteredArraySchema(MediaComponentSchema).default([])
})

export const DocumentSourceSchema = z.object({
  uno: z.string(),
  afpshortid: z.string().transform(d => d.toUpperCase()).optional(),
  class: AfpDocumentClassSchema,
  headline: z.string().optional(),
  source: z.string().optional(),
  title: z.string().optional(),
  creditLine: z.string().optional(),
  aspectRatios: z.string().array().optional(),
  news: z.string().array().default([]),
  caption: z.string().array().optional(),
  urgency: z.number(),
  wordCount: z.number().optional(),
  genre: tolerant(StringList),
  topic: z.string().array().optional(),
  href: z.string().optional(),
  created: z.coerce.date(),
  published: z.coerce.date(),
  embargoed: z.coerce.date().optional(),
  lang: z.string(),
  afpentity: z.object({ event: z.unknown().array().optional() }).optional(),
  slug: z.string().array().optional(),
  keyword: z.string().array().optional(),
  country: z.string().optional(),
  countryname: z.string().optional(),
  city: z.string().optional(),
  revision: z.number(),
  disclaimer: z.string().array().optional(),
  advisory: z.string().optional(),
  provider: z.string(),
  creator: z.string().optional(),
  status: StatusInput,
  signal: SignalInput.optional(),
  hopHistory: HopHistorySchema.optional(),
  bagItem: z.array(BagItemSchema).default([]),
  copyright: tolerant(z.string()),
  rules: tolerant(StringList),
  usageRight: tolerant(UsageRightSchema.array()),
  exclusion: tolerant(ExclusionSchema.array()),
  country_out: tolerant(StringList),
  country_only: tolerant(StringList),
  expires: tolerant(z.coerce.date()),
  initialStatus: tolerant(z.string()),
  excludeAudiences: tolerant(ExcludeAudienceSchema.array()),
  genreid: tolerant(StringList),
  summary: tolerant(StringList),
  subheadline: tolerant(z.string().transform(v => v.trim())),
  captionContext: tolerant(z.string()),
  channel: tolerant(StringList),
  mediatopic: tolerant(StringList),
  script: tolerant(StringList),
  associatedWith: tolerant(StringList),
  rating: tolerant(RatingSchema.array())
})

type DocumentSource = z.infer<typeof DocumentSourceSchema>

const CANCELLATION_PREFIXES = new Set([
  'ANNULATION:',
  'ANULACIÓN:',
  'ANULAÇÃO:',
  'ANNULLIERUNG:',
  'KILL:',
  'ANNULLIERT:',
  'إلغاء:'
])

function extractSignal (input: z.infer<typeof SignalInput> | undefined): AfpDocumentSignal | undefined {
  if (!input) return undefined
  const signals = Array.isArray(input) ? input : [input]
  if (signals.includes('correction')) return 'correction'
  if (signals.includes('update')) return 'update'
  return undefined
}

function extractEvents (events: unknown[] = []): AfpEvent[] {
  return events.flatMap(event => {
    const parsed = EventSchema.safeParse(event)
    if (!parsed.success) return []
    return [{
      id: parsed.data.qcode.split(':', 2)[1] ?? '',
      name: parsed.data.keyword.split(':').slice(1).join(':').trim()
    }]
  })
}

function extractMedia (bagItem: z.infer<typeof BagItemSchema>): AfpMedia {
  return {
    uno: bagItem.uno,
    creator: bagItem.creator,
    provider: bagItem.provider?.name,
    caption: bagItem.caption,
    dateline: bagItem.newslines?.dateline ?? '',
    renditions: bagItem.medias.filter(isRendition),
    components: bagItem.medias
  }
}

// Below urgency 4 (Flash/Alert/Urgent), the headline is often folded into the first
// news line rather than sent as its own field — promote it so `headline` is reliable.
function extractTextParagraphs (doc: DocumentSource): { headline?: string; paragraphs: AfpParagraph[] } {
  let headline = doc.headline
  let lines = doc.news

  if (!headline && doc.urgency < 4) {
    const cleaned = lines.filter(line => !CANCELLATION_PREFIXES.has(line))
    headline = cleaned[0]
    lines = cleaned.slice(1)
  }

  return {
    headline,
    paragraphs: lines.map((text, index) => ({ index, text }))
  }
}

function extractShots (news: string[]) {
  try {
    return parseShotList(news.join('\n'))
  } catch {
    return []
  }
}

function extractHasBeenAlerted (doc: DocumentSource): boolean {
  if (!doc.hopHistory || doc.urgency <= 3) return false
  return doc.hopHistory.hop.some(hop =>
    hop.action.some(action => (action.uri ?? action.qcode ?? '').includes('validatedAsFlashOrAlertOrUrgent'))
  )
}

function extractBase (doc: DocumentSource): Omit<AfpDocumentCommon, 'headline' | 'paragraphs' | 'medias'> {
  return {
    uno: doc.uno,
    shortId: doc.afpshortid,
    source: doc.source,
    lang: doc.lang,
    country: { id: doc.country, name: doc.countryname },
    city: doc.city,
    creator: doc.creator,
    provider: doc.provider,
    genre: doc.genre?.[0],
    genres: doc.genre,
    genreIds: doc.genreid,
    editorialTypes: doc.genreid?.filter(id => id.startsWith('afpedtype:')),
    editorialAttribute: doc.genreid?.find(id => id.startsWith('afpattribute:')),
    ratings: doc.rating?.map(({ ratingtype, value, scalemin, scalemax, scaleunit }) =>
      ({ type: ratingtype, value, scaleMin: scalemin, scaleMax: scalemax, unit: scaleunit })),
    urgency: doc.urgency,
    wordCount: doc.wordCount,
    events: extractEvents(doc.afpentity?.event),
    slugs: doc.slug,
    keywords: doc.keyword,
    disclaimer: doc.disclaimer,
    advisory: doc.advisory,
    created: doc.created,
    published: doc.published,
    embargoed: doc.embargoed,
    revision: doc.revision,
    status: doc.status,
    signal: extractSignal(doc.signal),
    title: doc.title,
    creditLine: doc.creditLine,
    aspectRatios: doc.aspectRatios,
    copyright: doc.copyright,
    rules: doc.rules,
    usageRights: doc.usageRight,
    exclusions: doc.exclusion,
    countriesOut: doc.country_out,
    countriesOnly: doc.country_only,
    expires: doc.expires,
    initialStatus: doc.initialStatus,
    contentWarnings: doc.excludeAudiences?.map(({ qcode, text }) => ({ code: qcode, label: text })),
    summary: doc.summary,
    subheadline: doc.subheadline || undefined,
    captionContext: doc.captionContext,
    channels: doc.channel,
    mediatopics: doc.mediatopic
  }
}

function isTopshot (doc: DocumentSource): boolean {
  return doc.rating?.some(rating => rating.ratingtype === 'afpratingtype:afpforum' && rating.value === 60) ?? false
}

/**
 * Parse a raw AFP Core API document into the canonical `AfpDocument` model.
 * Throws (via Zod) when `raw` does not match the expected shape.
 */
export function parseDocument (raw: unknown): AfpDocument {
  const doc = DocumentSourceSchema.parse(raw)
  const base = extractBase(doc)

  switch (doc.class) {
    case 'text':
    case 'factcheck': {
      const { headline, paragraphs } = extractTextParagraphs(doc)
      return {
        ...base,
        class: doc.class,
        headline,
        paragraphs,
        medias: doc.bagItem.map(extractMedia),
        hasBeenAlerted: extractHasBeenAlerted(doc)
      }
    }
    case 'multimedia': {
      const { headline, paragraphs } = extractTextParagraphs(doc)
      return {
        ...base,
        class: doc.class,
        headline,
        paragraphs,
        medias: doc.bagItem.map(extractMedia),
        topics: doc.topic,
        hasBeenAlerted: extractHasBeenAlerted(doc)
      }
    }
    case 'picture':
    case 'graphic':
      return {
        ...base,
        class: doc.class,
        headline: doc.headline,
        paragraphs: [],
        medias: doc.bagItem.map(extractMedia),
        caption: doc.caption?.[0] ?? doc.bagItem[0]?.caption,
        topshot: isTopshot(doc)
      }
    case 'video':
    case 'videography':
      return {
        ...base,
        class: doc.class,
        headline: doc.headline,
        paragraphs: [],
        medias: doc.bagItem.map(extractMedia),
        caption: doc.captionContext ?? doc.caption?.[0] ?? '',
        shots: extractShots(doc.news),
        script: doc.script,
        associatedWith: doc.associatedWith
      }
    case 'webstory':
      return {
        ...base,
        class: doc.class,
        headline: doc.headline,
        paragraphs: [],
        medias: doc.bagItem.map(extractMedia),
        href: doc.href
      }
  }
}

/**
 * Same as `parseDocument()`, but returns `undefined` instead of throwing when `raw` does not
 * match the expected shape. Used by the `{ parse: true, lenient: true }` methods on `Docs` to
 * skip malformed documents in a batch instead of failing the whole request.
 */
export function safeParseDocument (raw: unknown): AfpDocument | undefined {
  try {
    return parseDocument(raw)
  } catch {
    return undefined
  }
}
