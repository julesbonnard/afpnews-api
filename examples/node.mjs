import { ApiCore } from '../dist/esm/index.mjs'
const api = new ApiCore()
api.authenticate().then(console.log)