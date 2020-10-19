import fetch, { Headers } from 'node-fetch'
import FormData from 'form-data'
import status from 'statuses'
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

function apiError (code: number, message: string) {
  const error: any = new Error(message || status(code) || `Request rejected with status ${code}`)
  error.code = code
  return error
}

async function fetchJson (url: string, options: Object) {
  const response = await fetch(url, options)

  let json
  let httpStatus = {
    code: response.status,
    message: response.statusText
  }

  try {
    json = await response.json()

    if (json.error) {
      httpStatus = {
        code: json.error.code,
        message: json.error.message
      }
    }
  } catch (e) {
    if (response.ok) {
      httpStatus = {
        code: 520,
        message: 'Unknown error'
      }
    }
  }

  if (httpStatus.code < 300) {
    return json
  } else {
    throw apiError(httpStatus.code, httpStatus.message)
  }
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
