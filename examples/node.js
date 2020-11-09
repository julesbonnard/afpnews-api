const AfpNews = require('../')
require('dotenv').config()

const {
  AFPNEWS_CLIENT_ID: clientId,
  AFPNEWS_CLIENT_SECRET: clientSecret,
  AFPNEWS_USERNAME: username,
  AFPNEWS_PASSWORD: password
} = process.env

// Initialize the API
const afpNews = new AfpNews({
  clientId,
  clientSecret,
  saveToken: token => {
    // You can eventually save the token to be used later
    console.log(token)
  }
})

// Search for latest documents
afpNews.authenticate({
  username,
  password
})
.then(() => {
  afpNews.search().then(console.log)
  afpNews.list('slug').then(console.log)
  afpNews.topics('fr').then(console.log)
  afpNews.topicIndex('Sport', 'fr').then(console.log)
})
