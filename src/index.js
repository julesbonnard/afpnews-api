const AfpNews = require('./AfpNews')

if (typeof window === 'undefined') {
  module.exports = AfpNews
} else {
  window.AfpNews = AfpNews
}
