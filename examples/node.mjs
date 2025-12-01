import { ApiCore } from '../dist/esm/index.js'
const api = new ApiCore()
api.authenticate().then(console.log)