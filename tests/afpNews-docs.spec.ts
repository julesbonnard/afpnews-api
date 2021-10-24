import dotenv from 'dotenv'
import AfpNews from '../src/afpnews-docs'
import { Params } from '../src/types'

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH })

const {
  AFPNEWS_BASE_URL: baseUrl,
  AFPNEWS_CLIENT_ID: clientId,
  AFPNEWS_CLIENT_SECRET: clientSecret,
  AFPNEWS_USERNAME: username,
  AFPNEWS_PASSWORD: password
} = process.env

describe('AFP News Search', () => {
  test('should return true when afpNews is instance of AfpNews', () => {
    const afpNews = new AfpNews()
    expect(afpNews instanceof AfpNews).toBeTruthy()
  })
  describe('Search', () => {
    test('should return the default search params', () => {
      const afpNews = new AfpNews({ baseUrl })
      expect(Object.keys(afpNews.defaultSearchParams).sort()).toEqual([
        'langs',
        'urgencies',
        'query',
        'size',
        'dateFrom',
        'dateTo',
        'sortField',
        'sortOrder',
        'products',
        'sources',
        'topics'
      ].sort())
    })
    test(
      'should return a news array with anonymous token, without explicit call to authenticate',
      async () => {
        const afpNews = new AfpNews({ baseUrl })
        const news = await afpNews.search()
        expect(Array.isArray(news.documents)).toBeTruthy()
        expect(typeof news.count).toBe('number')
      }
    )
    test('should return a news array with authenticated token', async () => {
      const afpNews = new AfpNews({ baseUrl, clientId, clientSecret })
      await afpNews.authenticate({ username, password })
      const news = await afpNews.search()
      expect(news.documents.length).toBeLessThanOrEqual(afpNews.defaultSearchParams.size as number)
      expect(news.documents.length).toBeGreaterThanOrEqual(1)
      expect(news.count).toBeGreaterThanOrEqual(news.documents.length)
    })
    test('should react to custom params', async () => {
      const afpNews = new AfpNews({ baseUrl, clientId, clientSecret })
      await afpNews.authenticate({ username, password })
      const customParams: Params = {
        dateFrom: 'now-1M',
        dateTo: 'now-1d',
        langs: ['fr'],
        urgencies: [3],
        size: 15,
        sortField: 'published',
        sortOrder: 'asc',
        products: ['news'],
        sources: ['afp'],
        topics: []
      }
      const news = await afpNews.search(customParams)
      expect(news.documents.length).toBeGreaterThanOrEqual(1)
      expect(news.documents.length).toBeLessThanOrEqual(customParams.size as number)
      expect(news.count).toBeGreaterThanOrEqual(news.documents.length)
      const firstDocument = news.documents[0]
      expect(typeof firstDocument).toBe('object')
      expect(firstDocument.lang).toBe((customParams.langs as string[])[0])
      expect(firstDocument.urgency).toBe((customParams.urgencies as number[])[0])
      const lastDocument = news.documents[news.documents.length - 1]
      expect(+new Date(firstDocument.published)).toBeLessThan(+new Date(lastDocument.published))
      expect(+new Date(firstDocument.published)).toBeLessThan(+new Date(Date.now() - 2419200)) // now-1M
      expect(+new Date(lastDocument.published)).toBeLessThan(+new Date(Date.now() - 86400)) // now-1d
    })
    test('should react to custom fields', async () => {
      const afpNews = new AfpNews({ baseUrl, clientId, clientSecret })
      await afpNews.authenticate({ username, password })
      const news = await afpNews.search(null, ['title'])
      expect(news.documents.length).toBeGreaterThanOrEqual(1)
      const firstDocument = news.documents[0]
      expect(typeof firstDocument).toBe('object')
      expect(Object.keys(firstDocument).sort()).toEqual(['title', 'published'].sort())
    })
    test('should work with multiple languages', async () => {
      const afpNews = new AfpNews({ baseUrl, clientId, clientSecret })
      await afpNews.authenticate({ username, password })
      const news = await afpNews.search({ langs: ['fr', 'en'], size: 100, products: ['news'] }, ['lang'])
      expect(news.documents.length).toBeGreaterThanOrEqual(1)
      const langs = news.documents.map(doc => doc.lang)
      expect(langs.includes('fr')).toBeTruthy()
      expect(langs.includes('en')).toBeTruthy()
    })
  })
  describe('Get', () => {
    test('should return a document when authenticated', async () => {
      const afpNews = new AfpNews({ baseUrl, clientId, clientSecret })
      await afpNews.authenticate({ username, password })
      const { documents } = await afpNews.search({
        dateTo: 'now-1d'
      })
      const uno = documents[0].uno
      const doc = await afpNews.get(uno)
      expect(typeof doc).toBe('object')
      expect(doc.uno).toEqual(uno)
    })
    test('should return an error when document doesn\'t exist', async () => {
      const afpNews = new AfpNews({ baseUrl, clientId, clientSecret })
      await afpNews.authenticate({ username, password })
      return expect(afpNews.get('unknown document')).rejects.toEqual(new Error('Document "unknown document" not found'))
    })
  })
  describe('Mlt', () => {
    test('should return some documents when authenticated', async () => {
      const afpNews = new AfpNews({ baseUrl, clientId, clientSecret })
      await afpNews.authenticate({ username, password })
      const news = await afpNews.mlt('newsmlmmd.afp.com.20201023T091339Z.doc-8tp28x', 'fr')
      expect(Array.isArray(news.documents)).toBeTruthy()
      expect(news.count).toBeGreaterThanOrEqual(1)
    })
  })
  describe('List', () => {
    test('should return some slugs', async () => {
      const afpNews = new AfpNews({ baseUrl, clientId, clientSecret })
      await afpNews.authenticate({ username, password })
      const news = await afpNews.list('slug')
      expect(Array.isArray(news.keywords)).toBeTruthy()
      expect(typeof news.keywords[0]).toBe('object')
      expect(typeof news.keywords[0].name).toBe('string')
      expect(news.keywords[0].count).toBeGreaterThanOrEqual(1)
    })
  })
})
