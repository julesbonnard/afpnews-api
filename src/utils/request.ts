import fetch from 'isomorphic-fetch'
import FormData from 'isomorphic-form-data'
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
  } = {}) {
  headers = Object.assign({}, headers, {
    'Content-Type': 'application/json'
  })
  const response = await fetch(params ? buildUrl(url, params) : url, {
    headers: buildHeaders(headers),
    method: 'GET'
  })

  return response.json()
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

  const response = await fetch(url, {
    headers: buildHeaders(headers),
    method: 'POST',
    body: JSON.stringify(data)
  })

  return response.json()
}

export async function postForm (
  url: string,
  formData: Form,
  {
    headers = {}
  }: {
    headers: AuthorizationHeaders
  }) {
  const form = buildForm(formData)

  const response = await fetch(url, {
    headers: buildHeaders(headers),
    method: 'POST',
    body: form
  })

  return response.json()
}
