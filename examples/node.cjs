const { ApiCore } = require('../')
const api = new ApiCore()
api.authenticate().then(console.log)