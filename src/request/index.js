import rp from 'request-promise'

export async function get (uri, { params, headers, json } = { json: true }) {
  return rp({
    method: 'GET',
    uri,
    qs: params,
    headers,
    json
  })
}

export async function post (uri, { formData, headers, json } = { json: true }) {
  return rp({
    method: 'POST',
    uri,
    formData,
    headers,
    json
  })
}
