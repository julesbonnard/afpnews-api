import dotenv from 'dotenv'
import AfpNews from '../src/afpnews-topics'

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH })

const {
  AFPNEWS_BASE_URL: baseUrl,
  AFPNEWS_CLIENT_ID: clientId,
  AFPNEWS_CLIENT_SECRET: clientSecret,
  AFPNEWS_USERNAME: username,
  AFPNEWS_PASSWORD: password
} = process.env

describe('AFP News Topics', () => {
  test('should return some topics', async () => {
    const afpNews = new AfpNews({ baseUrl, clientId, clientSecret })
    await afpNews.authenticate({ username, password })
    const { topics } = await afpNews.topics('fr')
    expect(Array.isArray(topics)).toBeTruthy()
    expect(typeof topics[0]).toBe('string')
  })
  test('should return some doc ids', async () => {
    const afpNews = new AfpNews({ baseUrl, clientId, clientSecret })
    await afpNews.authenticate({ username, password })
    const { documents } = await afpNews.topicIndex('Sport', 'fr')
    expect(Array.isArray(documents)).toBeTruthy()
    expect(typeof documents[0].uno).toBe('string')
    expect(Array.isArray(documents[0].news)).toBeTruthy()
  })
  test('should return some doc ids, only previews', async () => {
    const afpNews = new AfpNews({ baseUrl, clientId, clientSecret })
    await afpNews.authenticate({ username, password })
    const { documents } = await afpNews.topicIndex('Sport', 'fr', true)
    expect(Array.isArray(documents)).toBeTruthy()
    expect(typeof documents[0].uno).toBe('string')
    expect(documents[0].news).toBeUndefined()
  })
  test('should return no docs when unauthentified', async () => {
    const afpNews = new AfpNews({ baseUrl })
    await afpNews.authenticate()
    const { documents } = await afpNews.topicIndex('Sport', 'fr')
    expect(Array.isArray(documents)).toBeTruthy()
    expect(documents.length).toEqual(0)
  })
  test('should return no docs when unauthentified, only previews', async () => {
    const afpNews = new AfpNews({ baseUrl })
    await afpNews.authenticate()
    const { documents } = await afpNews.topicIndex('Sport', 'fr', true)
    expect(Array.isArray(documents)).toBeTruthy()
    expect(documents.length).toEqual(0)
  })
  // test('should return some feed', async () => {
  //   const afpNews = new AfpNews({ baseUrl, clientId, clientSecret })
  //   await afpNews.authenticate({ username, password })
  //   const feed = await afpNews.topicFeed('Sport', 'fr')
  //   expect(typeof feed).toBe('string')
  // })
  test('should return some feed', async () => {
    const afpNews = new AfpNews({ baseUrl, clientId, clientSecret })
    await afpNews.authenticate({ username, password })
    const { documents } = await afpNews.topicFeed('Sport', 'fr')
    expect(Array.isArray(documents)).toBeTruthy()
    expect(typeof documents[0].uno).toBe('string')
  })
})
