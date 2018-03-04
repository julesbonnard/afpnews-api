const AfpNews = require('./AfpNews')

if (typeof window !== 'undefined') {
  window.AfpNews = AfpNews
}

module.exports = AfpNews
