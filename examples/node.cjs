const API = require('../')
const api = new API()
api.authenticate().then(console.log)