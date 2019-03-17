import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import AfpNews from '../src/afpnews-api'

chai.use(chaiAsPromised)
const expect = chai.expect
chai.should()

require('dotenv').config()

const {
  AFPNEWS_API_KEY: apiKey,
  AFPNEWS_CLIENT_ID: clientId,
  AFPNEWS_CLIENT_SECRET: clientSecret,
  AFPNEWS_USERNAME: username,
  AFPNEWS_PASSWORD: password
} = process.env

describe('AFP News', () => {
  describe('Initialization', () => {
    it('should return true when afpNews is instance of AfpNews', () => {
      const afpNews = new AfpNews()
      expect(afpNews instanceof AfpNews).to.be.true
    })
    it('should reset token on init', () => {
      const afpNews = new AfpNews()
      expect(afpNews.token).to.be.undefined
    })
    it('should allow to change base url in constructor', () => {
      const afpNews = new AfpNews({ baseUrl: 'http://customurl' })
      expect(afpNews.baseUrl).to.be.equal('http://customurl')
    })
    it('should accept an apiKey', () => {
      const afpNews = new AfpNews({ apiKey: 'TEST' })
      expect(afpNews.apiKey).to.be.equal('TEST')
    })
    it('should return the api url', () => {
      const afpNews = new AfpNews()
      expect(afpNews.apiUrl).to.be.a('string')
    })
  })
  describe('Authentication', () => {
    it('should return an anonymous token when called without api key', async () => {
      const afpNews = new AfpNews()
      const token = await afpNews.authenticate()
      expect(token.accessToken).to.be.a('string')
      expect(token.refreshToken).to.be.a('string')
      expect(token.tokenExpires).to.be.a('number')
      expect(token.authType).to.be.equal('anonymous')
      expect(token).to.deep.equal(afpNews.token)
    })
    it('should throw if called with api key but without credentials', async () => {
      const afpNews = new AfpNews({ apiKey })
      await afpNews.authenticate().should.be.rejectedWith(Error)
    })
    it('should throw if called with credentials but without api key', async () => {
      const afpNews = new AfpNews()
      await afpNews.authenticate({ username: 'TEST', password: 'TEST' }).should.be.rejectedWith(Error)
    })
    it('should return an authenticated token when called with api key and credentials', async () => {
      const afpNews = new AfpNews({ apiKey })
      const token = await afpNews.authenticate({ username, password })
      expect(token.accessToken).to.be.a('string')
      expect(token.refreshToken).to.be.a('string')
      expect(token.tokenExpires).to.be.a('number')
      expect(token.authType).to.be.equal('credentials')
      expect(token).to.deep.equal(afpNews.token)
    })
    it('should return an authenticated token when called with client id and client secret', async () => {
      const afpNews = new AfpNews({ clientId, clientSecret })
      const token = await afpNews.authenticate({ username, password })
      expect(token.accessToken).to.be.a('string')
      expect(token.refreshToken).to.be.a('string')
      expect(token.tokenExpires).to.be.a('number')
      expect(token.authType).to.be.equal('credentials')
      expect(token).to.deep.equal(afpNews.token)
    })
    it('should refresh token when token expires', async () => {
      const afpNews = new AfpNews({ apiKey })
      const token = await afpNews.authenticate({ username, password })
      afpNews.token = { ...token, tokenExpires: 0 }
      const newToken = await afpNews.authenticate()
      expect(token.accessToken).to.not.be.equal(newToken.accessToken)
      expect(token.authType).to.be.equal('credentials')
    })
    it('should not refresh token when token is valid', async () => {
      const afpNews = new AfpNews({ apiKey })
      const token = await afpNews.authenticate({ username, password })
      const newToken = await afpNews.authenticate()
      expect(token.accessToken).to.be.equal(newToken.accessToken)
      expect(token.authType).to.be.equal('credentials')
    })
  })
  describe('Search', async () => {
    it('should return the default search params', () => {
      const afpNews = new AfpNews()
      expect(afpNews.defaultSearchParams).to.have.all.keys(
        'langs',
        'urgencies',
        'query',
        'size',
        'dateFrom',
        'dateTo',
        'sortField',
        'sortOrder',
        'products'
      )
    })
    it('should return a news array with anonymous token, without explicit call to authenticate', async () => {
      const afpNews = new AfpNews()
      const news = await afpNews.search()
      expect(news.documents).to.be.an('array')
      expect(news.count).to.be.a('number')
    })
    it('should return a news array with authenticated token', async () => {
      const afpNews = new AfpNews({ apiKey })
      await afpNews.authenticate({ username, password })
      const news = await afpNews.search()
      expect(news.documents).to.have.lengthOf.within(1, afpNews.defaultSearchParams.size)
      expect(news.count).to.be.at.least(news.documents.length)
    })
    it('should react to custom params', async () => {
      const afpNews = new AfpNews({ apiKey })
      await afpNews.authenticate({ username, password })
      const customParams = {
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
      expect(news.documents).to.have.lengthOf.within(1, customParams.size)
      expect(news.count).to.be.at.least(news.documents.length)
      const firstDocument = news.documents[0]
      expect(firstDocument).to.be.an('object')
      expect(firstDocument.lang).to.be.equal(customParams.langs[0])
      expect(firstDocument.urgency).to.be.equal(customParams.urgencies[0])
      const lastDocument = news.documents[news.documents.length - 1]
      expect(new Date(firstDocument.published)).to.be.below(new Date(lastDocument.published))
      expect(new Date(firstDocument.published)).to.be.below(new Date(Date.now() - 2419200)) // now-1M
      expect(new Date(lastDocument.published)).to.be.below(new Date(Date.now() - 86400)) // now-1d
    })
  })
  describe('Get', async () => {
    it('should return a document when authenticated', async () => {
      const afpNews = new AfpNews({ apiKey })
      await afpNews.authenticate({ username, password })
      const uno = 'newsmlmmd.urn.newsml.afp.com.20190131.doc.1cw5ie'
      const news = await afpNews.get(uno)
      expect(news.document).to.be.an('object')
      expect(news.document.uno).to.be.equal(uno)
    })
  })
})
