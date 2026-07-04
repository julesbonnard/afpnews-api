import status from 'statuses'
import { AuthorizationHeaders, AuthForm } from '../types.js'
import { z } from 'zod'

const errorSchema = z.object({
  error: z.object({
    code: z.number(),
    message: z.string().transform(val => val.split(';')[0])
  })
})

function buildUrl (url: string, params: object) {
  const builtUrl = new URL(url)
  Object.entries(params).forEach(([key, value]) => builtUrl.searchParams.append(key, value))
  return builtUrl.toString()
}

function buildHeaders (headers: object) {
  const builtHeaders = new Headers()
  Object.entries(headers).forEach(([key, value]) => builtHeaders.append(key, value))
  return builtHeaders
}

function buildForm (form: object) {
  const builtForm = new FormData()
  Object.entries(form).forEach(([key, value]) => builtForm.append(key, value))
  return builtForm
}

export class ApiError extends Error {
  public code
  constructor (message = 'Unknown Error', code = 520) {
    super(message)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }

    this.name = 'ApiError'
    this.code = code
  }
}

function apiError (code: number, message?: string) {
  return new ApiError(message || status(code) || `Request rejected with status ${code}`, code)
}

async function fetchJson (url: string, method: string, headers: object = {}, body?: string | FormData) {
  const response = await fetch(url, {
    method,
    headers: buildHeaders(Object.assign({}, headers, { Accept: 'application/json' })),
    body
  })

  const data = await response.json();  

  // AFP peut retourner HTTP 200 avec un payload d'erreur — vérifier dans les deux cas
  const errorData = errorSchema.safeParse(data);                                                                              
  if (errorData.success) {                                                                                                    
    throw apiError(errorData.data.error.code, errorData.data.error.message);                                                  
  }                                                                                                                           
  if (response.status >= 300) {                           
    throw apiError(response.status, response.statusText);                                                                     
  }
  return data;                                                                                
}

async function fetchText (url: string, method: string, headers: object = {}, body?: string, accept = 'text/*') {
  const response = await fetch(url, {
    method,
    headers: buildHeaders(Object.assign({}, headers, { Accept: accept })),
    body
  })

  const data = await response.text();  

  // AFP peut retourner HTTP 200 avec un payload d'erreur — vérifier dans les deux cas
  const errorData = errorSchema.safeParse(data);                                                                              
  if (errorData.success) {                                                                                                    
    throw apiError(errorData.data.error.code, errorData.data.error.message);                                                  
  }                                                                                                                           
  if (response.status >= 300) {                           
    throw apiError(response.status, response.statusText);                                                                     
  }
  return data;                 
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
  },
  type: 'json' | 'text' = 'json',
  accept?: string) {
  if (type === 'text') return fetchText(params ? buildUrl(url, params) : url, 'GET', headers, undefined, accept)
  return fetchJson(params ? buildUrl(url, params) : url, 'GET', headers)
}

export async function post (
  url: string,
  data: object,
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
  formData: AuthForm,
  {
    headers
  }: {
    headers: AuthorizationHeaders
  }) {
  const form = buildForm(formData)

  return fetchJson(url, 'POST', headers, form)
}

export async function del (
  url: string,
  {
    headers,
    params
  }: {
    params?: {
      [key: string]: string | number
    }
    headers?: AuthorizationHeaders
  }, body?: object) {
  headers = Object.assign({}, headers, { 'Content-Type' : 'application/json' })

  return fetchJson(params ? buildUrl(url, params) : url, 'DELETE', headers, body && JSON.stringify(body))
}
