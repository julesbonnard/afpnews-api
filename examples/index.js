const AfpNews = require('../')
require('dotenv').config()

const {
    AFPNEWS_CLIENT_ID: clientId,
    AFPNEWS_CLIENT_SECRET: clientSecret,
    AFPNEWS_USERNAME: username,
    AFPNEWS_PASSWORD: password
  } = process.env

const afpNews = new AfpNews({ clientId, clientSecret })

afpNews.authenticate({ username, password })
    .then(token => {
        console.log(token)
    })
    .catch(err => {
        console.error(err)
    })