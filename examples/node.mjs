import API from '../dist/esm/index.js'
const api = new API()
api.authenticate().then(console.log)