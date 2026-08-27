import { DocumentSourceSchema } from './utils/parseDocument.js'
import type { AfpDocument } from './types.js'

/** Tous les noms de champs bruts que l'API AFP peut renvoyer pour un document. */
export const AFP_RAW_FIELDS = DocumentSourceSchema.keyof().options

export type AfpRawField = typeof AFP_RAW_FIELDS[number]

/**
 * Pour chaque champ de `AfpDocument`, le ou les champs bruts de l'API AFP dont sa
 * construction dépend (voir `extractBase`/`parseDocument` dans `utils/parseDocument.ts`).
 * `satisfies Record<keyof AfpDocument, ...>` force une erreur de compilation si un champ
 * est ajouté à `AfpDocument` sans déclarer sa provenance ici.
 */
export const FIELD_SOURCES = {
  uno: ['uno'],
  shortId: ['afpshortid'],
  class: ['class'],
  source: ['source'],
  // `headline` peut être promu depuis la première ligne de `news` en dessous de urgency 4
  // (voir extractTextParagraphs) — superset volontaire, valable même quand ça ne s'applique pas.
  headline: ['headline', 'news', 'urgency'],
  paragraphs: ['news'],
  lang: ['lang'],
  country: ['country', 'countryname'],
  city: ['city'],
  creator: ['creator'],
  provider: ['provider'],
  genre: ['genre'],
  urgency: ['urgency'],
  events: ['afpentity'],
  slugs: ['slug'],
  keywords: ['keyword'],
  disclaimer: ['disclaimer'],
  advisory: ['advisory'],
  created: ['created'],
  published: ['published'],
  embargoed: ['embargoed'],
  revision: ['revision'],
  status: ['status'],
  signal: ['signal'],
  hasBeenAlerted: ['hopHistory', 'urgency'],
  medias: ['bagItem'],
  topics: ['topic'],
  topshot: ['urgency'],
  caption: ['caption'],
  shots: ['news'],
  href: ['href'],
  title: ['title'],
  creditLine: ['creditLine'],
  aspectRatios: ['aspectRatios']
} as const satisfies Record<keyof AfpDocument, readonly AfpRawField[]>

export type AfpField = keyof typeof FIELD_SOURCES

/**
 * Champs bruts sans lesquels `parseDocument()` ne peut structurellement pas construire de
 * document (dérivé de `DocumentSourceSchema` : tout champ qui refuse `undefined`), quels que
 * soient les champs demandés par l'appelant.
 */
export const MANDATORY_RAW_FIELDS = Object.entries(DocumentSourceSchema.shape)
  .filter(([, schema]) => !schema.safeParse(undefined).success)
  .map(([key]) => key) as AfpRawField[]

/**
 * Traduit une liste de champs `AfpDocument` publics en champs bruts à demander à l'API AFP,
 * en garantissant toujours le socle requis par `parseDocument()` en plus.
 */
export function toApiFields (fields: readonly AfpField[]): AfpRawField[] {
  return [...new Set<AfpRawField>([
    ...MANDATORY_RAW_FIELDS,
    ...fields.flatMap(f => FIELD_SOURCES[f])
  ])]
}
