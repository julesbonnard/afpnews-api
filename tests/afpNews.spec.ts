import AfpNews from '../src/afpnews-api'
import { Params } from '../src/types'

require('dotenv').config()

const {
  AFPNEWS_API_KEY: apiKey,
  AFPNEWS_CLIENT_ID: clientId,
  AFPNEWS_CLIENT_SECRET: clientSecret,
  AFPNEWS_USERNAME: username,
  AFPNEWS_PASSWORD: password,
  AFPNEWS_CUSTOM_AUTH_URL: customAuthUrl
} = process.env

describe('AFP News', () => {
  describe('Initialization', () => {
    test('should return true when afpNews is instance of AfpNews', () => {
      const afpNews = new AfpNews()
      expect(afpNews instanceof AfpNews).toBeTruthy()
    })
    test('should reset token on init', () => {
      const afpNews = new AfpNews()
      expect(afpNews.token).toBeUndefined()
    })
    test('should allow to change base url in constructor', () => {
      const afpNews = new AfpNews({ baseUrl: 'http://customBase' })
      expect(afpNews.authUrl.includes('http://customBase')).toBeTruthy()
    })
    test('should return the api url', () => {
      const afpNews = new AfpNews()
      expect(typeof afpNews.apiUrl).toBe('string')
    })
  })
  describe('Authentication', () => {
    test(
      'should return an anonymous token when called without api key',
      async () => {
        const afpNews = new AfpNews()
        const token = await afpNews.authenticate()
        expect(typeof token.accessToken).toBe('string')
        expect(typeof token.refreshToken).toBe('string')
        expect(typeof token.tokenExpires).toBe('number')
        expect(token.authType).toBe('anonymous')
        expect(token).toEqual(afpNews.token)
        const newToken = await afpNews.authenticate()
        expect(newToken).toEqual(token)
      }
    )
    test(
      'should throw if called with api key but without credentials',
      () => {
        const afpNews = new AfpNews({ apiKey })
        return expect(afpNews.authenticate()).rejects.toEqual(new Error('You need to authenticate with credentials once'))
      }
    )
    test(
      'should throw if called with credentials but without api key',
      () => {
        const afpNews = new AfpNews()
        return expect(afpNews.authenticate({ username: 'TEST', password: 'TEST' })).rejects.toEqual(new Error('You need an api key to make authenticated requests'))
      }
    )
    test(
      'should throw if called with api key and wrong credentials',
      async () => {
        const afpNews = new AfpNews({ apiKey })
        return expect(afpNews.authenticate({ username: 'TEST', password: 'TEST' })).rejects.toEqual(new Error('Invalid token'))
      }
    )
    test(
      'should return an authenticated token when called with api key and credentials',
      async () => {
        const afpNews = new AfpNews({ apiKey })
        const token = await afpNews.authenticate({ username, password })
        expect(typeof token.accessToken).toBe('string')
        expect(typeof token.refreshToken).toBe('string')
        expect(typeof token.tokenExpires).toBe('number')
        expect(token.authType).toBe('credentials')
        expect(token).toEqual(afpNews.token)
      }
    )
    test(
      'should return an authenticated token when called with client id and client secret',
      async () => {
        const afpNews = new AfpNews({ clientId, clientSecret })
        const token = await afpNews.authenticate({ username, password })
        expect(typeof token.accessToken).toBe('string')
        expect(typeof token.refreshToken).toBe('string')
        expect(typeof token.tokenExpires).toBe('number')
        expect(token.authType).toBe('credentials')
        expect(token).toEqual(afpNews.token)
      }
    )
    test('should authorization headers be an empty object when token is not set and use customAuthUrl', () => {
      const afpNews = new AfpNews({
        customAuthUrl
      })
      expect(afpNews.authorizationBearerHeaders).toEqual({})
    })
    test('should return an authenticated token when called without apiKey but credentials and a custom auth url', async () => {
      const afpNews = new AfpNews()
      afpNews.credentials = { customAuthUrl }
      expect(afpNews.authUrl).toBe(customAuthUrl)
      const token = await afpNews.authenticate({ username, password })
      expect(typeof token.accessToken).toBe('string')
      expect(typeof token.refreshToken).toBe('string')
      expect(typeof token.tokenExpires).toBe('number')
      expect(token.authType).toBe('credentials')
      expect(token).toEqual(afpNews.token)
    })
    test('should refresh token when token expires with api key', async () => {
      const afpNews = new AfpNews({ clientId, clientSecret })
      const token = await afpNews.authenticate({ username, password })
      expect(token.authType).toBe('credentials')
      afpNews.token = { ...token, tokenExpires: 0 }
      const newToken = await afpNews.authenticate()
      expect(newToken.accessToken).not.toEqual(token.accessToken)
      expect(newToken.authType).toBe('credentials')
    })
    test('should refresh token when token expires with custom auth url', async () => {
      const afpNews = new AfpNews({ customAuthUrl })
      const token = await afpNews.authenticate({ username, password })
      expect(token.authType).toBe('credentials')
      afpNews.token = { ...token, tokenExpires: 0 }
      const newToken = await afpNews.authenticate()
      expect(newToken.accessToken).not.toEqual(token.accessToken)
      expect(newToken.authType).toBe('credentials')
    })
    test('should not refresh token when token is valid', async () => {
      const afpNews = new AfpNews({ clientId, clientSecret })
      const token = await afpNews.authenticate({ username, password })
      const newToken = await afpNews.authenticate()
      expect(token.accessToken).toEqual(newToken.accessToken)
      expect(token.authType).toBe('credentials')
    })
    test('should allow to delete token', async () => {
      const afpNews = new AfpNews()
      await afpNews.authenticate()
      afpNews.resetToken()
      expect(afpNews.token).toBeUndefined()
    })
    test('should allow to save token', done => {
      const afpNews = new AfpNews({
        saveToken: token => {
          expect(token).toEqual(afpNews.token)
          done()
        }
      })
      afpNews.authenticate()
    })
  })
  describe('Search', () => {
    test('should return the default search params', () => {
      const afpNews = new AfpNews()
      expect(Object.keys(afpNews.defaultSearchParams).sort()).toEqual([
        'langs',
        'urgencies',
        'query',
        'size',
        'dateFrom',
        'dateTo',
        'sortField',
        'sortOrder',
        'products'
      ].sort())
    })
    test(
      'should return a news array with anonymous token, without explicit call to authenticate',
      async () => {
        const afpNews = new AfpNews()
        const news = await afpNews.search()
        expect(Array.isArray(news.documents)).toBeTruthy()
        expect(typeof news.count).toBe('number')
      }
    )
    test('should return a news array with authenticated token', async () => {
      const afpNews = new AfpNews({ clientId, clientSecret })
      await afpNews.authenticate({ username, password })
      const news = await afpNews.search()
      expect(news.documents.length).toBeLessThanOrEqual(afpNews.defaultSearchParams.size)
      expect(news.documents.length).toBeGreaterThanOrEqual(1)
      expect(news.count).toBeGreaterThanOrEqual(news.documents.length)
    })
    test('should react to custom params', async () => {
      const afpNews = new AfpNews({ clientId, clientSecret })
      await afpNews.authenticate({ username, password })
      const customParams: Params = {
        dateFrom: 'now-1M',
        dateTo: 'now-1d',
        langs: ['fr'],
        urgencies: [3],
        size: 15,
        sortField: 'published',
        sortOrder: 'asc',
        products: ['news']
      }
      const news = await afpNews.search(customParams)
      expect(news.documents.length).toBeGreaterThanOrEqual(1)
      expect(news.documents.length).toBeLessThanOrEqual(customParams.size)
      expect(news.count).toBeGreaterThanOrEqual(news.documents.length)
      const firstDocument = news.documents[0]
      expect(typeof firstDocument).toBe('object')
      expect(firstDocument.lang).toBe(customParams.langs[0])
      expect(firstDocument.urgency).toBe(customParams.urgencies[0])
      const lastDocument = news.documents[news.documents.length - 1]
      expect(+new Date(firstDocument.published)).toBeLessThan(+new Date(lastDocument.published))
      expect(+new Date(firstDocument.published)).toBeLessThan(+new Date(Date.now() - 2419200)) // now-1M
      expect(+new Date(lastDocument.published)).toBeLessThan(+new Date(Date.now() - 86400)) // now-1d
    })
  })
  describe('Get', () => {
    test('should return a document when authenticated', async () => {
      const afpNews = new AfpNews({ clientId, clientSecret })
      await afpNews.authenticate({ username, password })
      const uno = 'newsmlmmd.urn.newsml.afp.com.20190131.doc.1cw5ie'
      const news = await afpNews.get(uno)
      expect(typeof news.document).toBe('object')
      expect(news.document.uno).toEqual(uno)
    })
  })
})
