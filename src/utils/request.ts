/* eslint-disable @typescript-eslint/naming-convention */
import fetch, { Headers } from 'cross-fetch'
import FormData from 'form-data'
import status from 'statuses'
import { AuthorizationHeaders, Form, Query } from '../types'

function buildUrl (url: string, params: Object) {
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

class ApiError extends Error {
  public code
  constructor (message = 'Unknown Error', code = 520, ...params: any) {
    super(message, ...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }

    this.name = 'ApiError'
    this.code = code
  }
}


function apiError (code: number, message?: string) {
  return new ApiError(message?.split(';')[0] || status(code) || `Request rejected with status ${code}`, code)
}

async function fetchJson (url: string, method: string, headers: object = {}, body?: any) {
  const response = await fetch(url, {
    method,
    headers: buildHeaders(Object.assign({}, headers, { Accept: 'application/json' })),
    body
  })

  if (response.status < 300) {
    return response.json()
  }

  const { error } = await response.json() as { error: { code: number; message: string }}

  if (error) {
    throw apiError(error.code, error.message)
  }

  throw apiError(response.status, response.statusText)
}

export async function get (
  url: string,
  {
    headers,
    params
  }: {
    params?: {
      [key: string]: string | number
    }
    headers?: AuthorizationHeaders
  }) {
  return fetchJson(params ? buildUrl(url, params) : url, 'GET', headers)
}

export async function post (
  url: string,
  data: Query,
  {
    headers,
    params
  }: {
    params?: {
      [key: string]: string | number
    }
    headers: AuthorizationHeaders
  }) {
  headers = Object.assign({}, headers, { 'Content-Type' : 'application/json' })

  return fetchJson(params ? buildUrl(url, params) : url, 'POST', headers, JSON.stringify(data))
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

  return fetchJson(url, 'POST', headers, form)
}
