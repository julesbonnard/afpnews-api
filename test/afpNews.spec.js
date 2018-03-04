const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()

const { assert, expect } = chai
const AfpNews = require('../')

describe('AFP News', function() {
  describe('Initialization', function() {
    it('should return true when afpNews is instance of AfpNews', function() {
      const afpNews = new AfpNews()
      assert.equal(afpNews instanceof AfpNews, true);
    });
    it('should reset token on init', function() {
      const afpNews = new AfpNews()
      assert.deepEqual(afpNews.token, { accessToken: null, refreshToken: null, tokenExpires: null });
    });
    it('should allow to change base url', function() {
      const afpNews = new AfpNews({ baseUrl: 'http://customurl' })
      assert.equal(afpNews.baseUrl, 'http://customurl');
    });
    it('should accept an apiKey', function() {
      const afpNews = new AfpNews({ apiKey: 'TEST' })
      assert.equal(afpNews._apiKey, 'TEST');
    });
  });
  describe('Authentication', function() {
    it('should return a token when called without api key', function() {
      const afpNews = new AfpNews()
      return afpNews.authenticate().should.eventually.fulfilled
    });
  });
});
