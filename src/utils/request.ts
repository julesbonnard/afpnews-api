import type { AuthorizationHeaders, AuthForm } from '../types.js'
import { z } from 'zod'

const errorSchema = z.object({
  error: z.object({
    code: z.number(),
    message: z.string().transform(val => val.split(';')[0]).optional(),
    type: z.string().optional(),
    subcode: z.union([z.number(), z.string()]).optional()
  })
})

const rateLimitSchema = z.object({ expireAt: z.coerce.date() })
const stringErrorSchema = z.object({ error: z.string() })

const RETRYABLE_STATUSES = new Set([429, 502, 503, 504])

const MAX_RETRY_WAIT_MS = 10_000

function buildUrl (url: string, params: Record<string, string | number>) {
  const builtUrl = new URL(url)
  Object.entries(params).forEach(([key, value]) => builtUrl.searchParams.append(key, String(value)))
  return builtUrl.toString()
}

function buildHeaders (headers: Record<string, string>) {
  const builtHeaders = new Headers()
  Object.entries(headers).forEach(([key, value]) => builtHeaders.append(key, value))
  return builtHeaders
}

type ApiErrorDetails = {
  /** Statut HTTP de la réponse */
  status?: number
  /** Code d'erreur AFP (`invalid_token`, `invalid_user`, `invalid_client`, `SearchServerException`…) */
  type?: string
  subcode?: number | string
  /** Fin du blocage, pour un 429 */
  expireAt?: Date
}

export class ApiError extends Error {
  public code: number
  public status?: number
  public type?: string
  public subcode?: number | string
  public expireAt?: Date

  constructor (message = 'Unknown Error', code = 520, details: ApiErrorDetails = {}) {
    super(message)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }

    this.name = 'ApiError'
    this.code = code
    Object.assign(this, details)
  }
}

function parseJson (text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

// AFP peut renvoyer un payload d'erreur avec un HTTP 200 : on regarde le corps avant le statut.
function toApiError (response: Response, data: unknown): ApiError | undefined {
  const status = response.status
  const structured = errorSchema.safeParse(data)
  if (structured.success) {
    const { code, message, type, subcode } = structured.data.error
    return new ApiError(message || `Request rejected with status ${code}`, code, { status, type, subcode })
  }
  if (status < 300) return undefined

  const asString = stringErrorSchema.safeParse(data)
  const rateLimit = rateLimitSchema.safeParse(data)
  const message = asString.success ? asString.data.error : response.statusText || `Request rejected with status ${status}`
  return new ApiError(message, status, { status, expireAt: rateLimit.success ? rateLimit.data.expireAt : undefined })
}

function retryDelay (error: unknown): number | undefined {
  if (!(error instanceof ApiError) || !error.status || !RETRYABLE_STATUSES.has(error.status)) return undefined
  if (error.status === 429) {
    if (!error.expireAt) return undefined
    const wait = Math.max(error.expireAt.getTime() - Date.now(), 0)
    return wait <= MAX_RETRY_WAIT_MS ? wait : undefined
  }
  return 500 + Math.random() * 1000
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function withRetry<T> (request: () => Promise<T>, retry: boolean): Promise<T> {
  try {
    return await request()
  } catch (error) {
    const delay = retry ? retryDelay(error) : undefined
    if (delay === undefined) throw error
    await sleep(delay)
    return request()
  }
}

async function fetchJsonOnce (url: string, method: string, headers: object, body?: string | URLSearchParams) {
  const response = await fetch(url, {
    method,
    headers: buildHeaders(Object.assign({}, headers, { Accept: 'application/json' })),
    body
  })

  const data = parseJson(await response.text())
  const error = toApiError(response, data)
  if (error) throw error
  if (data === undefined) throw new ApiError('Invalid JSON response', 520, { status: response.status })
  return data
}

function fetchJson (url: string, method: string, headers: object = {}, body: string | URLSearchParams | undefined, retry: boolean) {
  return withRetry(() => fetchJsonOnce(url, method, headers, body), retry)
}

function fetchText (url: string, method: string, headers: object = {}, body?: string, accept = 'text/*', retry = true) {
  return withRetry(async () => {
    const response = await fetch(url, {
      method,
      headers: buildHeaders(Object.assign({}, headers, { Accept: accept })),
      body
    })

    const text = await response.text()
    if (response.status >= 300) throw toApiError(response, parseJson(text)) as ApiError
    return text
  }, retry)
}

/**
 * Requête GET. Rejouée une fois sur 429/5xx (lecture), sauf `retry: false` pour les rares GET qui
 * écrivent côté AFP (ex. `/v1/user/filter/delete`).
 */
export async function get (
  url: string,
  {
    headers,
    params,
    retry = true
  }: {
    params?: {
      [key: string]: string | number
    }
    headers?: AuthorizationHeaders
    retry?: boolean
  },
  type: 'json' | 'text' = 'json',
  accept?: string) {
  if (type === 'text') return fetchText(params ? buildUrl(url, params) : url, 'GET', headers, undefined, accept, retry)
  return fetchJson(params ? buildUrl(url, params) : url, 'GET', headers, undefined, retry)
}

/**
 * Requête POST JSON. Pas de nouvel essai par défaut : un 504 survient souvent après que le serveur a
 * traité la requête, et rejouer une écriture créerait un doublon. `retry: true` pour les POST de lecture
 * (search, list).
 */
export async function post (
  url: string,
  data: object,
  {
    headers,
    params,
    retry = false
  }: {
    params?: {
      [key: string]: string | number
    }
    headers: AuthorizationHeaders
    retry?: boolean
  }) {
  headers = Object.assign({}, headers, { 'Content-Type' : 'application/json' })

  return fetchJson(params ? buildUrl(url, params) : url, 'POST', headers, JSON.stringify(data), retry)
}

export async function postForm (
  url: string,
  formData: AuthForm,
  {
    headers
  }: {
    headers: AuthorizationHeaders
  }) {
  return fetchJson(url, 'POST', headers, new URLSearchParams(formData), false)
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

  return fetchJson(params ? buildUrl(url, params) : url, 'DELETE', headers, body && JSON.stringify(body), false)
}
