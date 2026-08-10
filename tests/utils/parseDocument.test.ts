import { describe, it, expect } from 'vitest'
import { parseDocument } from '../../src/utils/parseDocument'

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

    it('has no paragraphs', () => {
      const doc = parseDocument(PICTURE_DOC)
      expect(doc.paragraphs).toEqual([])
    })

    it('marks topshot false for non-urgent pictures', () => {
      const doc = parseDocument(PICTURE_DOC)
      expect(doc.topshot).toBe(false)
    })

    it('marks topshot true for urgency 1 pictures', () => {
      const doc = parseDocument({ ...PICTURE_DOC, urgency: 1 })
      expect(doc.topshot).toBe(true)
    })

    it('parses a graphic class the same way as picture', () => {
      const doc = parseDocument({ ...PICTURE_DOC, class: 'graphic' })
      expect(doc.class).toBe('graphic')
      expect(doc.medias).toHaveLength(1)
    })
  })

  describe('video / videography', () => {
    it('parses the caption (first line)', () => {
      const doc = parseDocument({ ...VIDEO_DOC, caption: ['Premiere ligne', 'Seconde ligne'] })
      expect(doc.caption).toBe('Premiere ligne')
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

    it('defaults shots to an empty array when news is absent', () => {
      const doc = parseDocument(VIDEO_DOC)
      expect(doc.shots).toEqual([])
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
  })
})
