export const defaultSearchParams = {
  dateFrom: '1980-01-01',
  dateTo: 'now',
  size: 10,
  sortField: 'published',
  sortOrder: 'desc' as const
}

export const defaultBaseUrl = 'https://afp-apicore-prod.afp.com'

export const maxRowsByRequest = 10000

import { TEXT_FIELDS } from './searchFields.js'

export const fullTextSearchFields: readonly string[] = ['all', ...TEXT_FIELDS]

export const translatedSearchFields: readonly string[] = ['all', 'news', 'title', 'headline', 'subheadline', 'caption', 'script']

export const langsWithTranslation = ['fr', 'en', 'es', 'de', 'pt', 'ar']

/**
 * Opt-in exclusion filter for AFP's Agenda/Program-type genres and attributes — content that
 * announces or schedules coverage rather than being publishable news itself. Not applied by
 * default: spread into a query's `genreid` facet filter when building an editorial feed, e.g.
 * `{ genreid: AGENDA_GENRE_EXCLUSIONS }` or merged alongside other `genreid` exclusions.
 */
export const AGENDA_GENRE_EXCLUSIONS = {
  exclude: [
    'afpgenre:Agenda',
    'afpattribute:Agenda',
    'afpattribute:Program',
    'afpattribute:TextProgram',
    'afpattribute:AdvisoryUpdate',
    'afpattribute:Advice',
    'afpattribute:SpecialAnnouncement',
    'afpattribute:PictureProgram'
  ]
}
