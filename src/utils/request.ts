import fetch, { Headers } from 'node-fetch'
import FormData from 'form-data'
import { AuthorizationHeaders, Form, Query } from '../types'

function buildUrl (url: string, params: Object): string {
  const builtUrl = new URL(url)
  Object.entries(params).forEach(([key, value]) => builtUrl.searchParams.append(key, value))
  return builtUrl.toString()
}

function buildHeaders (headers: Object) {
  const builtHeaders = new Headers()
  Object.entries(headers).forEach(([key, value]) => builtHeaders.append(key, value))
  return builtHeaders
}

function buildForm (form: Object) {
  const builtForm = new FormData()
  Object.entries(form).forEach(([key, value]) => builtForm.append(key, value))
  return builtForm
}

class NetworkError extends Error {
  public code: Number
  constructor (statusCode: Number) {
    super(`Request rejected with status ${statusCode}`)
    this.code = statusCode
  }
}

async function fetchJson (url: string, options: Object) {
  const response = await fetch(url, options)

  if (!response.ok) {
    throw new NetworkError(response.status)
  }

  return response.json()
}

export async function get (
  url: string,
  {
    headers,
    params
  }: {
    params?: {
      grant_type: string
    },
    headers?: AuthorizationHeaders
  }) {
  headers = Object.assign({}, headers, {
    'Content-Type': 'application/json'
  })

  return fetchJson(params ? buildUrl(url, params) : url, {
    headers: buildHeaders(headers),
    method: 'GET'
  })
}

export async function post (
  url: string,
  data: Query,
  {
    headers
  }: {
    headers?: AuthorizationHeaders
  }) {
  headers = Object.assign({ 'Content-Type': 'application/json' }, headers)

  return fetchJson(url, {
    headers: buildHeaders(headers),
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function postForm (
  url: string,
  formData: Form,
  {
    headers
  }: {
    headers: AuthorizationHeaders
  }) {
  const form = buildForm(formData)

  return fetchJson(url, {
    headers: buildHeaders(headers),
    method: 'POST',
    body: form
  })
}
