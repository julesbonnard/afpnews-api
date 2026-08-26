import { z } from 'zod'
import type { AfpDocument, AfpDocumentSignal, AfpEvent, AfpParagraph, AfpMedia } from '../types.js'
import { parseShotList } from './shotlist.js'

const EventSchema = z.object({
  qcode: z.string(),
  keyword: z.string()
})

const SignalEnum = z.enum(['correction', 'update', 'cwarn'])
const SignalInput = z.union([SignalEnum, z.array(SignalEnum)])

const HopHistorySchema = z.object({
  hop: z.array(z.object({
    action: z.array(z.object({
      uri: z.string().optional(),
      qcode: z.string().optional()
    }))
  }))
})

const MediaRenditionSchema = z.object({
  role: z.string(),
  width: z.number(),
  height: z.number(),
  href: z.url(),
  type: z.enum(['Photo', 'Video', 'Graphic']),
  sizeInBytes: z.number().optional()
})

function makeFilteredArraySchema<T extends z.ZodType> (schema: T) {
  return z.array(z.unknown()).transform(items =>
    items.filter((item): item is z.infer<T> => schema.safeParse(item).success)
  )
}

const BagItemSchema = z.object({
  uno: z.string(),
  creator: z.string().optional(),
  provider: z.object({ name: z.string() }).optional(),
  caption: z.string().optional(),
  newslines: z.object({ dateline: z.string().default('') }).optional(),
  medias: makeFilteredArraySchema(MediaRenditionSchema).default([])
})

export const DocumentSourceSchema = z.object({
  uno: z.string(),
  afpshortid: z.string().transform(d => d.toUpperCase()).optional(),
  class: z.enum([
    'text',
    'factcheck',
    'multimedia',
    'picture',
    'graphic',
    'video',
    'videography',
    'webstory'
  ]),
  headline: z.string().optional(),
  source: z.string().optional(),
  title: z.string().optional(),
  creditLine: z.string().optional(),
  aspectRatios: z.string().array().optional(),
  news: z.string().array().default([]),
  caption: z.string().array().optional(),
  urgency: z.number(),
  genre: z.union([
    z.string().array().nonempty().transform(d => d[0]),
    z.string()
  ]).optional(),
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
  status: z.enum(['Usable', 'Canceled', 'Embargoed', 'WithHeld']),
  signal: SignalInput.optional(),
  hopHistory: HopHistorySchema.optional(),
  bagItem: z.array(BagItemSchema).default([])
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
    renditions: bagItem.medias
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

function extractBase (doc: DocumentSource): Omit<AfpDocument, 'headline' | 'paragraphs' | 'medias'> {
  return {
    uno: doc.uno,
    shortId: doc.afpshortid,
    class: doc.class,
    source: doc.source,
    lang: doc.lang,
    country: { id: doc.country, name: doc.countryname },
    city: doc.city,
    creator: doc.creator,
    provider: doc.provider,
    genre: doc.genre,
    urgency: doc.urgency,
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
    aspectRatios: doc.aspectRatios
  }
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
        headline,
        paragraphs,
        medias: [],
        hasBeenAlerted: extractHasBeenAlerted(doc)
      }
    }
    case 'multimedia': {
      const { headline, paragraphs } = extractTextParagraphs(doc)
      return {
        ...base,
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
        headline: doc.headline,
        paragraphs: [],
        medias: doc.bagItem.map(extractMedia),
        topshot: doc.urgency === 1
      }
    case 'video':
    case 'videography':
      return {
        ...base,
        headline: doc.headline,
        paragraphs: [],
        medias: doc.bagItem.map(extractMedia),
        caption: doc.caption?.[0] ?? '',
        shots: extractShots(doc.news)
      }
    case 'webstory':
      return {
        ...base,
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
