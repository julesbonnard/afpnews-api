import { ApiCore, type AuthToken } from '..'
const api = new ApiCore()
api.authenticate().then(console.log)