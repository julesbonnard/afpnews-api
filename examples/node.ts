import { ApiCore } from '..'
const api = new ApiCore()
api.authenticate().then(console.log)