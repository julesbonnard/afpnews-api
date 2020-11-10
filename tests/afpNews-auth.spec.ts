import dotenv from 'dotenv'
import AfpNews from '../src/afpnews-api'
import AfpNewsAuth from '../src/afpnews-auth'

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH })

const {
  AFPNEWS_BASE_URL: baseUrl,
  AFPNEWS_API_KEY: apiKey,
  AFPNEWS_CLIENT_ID: clientId,
  AFPNEWS_CLIENT_SECRET: clientSecret,
  AFPNEWS_USERNAME: username,
  AFPNEWS_PASSWORD: password,
  AFPNEWS_CUSTOM_AUTH_URL: customAuthUrl
} = process.env

describe('AFP News Auth', () => {
  describe('Initialization', () => {
    test('should return true when afpNews is instance of AfpNews', () => {
      const afpNews = new AfpNews()
      expect(afpNews instanceof AfpNews).toBeTruthy()
      const auth = new AfpNewsAuth()
      expect(auth instanceof AfpNewsAuth).toBeTruthy()
    })
    test('should reset token on init', () => {
      const afpNews = new AfpNews()
      expect(afpNews.token).toBeUndefined()
    })
    test('should allow to change base url in constructor', () => {
      const afpNews = new AfpNews({ baseUrl: 'http://customBase' })
      expect(afpNews.authUrl.includes('http://customBase')).toBeTruthy()
    })
  })
  describe('Authentication', () => {
    test(
      'should return an anonymous token when called without api key',
      async () => {
        const afpNews = new AfpNews({ baseUrl })
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
        const afpNews = new AfpNews({ baseUrl, apiKey })
        return expect(afpNews.authenticate()).rejects.toEqual(new Error('You need to authenticate with credentials once'))
      }
    )
    test(
      'should throw if called with credentials but without api key',
      () => {
        const afpNews = new AfpNews({ baseUrl })
        return expect(afpNews.authenticate({ username: 'TEST', password: 'TEST' })).rejects.toEqual(new Error('You need an api key to make authenticated requests'))
      }
    )
    test(
      'should throw if called with api key and wrong credentials',
      async () => {
        const afpNews = new AfpNews({ baseUrl, apiKey })
        return expect(afpNews.authenticate({ username: 'TEST', password: 'TEST' })).rejects.toEqual(new Error('Bad credentials'))
      }
    )
    test(
      'should return an authenticated token when called with api key and credentials',
      async () => {
        const afpNews = new AfpNews({ baseUrl, apiKey })
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
        const afpNews = new AfpNews({ baseUrl, clientId, clientSecret })
        const token = await afpNews.authenticate({ username, password })
        expect(typeof token.accessToken).toBe('string')
        expect(typeof token.refreshToken).toBe('string')
        expect(typeof token.tokenExpires).toBe('number')
        expect(token.authType).toBe('credentials')
        expect(token).toEqual(afpNews.token)
      }
    )
    test('should authorization headers be an empty object when token is not set and use customAuthUrl', () => {
      const afpNews = new AfpNews({ baseUrl, customAuthUrl })
      expect(afpNews.authorizationBearerHeaders).toEqual({})
    })
    test('should return an authenticated token when called without apiKey but credentials and a custom auth url', async () => {
      const afpNews = new AfpNews({ baseUrl, customAuthUrl })
      expect(afpNews.authUrl).toBe(customAuthUrl)
      const token = await afpNews.authenticate({ username, password })
      expect(typeof token.accessToken).toBe('string')
      expect(typeof token.refreshToken).toBe('string')
      expect(typeof token.tokenExpires).toBe('number')
      expect(token.authType).toBe('credentials')
      expect(token).toEqual(afpNews.token)
    })
    test('should refresh token when token expires with api key', async () => {
      const afpNews = new AfpNews({ baseUrl, clientId, clientSecret })
      const token = await afpNews.authenticate({ username, password })
      expect(token.authType).toBe('credentials')
      afpNews.token = { ...token, tokenExpires: 0 }
      const newToken = await afpNews.authenticate()
      expect(newToken.accessToken).not.toEqual(token.accessToken)
      expect(newToken.authType).toBe('credentials')
    })
    test('should refresh token when token expires with custom auth url', async () => {
      const afpNews = new AfpNews({ baseUrl, customAuthUrl })
      const token = await afpNews.authenticate({ username, password })
      expect(token.authType).toBe('credentials')
      afpNews.token = { ...token, tokenExpires: 0 }
      const newToken = await afpNews.authenticate()
      expect(newToken.accessToken).not.toEqual(token.accessToken)
      expect(newToken.authType).toBe('credentials')
    })
    test('should not refresh token when token is valid', async () => {
      const afpNews = new AfpNews({ baseUrl, clientId, clientSecret })
      const token = await afpNews.authenticate({ username, password })
      const newToken = await afpNews.authenticate()
      expect(token.accessToken).toEqual(newToken.accessToken)
      expect(token.authType).toBe('credentials')
    })
    test('should not refresh token when token is valid with custom auth url', async () => {
      const afpNews = new AfpNews({ baseUrl, customAuthUrl })
      const token = await afpNews.authenticate({ username, password })
      const newToken = await afpNews.authenticate()
      expect(token.accessToken).toEqual(newToken.accessToken)
      expect(token.authType).toBe('credentials')
    })
    test('should allow to delete token', async () => {
      const afpNews = new AfpNews({ baseUrl })
      await afpNews.authenticate()
      afpNews.resetToken()
      expect(afpNews.token).toBeUndefined()
    })
    test('should throw if sending an incorrect access token', async () => {
      const afpNews = new AfpNews({ baseUrl, clientId, clientSecret })
      const token = await afpNews.authenticate({ username, password })
      token.accessToken = 'false'
      afpNews.token = token
      return expect(afpNews.search()).rejects.toEqual(new Error('Invalid access token: false'))
    })
    test('should allow to save token', done => {
      const afpNews = new AfpNews({
        baseUrl,
        saveToken: token => {
          expect(token).toEqual(afpNews.token)
          done()
        }
      })
      afpNews.authenticate()
    })
  })
  // describe('User', () => {
  //   test('should get info about user', async () => {
  //     const afpNews = new AfpNews({ baseUrl, clientId, clientSecret })
  //     await afpNews.authenticate({ username, password })
  //     const info = await afpNews.me()
  //     expect(info.username).toEqual(username)
  //     expect(typeof info.email).toBe('string')
  //   })
  // })
})
