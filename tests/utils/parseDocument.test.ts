import { describe, it, expect, vi } from 'vitest'
import { parseDocument, safeParseDocument } from '../../src/utils/parseDocument'
import * as shotlist from '../../src/utils/shotlist'

const BASE = {
  uno: 'newsml.afp.com.20240315T143000Z.doc-abc12',
  afpshortid: 'ABC1234',
  created: '2024-03-15T14:30:00Z',
  published: '2024-03-15T14:30:00Z',
  lang: 'fr',
  revision: 1,
  provider: 'AFP',
  status: 'Usable'
}

const TEXT_DOC = {
  ...BASE,
  class: 'text',
  news: ['Titre du document', 'Premier paragraphe', 'Deuxième paragraphe'],
  urgency: 4,
  genre: 'General'
}

const PICTURE_DOC = {
  ...BASE,
  class: 'picture',
  urgency: 4,
  caption: ['Une photo'],
  bagItem: [
    {
      uno: 'pic-uno',
      caption: 'Une photo',
      newslines: { dateline: 'Paris' },
      medias: [
        {
          role: 'Thumbnail',
          width: 150,
          height: 100,
          href: 'https://example.com/thumb.jpg',
          type: 'Photo'
        },
        {
          role: 'HighDef',
          width: 2000,
          height: 1500,
          href: 'https://example.com/photo.jpg',
          type: 'Photo'
        }
      ]
    }
  ]
}

const VIDEO_DOC = {
  ...BASE,
  class: 'video',
  urgency: 2,
  caption: ['Un extrait vidéo'],
  bagItem: [
    {
      uno: 'vid-uno',
      newslines: { dateline: 'Londres' },
      medias: [
        {
          role: 'HighDef',
          width: 1920,
          height: 1080,
          href: 'https://example.com/video.mp4',
          type: 'Video'
        },
        {
          role: 'Thumbnail',
          width: 150,
          height: 100,
          href: 'https://example.com/thumb.jpg',
          type: 'Photo'
        }
      ]
    }
  ]
}

const MULTIMEDIA_DOC = {
  ...BASE,
  class: 'multimedia',
  news: ['Titre multimédia', 'Paragraphe unique'],
  urgency: 3,
  topic: ['culture'],
  bagItem: VIDEO_DOC.bagItem
}

const WEBSTORY_DOC = {
  ...BASE,
  class: 'webstory',
  urgency: 4,
  href: 'https://example.com/webstory',
  bagItem: PICTURE_DOC.bagItem
}

