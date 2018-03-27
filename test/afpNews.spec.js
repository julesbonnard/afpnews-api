require('dotenv').config();

const chai = require('chai');
const expect = chai.expect;

const AfpNews = require('../');

const apiKey = process.env.AFPNEWS_API_KEY;
const clientId = process.env.AFPNEWS_CLIENT_ID;
const clientSecret = process.env.AFPNEWS_CLIENT_SECRET;
const username = process.env.AFPNEWS_USERNAME;
const password = process.env.AFPNEWS_PASSWORD;

describe('AFP News', function() {
  describe('Initialization', function() {
    it('should return true when afpNews is instance of AfpNews', function() {
      const afpNews = new AfpNews();
      expect(afpNews instanceof AfpNews).to.be.true;
    });
    it('should reset token on init', function() {
      const afpNews = new AfpNews();
      expect(afpNews.token).to.be.null;
    });
    it('should allow to change base url in constructor', function() {
      const afpNews = new AfpNews({ baseUrl: 'http://customurl' });
      expect(afpNews.baseUrl).to.be.equal('http://customurl');
    });
    it('should accept an apiKey', function() {
      const afpNews = new AfpNews({ apiKey: 'TEST' });
      expect(afpNews._apiKey).to.be.equal('TEST');
    });
  });
  describe('Authentication', function() {
    it('should return an anonymous token when called without api key', async function() {
      const afpNews = new AfpNews();
      const token = await afpNews.authenticate();
      expect(token.accessToken).to.be.a('string');
      expect(token.refreshToken).to.be.a('string');
      expect(token.tokenExpires).to.be.a('number');
      expect(token.authType).to.be.equal('anonymous');
      expect(token).to.deep.equal(afpNews.token);
    });
    it('should throw if called with api key but without credentials', async function() {
      const afpNews = new AfpNews({ apiKey });
      try {
        await afpNews.authenticate();
      } catch (e) {
        expect(e).to.be.an('error');
      }
    });
    it('should throw if called with credentials but without api key', async function() {
      const afpNews = new AfpNews();
      try {
        await afpNews.authenticate({ username: 'TEST', password: 'TEST' });
      } catch (e) {
        expect(e).to.be.an('error');
      }
    });
    it('should return an authenticated token when called with api key and credentials', async function() {
      const afpNews = new AfpNews({ apiKey });
      const token = await afpNews.authenticate({ username, password });
      expect(token.accessToken).to.be.a('string');
      expect(token.refreshToken).to.be.a('string');
      expect(token.tokenExpires).to.be.a('number');
      expect(token.authType).to.be.equal('credentials');
      expect(token).to.deep.equal(afpNews.token);
    });
    it('should return an authenticated token when called with client id and client secret', async function() {
      const afpNews = new AfpNews({ clientId, clientSecret });
      const token = await afpNews.authenticate({ username, password });
      expect(token.accessToken).to.be.a('string');
      expect(token.refreshToken).to.be.a('string');
      expect(token.tokenExpires).to.be.a('number');
      expect(token.authType).to.be.equal('credentials');
      expect(token).to.deep.equal(afpNews.token);
    });
    it('should refresh token when token expires', async function() {
      const afpNews = new AfpNews({ apiKey });
      const token = await afpNews.authenticate({ username, password });
      afpNews._tokenExpires = 0;
      const newToken = await afpNews.authenticate();
      expect(token.accessToken).to.not.be.equal(newToken.accessToken);
      expect(token.authType).to.be.equal('credentials');
    });
    it('should not refresh token when token is valid', async function() {
      const afpNews = new AfpNews({ apiKey });
      const token = await afpNews.authenticate({ username, password });
      const newToken = await afpNews.authenticate();
      expect(token.accessToken).to.be.equal(newToken.accessToken);
      expect(token.authType).to.be.equal('credentials');
    });
  });
  describe('Search', async function() {
    it('should return the search url', function() {
      const afpNews = new AfpNews();
      expect(afpNews.searchUrl).to.be.a('string');
    });
    it('should return the default search params', function() {
      const afpNews = new AfpNews();
      expect(afpNews.defaultSearchParams).to.have.all.keys('langs', 'urgencies', 'queryString', 'size', 'dateFrom', 'dateTo', 'sortField', 'sortOrder', 'products');
    });
    it('should return a news array with anonymous token, without explicit call to authenticate', async function() {
      const afpNews = new AfpNews();
      const news = await afpNews.search();
      expect(news.documents).to.be.an('array');
      expect(news.count).to.be.a('number');
    });
    it('should return a news array with authenticated token', async function() {
      const afpNews = new AfpNews({ apiKey });
      await afpNews.authenticate({ username, password });
      const news = await afpNews.search();
      expect(news.documents).to.have.lengthOf.within(1, afpNews.defaultSearchParams.size);
      expect(news.count).to.be.at.least(news.documents.length);
    });
    it('should react to custom params', async function() {
      const afpNews = new AfpNews({ apiKey });
      await afpNews.authenticate({ username, password });
      const customParams = {
        size: 15,
        dateFrom: 'now-1M',
        dateTo: 'now-1d',
        langs: ['fr'],
        urgencies: [3],
        sortField: 'published',
        sortOrder: 'asc',
        products: ['news']
      }
      const news = await afpNews.search(customParams);
      expect(news.documents).to.have.lengthOf.within(1, customParams.size);
      expect(news.count).to.be.at.least(news.documents.length);
      const firstDocument = news.documents[0];
      expect(firstDocument).to.be.an('object').that.includes.all.keys('country', 'city', 'lang', 'title', 'urgency', 'href', 'headline', 'slug', 'news', 'product', 'created', 'published', 'uno');
      expect(firstDocument.lang).to.be.equal(customParams.langs[0]);
      expect(firstDocument.urgency).to.be.equal(customParams.urgencies[0]);
      const lastDocument = news.documents[news.documents.length - 1];
      expect(new Date(firstDocument.published)).to.be.below(new Date(lastDocument.published));
      expect(new Date(firstDocument.published)).to.be.below(new Date(Date.now() - 2419200)); // now-1M
      expect(new Date(lastDocument.published)).to.be.below(new Date(Date.now() - 86400)); // now-1d
    });
  });
});