describe('parseDocument', () => {
  it('throws for an unknown class', () => {
    expect(() => parseDocument({ ...BASE, class: 'unknown' })).toThrow()
  })

  it('throws for non-object input', () => {
    expect(() => parseDocument(null)).toThrow()
    expect(() => parseDocument(42)).toThrow()
  })

  describe('base fields', () => {
    it('parses identity, dates and country', () => {
      const doc = parseDocument(TEXT_DOC)
      expect(doc.uno).toBe(BASE.uno)
      expect(doc.lang).toBe('fr')
      expect(doc.published).toBeInstanceOf(Date)
      expect(doc.created).toBeInstanceOf(Date)
      expect(doc.country).toEqual({ id: undefined, name: undefined })
    })

    it('uppercases shortId', () => {
      const doc = parseDocument({ ...TEXT_DOC, afpshortid: 'abc1234' })
      expect(doc.shortId).toBe('ABC1234')
    })

    it('passes through source when present', () => {
      const doc = parseDocument({ ...TEXT_DOC, source: 'AFP' })
      expect(doc.source).toBe('AFP')
    })

    it('leaves source undefined when absent', () => {
      const doc = parseDocument(TEXT_DOC)
      expect(doc.source).toBeUndefined()
    })

    it('passes through title, creditLine and aspectRatios when present', () => {
      const doc = parseDocument({
        ...TEXT_DOC,
        title: 'CRICKET-SRI-IND-TEST',
        creditLine: 'ISHARA S. KODIKARA / AFP',
        aspectRatios: ['afparatio:horizontal']
      })
      expect(doc.title).toBe('CRICKET-SRI-IND-TEST')
      expect(doc.creditLine).toBe('ISHARA S. KODIKARA / AFP')
      expect(doc.aspectRatios).toEqual(['afparatio:horizontal'])
    })

    it('extracts events from afpentity', () => {
      const doc = parseDocument({
        ...TEXT_DOC,
        afpentity: { event: [{ qcode: 'afpevent:123', keyword: 'event:Olympic Games' }] }
      })
      expect(doc.events).toEqual([{ id: '123', name: 'Olympic Games' }])
    })

    it('normalises signal: correction takes priority', () => {
      const doc = parseDocument({ ...TEXT_DOC, signal: ['correction', 'update'] })
      expect(doc.signal).toBe('correction')
    })

    it('normalises signal: update wins when no correction', () => {
      const doc = parseDocument({ ...TEXT_DOC, signal: 'update' })
      expect(doc.signal).toBe('update')
    })

    it('throws for an unrecognised signal', () => {
      expect(() => parseDocument({ ...TEXT_DOC, signal: 'other' })).toThrow()
    })

    it('accepts several signals on the same document (prod: ["update", "cwarn"])', () => {
      const doc = parseDocument({ ...TEXT_DOC, signal: ['update', 'cwarn'] })
      expect(doc.signal).toBe('update')
    })

    it('normalises the status casing (facet values are lowercase)', () => {
      expect(parseDocument({ ...TEXT_DOC, status: 'canceled' }).status).toBe('Canceled')
      expect(parseDocument({ ...TEXT_DOC, status: 'withheld' }).status).toBe('WithHeld')
    })

    it('treats an empty status as Usable, as documented', () => {
      expect(parseDocument({ ...TEXT_DOC, status: '' }).status).toBe('Usable')
    })

    it('throws for an unknown status', () => {
      expect(() => parseDocument({ ...TEXT_DOC, status: 'Withdrawn' })).toThrow()
    })

    it('normalises signal: cwarn alone yields undefined (not part of AfpDocumentSignal)', () => {
      // A valid raw signal, but AfpDocumentSignal only models
      // 'correction' | 'update' — cwarn (content warning) is deliberately not surfaced here.
      const doc = parseDocument({ ...TEXT_DOC, signal: 'cwarn' })
      expect(doc.signal).toBeUndefined()
    })

    it('accepts a non-empty genre array and keeps only the first value', () => {
      const doc = parseDocument({ ...TEXT_DOC, genre: ['General', 'Sport'] })
      expect(doc.genre).toBe('General')
    })

    it('passes through wordCount when present', () => {
      const doc = parseDocument({ ...TEXT_DOC, wordCount: 536 })
      expect(doc.wordCount).toBe(536)
    })

    it('leaves wordCount undefined when absent', () => {
      const doc = parseDocument(TEXT_DOC)
      expect(doc.wordCount).toBeUndefined()
    })
  })

  describe('text / factcheck', () => {
    it('uses the first news line as headline when urgency < 4 and no headline', () => {
      const doc = parseDocument({ ...TEXT_DOC, headline: undefined, urgency: 3 })
      expect(doc.headline).toBe('Titre du document')
      expect(doc.paragraphs).toEqual([
        { index: 0, text: 'Premier paragraphe' },
        { index: 1, text: 'Deuxième paragraphe' }
      ])
    })

    it('keeps all news lines as paragraphs when headline is already set', () => {
      const doc = parseDocument({ ...TEXT_DOC, headline: 'Mon titre', urgency: 4 })
      expect(doc.headline).toBe('Mon titre')
      expect(doc.paragraphs).toEqual(
        TEXT_DOC.news.map((text, index) => ({ index, text }))
      )
    })

    it('parses a factcheck document as class factcheck', () => {
      const doc = parseDocument({ ...TEXT_DOC, class: 'factcheck' })
      expect(doc.class).toBe('factcheck')
    })

    it('has no medias', () => {
      const doc = parseDocument(TEXT_DOC)
      expect(doc.medias).toEqual([])
    })

    it('extracts the medias of a factcheck from bagItem', () => {
      const doc = parseDocument({ ...TEXT_DOC, class: 'factcheck', bagItem: PICTURE_DOC.bagItem })
      expect(doc.medias).toHaveLength(1)
      expect(doc.medias[0]?.uno).toBe('pic-uno')
      expect(doc.medias[0]?.caption).toBe('Une photo')
    })

    it('reports hasBeenAlerted when the doc went through flash/alert/urgent', () => {
      const doc = parseDocument({
        ...TEXT_DOC,
        urgency: 4,
        hopHistory: {
          hop: [{ action: [{ uri: 'urn:...validatedAsFlashOrAlertOrUrgent...' }] }]
        }
      })
      expect(doc.hasBeenAlerted).toBe(true)
    })

    it('does not report hasBeenAlerted for flash/alert/urgent docs themselves', () => {
      const doc = parseDocument({
        ...TEXT_DOC,
        urgency: 1,
        hopHistory: {
          hop: [{ action: [{ uri: 'urn:...validatedAsFlashOrAlertOrUrgent...' }] }]
        }
      })
      expect(doc.hasBeenAlerted).toBe(false)
    })
  })

  describe('picture / graphic', () => {
    it('extracts the media renditions', () => {
      const doc = parseDocument(PICTURE_DOC)
      expect(doc.medias).toHaveLength(1)
      expect(doc.medias[0]).toMatchObject({
        uno: 'pic-uno',
        caption: 'Une photo',
        dateline: 'Paris'
      })
      expect(doc.medias[0]?.renditions).toHaveLength(2)
    })

    it('keeps renditions whose type is Graphic (infographics)', () => {
      const doc = parseDocument({
        ...PICTURE_DOC,
        class: 'graphic',
        bagItem: [
          {
            ...PICTURE_DOC.bagItem[0],
            medias: PICTURE_DOC.bagItem[0].medias.map(m => ({ ...m, type: 'Graphic' }))
          }
        ]
      })
      expect(doc.medias[0]?.renditions).toHaveLength(2)
      expect(doc.medias[0]?.renditions[0]?.type).toBe('Graphic')
    })

    it('has no paragraphs', () => {
      const doc = parseDocument(PICTURE_DOC)
      expect(doc.paragraphs).toEqual([])
    })

    it('marks topshot false for non-urgent pictures', () => {
      const doc = parseDocument(PICTURE_DOC)
      expect(doc.topshot).toBe(false)
    })

    it('marks topshot from the AFP Forum rating (value 60), not from urgency', () => {
      const topshot = { ratingtype: 'afpratingtype:afpforum', scalemax: 100, value: 60, scaleunit: 'rscaleunit:mscale', scalemin: 0 }
      expect(parseDocument({ ...PICTURE_DOC, urgency: 5, rating: [topshot] }).topshot).toBe(true)
      // urgency 1 = Flash : des milliers de photos par semaine, pas des TOPSHOTS
      expect(parseDocument({ ...PICTURE_DOC, urgency: 1 }).topshot).toBe(false)
      // sélection ESSENTIALS (producer, 3 étoiles) : pas un TOPSHOT
      const essentials = { ratingtype: 'afpratingtype:producer', scalemax: 5, value: 3, scaleunit: 'rscaleunit:star', scalemin: 0 }
      expect(parseDocument({ ...PICTURE_DOC, rating: [essentials] }).topshot).toBe(false)
    })

    it('parses a graphic class the same way as picture', () => {
      const doc = parseDocument({ ...PICTURE_DOC, class: 'graphic' })
      expect(doc.class).toBe('graphic')
      expect(doc.medias).toHaveLength(1)
    })

    it('reads caption from the document field, like video does', () => {
      const doc = parseDocument(PICTURE_DOC)
      expect(doc.caption).toBe('Une photo')
    })

    it('falls back to the bagItem caption when the document field is absent', () => {
      const { caption: _caption, ...docWithoutCaption } = PICTURE_DOC
      const doc = parseDocument(docWithoutCaption)
      expect(doc.caption).toBe('Une photo')
    })

    it('leaves caption undefined when neither the document nor bagItem has one', () => {
      const { caption: _caption, ...docWithoutCaption } = PICTURE_DOC
      const doc = parseDocument({
        ...docWithoutCaption,
        bagItem: [{ ...docWithoutCaption.bagItem[0], caption: undefined }]
      })
      expect(doc.caption).toBeUndefined()
    })
  })

  describe('rights, lifecycle and classification (shapes observed in prod)', () => {
    const ENRICHED = {
      ...PICTURE_DOC,
      copyright: '2026 Getty Images',
      rules: ['GERMANY OUT'],
      usageRight: [{ phrase: 'JAPAN OUT', name: 'JAPAN_OUT' }],
      exclusion: [{ scheme: 'http://www.afp.com/format/internal/exclusion', name: 'Japan', type: 'http://cv.iptc.org/newscodes/cpnature/geoArea', uri: 'http://ref.afp.com/location/x', untilDate: '2026-12-31T00:00:00Z' }],
      country_out: ['GERMANY'],
      country_only: ['ALL'],
      expires: '2028-10-05T13:01:14Z',
      initialStatus: 'Usable',
      excludeAudiences: [{ qcode: 'cwarn:death', text: 'ViolentGraphicLanguage' }],
      genre: ['Actualité', 'Reportage'],
      genreid: ['afpedtype:Raw', 'afpedtype:SinglePage'],
      summary: ['TOKYO, JAPAN - OCTOBER 05: …'],
      subheadline: 'Foto vorhanden\n',
      captionContext: 'The US Supreme Court hears a climate case',
      channel: ['/wires/AFP-FORUM', '/wires/public/PARTNER-PHOTO'],
      mediatopic: ['20001065', '15000000']
    }

    it('exposes rights and mandatory mentions', () => {
      const doc = parseDocument(ENRICHED)
      expect(doc.copyright).toBe('2026 Getty Images')
      expect(doc.rules).toEqual(['GERMANY OUT'])
      expect(doc.usageRights).toEqual([{ phrase: 'JAPAN OUT', name: 'JAPAN_OUT' }])
      expect(doc.exclusions).toEqual([{ name: 'Japan', type: 'http://cv.iptc.org/newscodes/cpnature/geoArea', untilDate: new Date('2026-12-31T00:00:00Z') }])
      expect(doc.countriesOut).toEqual(['GERMANY'])
      expect(doc.countriesOnly).toEqual(['ALL'])
      expect(doc.expires).toEqual(new Date('2028-10-05T13:01:14Z'))
    })

    it('exposes lifecycle and content warnings', () => {
      const doc = parseDocument(ENRICHED)
      expect(doc.initialStatus).toBe('Usable')
      expect(doc.contentWarnings).toEqual([{ code: 'cwarn:death', label: 'ViolentGraphicLanguage' }])
    })

    it('splits genreid into cumulative editorial types (afpedtype) and a single attribute (afpattribute)', () => {
      const video = parseDocument({ ...VIDEO_DOC, genreid: ['afpedtype:videoAFPTVGeneral', 'afpedtype:Broadcast', 'afpedtype:Images', 'afpattribute:Report'] })
      expect(video.editorialTypes).toEqual(['afpedtype:videoAFPTVGeneral', 'afpedtype:Broadcast', 'afpedtype:Images'])
      expect(video.editorialAttribute).toBe('afpattribute:Report')

      const text = parseDocument({ ...TEXT_DOC, genreid: 'afpedtype:Lead' })
      expect(text.editorialTypes).toEqual(['afpedtype:Lead'])
      expect(text.editorialAttribute).toBeUndefined()
    })

    it('exposes ratings', () => {
      const doc = parseDocument({ ...PICTURE_DOC, rating: [{ ratingtype: 'afpratingtype:producer', scalemax: 5, value: 3, scaleunit: 'rscaleunit:star', scalemin: 0 }] })
      expect(doc.ratings).toEqual([{ type: 'afpratingtype:producer', value: 3, scaleMin: 0, scaleMax: 5, unit: 'rscaleunit:star' }])
    })

    it('keeps every genre and genreid, a string or a list depending on the class', () => {
      const doc = parseDocument(ENRICHED)
      expect(doc.genre).toBe('Actualité')
      expect(doc.genres).toEqual(['Actualité', 'Reportage'])
      expect(doc.genreIds).toEqual(['afpedtype:Raw', 'afpedtype:SinglePage'])
      expect(parseDocument({ ...TEXT_DOC, genre: 'Lead', genreid: 'afpedtype:Lead' }).genreIds).toEqual(['afpedtype:Lead'])
    })

    it('exposes classification and context fields', () => {
      const doc = parseDocument(ENRICHED)
      expect(doc.summary).toEqual(['TOKYO, JAPAN - OCTOBER 05: …'])
      expect(doc.subheadline).toBe('Foto vorhanden')
      expect(doc.captionContext).toBe('The US Supreme Court hears a climate case')
      expect(doc.channels).toEqual(['/wires/AFP-FORUM', '/wires/public/PARTNER-PHOTO'])
      expect(doc.mediatopics).toEqual(['20001065', '15000000'])
    })

    it('never rejects a document because of a malformed enriched field', () => {
      const doc = parseDocument({ ...PICTURE_DOC, rules: 42, usageRight: 'JAPAN OUT', exclusion: [{ type: 'no name' }], expires: 'not a date', rating: 'x', excludeAudiences: {} })
      expect(doc.rules).toBeUndefined()
      expect(doc.usageRights).toBeUndefined()
      expect(doc.exclusions).toBeUndefined()
      expect(doc.expires).toBeUndefined()
      expect(doc.contentWarnings).toBeUndefined()
      expect(doc.topshot).toBe(false)
    })

    it('leaves the new fields undefined when absent', () => {
      const doc = parseDocument(PICTURE_DOC)
      expect(doc.copyright).toBeUndefined()
      expect(doc.contentWarnings).toBeUndefined()
      expect(doc.genres).toBeUndefined()
    })
  })

  describe('video / videography', () => {
    it('parses the caption (first line)', () => {
      const doc = parseDocument({ ...VIDEO_DOC, caption: ['Premiere ligne', 'Seconde ligne'] })
      expect(doc.caption).toBe('Premiere ligne')
    })

    it('prefers captionContext (same caption without the trailing STOCKSHOTS marker)', () => {
      const doc = parseDocument({
        ...VIDEO_DOC,
        caption: ['STOCKSHOTS of the international terminals at King Khalid International Airport in Riyadh. STOCKSHOTS'],
        captionContext: 'STOCKSHOTS of the international terminals at King Khalid International Airport in Riyadh.'
      })
      expect(doc.caption).toBe('STOCKSHOTS of the international terminals at King Khalid International Airport in Riyadh.')
    })

    it('keeps duration and rendition on video components', () => {
      const doc = parseDocument({
        ...VIDEO_DOC,
        bagItem: [{ uno: 'v', medias: [{ duration: 55, role: 'Mpeg4-640x360_W', sizeInBytes: 7255427, rendition: 'afpveprnd:VID_MP4_H264_640x360p25_W', width: 640, type: 'Video', height: 360, href: 'https://example.com/v.mp4' }] }]
      })
      expect(doc.medias[0]?.renditions[0]).toMatchObject({ duration: 55, rendition: 'afpveprnd:VID_MP4_H264_640x360p25_W' })
    })

    it('falls back to an empty caption when caption is absent', () => {
      const { caption: _caption, ...docWithoutCaption } = VIDEO_DOC
      const doc = parseDocument(docWithoutCaption)
      expect(doc.caption).toBe('')
    })

    it('extracts the media renditions split by role', () => {
      const doc = parseDocument(VIDEO_DOC)
      expect(doc.medias).toHaveLength(1)
      expect(doc.medias[0]?.uno).toBe('vid-uno')
      expect(doc.medias[0]?.dateline).toBe('Londres')
      expect(doc.medias[0]?.renditions).toHaveLength(2)
    })

    it('passes through sizeInBytes on renditions when present', () => {
      const doc = parseDocument({
        ...VIDEO_DOC,
        bagItem: [
          {
            ...VIDEO_DOC.bagItem[0],
            medias: VIDEO_DOC.bagItem[0].medias.map(m => ({ ...m, sizeInBytes: 13684554 }))
          }
        ]
      })
      expect(doc.medias[0]?.renditions[0]?.sizeInBytes).toBe(13684554)
    })

    it('defaults shots to an empty array when news is absent', () => {
      const doc = parseDocument(VIDEO_DOC)
      expect(doc.shots).toEqual([])
    })

    it('falls back to an empty array instead of throwing when parseShotList fails', () => {
      vi.spyOn(shotlist, 'parseShotList').mockImplementation(() => {
        throw new Error('malformed shot list')
      })
      const doc = parseDocument({ ...VIDEO_DOC, news: ['whatever'] })
      expect(doc.shots).toEqual([])
      vi.restoreAllMocks()
    })

    it('exposes script and associatedWith for a video', () => {
      const doc = parseDocument({ ...VIDEO_DOC, script: ['El Nobel de Medicina premió el lunes…'], associatedWith: ['http://doc.afp.com/D2763T7'] })
      expect(doc.script).toEqual(['El Nobel de Medicina premió el lunes…'])
      expect(doc.associatedWith).toEqual(['http://doc.afp.com/D2763T7'])
    })

    it('parses the shot list from news', () => {
      const doc = parseDocument({
        ...VIDEO_DOC,
        news: [
          '1. 00:00-00:12 Vue aérienne de la ville',
          '2. 00:12-00:30 SOUNDBITE 1 - Jean Dupont, témoin',
          '"Tout a commencé très vite"'
        ]
      })
      expect(doc.shots).toHaveLength(2)
      expect(doc.shots?.[0]).toMatchObject({
        numero: 1,
        startSec: 0,
        endSec: 12,
        description: 'Vue aérienne de la ville'
      })
      expect(doc.shots?.[1]?.citations).toEqual([{ text: 'Tout a commencé très vite' }])
    })

    it('parses a videography class the same way as video', () => {
      const doc = parseDocument({ ...VIDEO_DOC, class: 'videography' })
      expect(doc.class).toBe('videography')
    })
  })

  describe('multimedia', () => {
    it('parses paragraphs like text and medias for each bag item', () => {
      const doc = parseDocument(MULTIMEDIA_DOC)
      expect(doc.headline).toBe('Titre multimédia')
      expect(doc.paragraphs).toEqual([{ index: 0, text: 'Paragraphe unique' }])
      expect(doc.medias).toHaveLength(1)
      expect(doc.topics).toEqual(['culture'])
    })
  })

  describe('webstory', () => {
    it('exposes href and medias', () => {
      const doc = parseDocument(WEBSTORY_DOC)
      expect(doc.href).toBe('https://example.com/webstory')
      expect(doc.medias).toHaveLength(1)
      expect(doc.paragraphs).toEqual([])
    })

    it('exposes every component in components, dimensionless ones included (Zip, ZipVideoSet, Mpeg4)', () => {
      const href = 'https://example.com/objects/x'
      const doc = parseDocument({
        ...WEBSTORY_DOC,
        bagItem: [{
          uno: 'ws-uno',
          medias: [
            { role: 'Zip', sizeInBytes: 8154286, rendition: 'application/zip', type: 'CompressedContent', href },
            { role: 'Preview', sizeInBytes: 8154286, rendition: 'rnd:preview', type: 'CompressedContent', href },
            { role: 'ZipVideoSet', sizeInBytes: 94343724, rendition: 'afprnd:videoset', type: 'CompressedContent', href },
            { role: 'Mpeg4', sizeInBytes: 94732183, rendition: 'afprnd:video', type: 'Video', href },
            { role: 'Thumbnail', sizeInBytes: 24134, rendition: 'rnd:thumbnail', width: 240, type: 'Photo', height: 320, href }
          ]
        }]
      })
      const media = doc.medias[0]
      // components : tout, dont les composants sans dimensions
      expect(media?.components.map(c => c.role)).toEqual(['Zip', 'Preview', 'ZipVideoSet', 'Mpeg4', 'Thumbnail'])
      expect(media?.components[0]).toEqual({ role: 'Zip', sizeInBytes: 8154286, rendition: 'application/zip', type: 'CompressedContent', href })
      // renditions : contrat inchangé, images et vidéos dimensionnées seulement
      expect(media?.renditions.map(r => r.role)).toEqual(['Thumbnail'])
      expect(media?.renditions[0]?.width).toBe(240)
    })
  })
})

describe('safeParseDocument', () => {
  it('returns the parsed document for a valid payload', () => {
    const doc = safeParseDocument(TEXT_DOC)
    expect(doc?.uno).toBe(TEXT_DOC.uno)
  })

  it('returns undefined instead of throwing for an invalid payload', () => {
    expect(safeParseDocument({ uno: 'incomplete' })).toBeUndefined()
  })
})
