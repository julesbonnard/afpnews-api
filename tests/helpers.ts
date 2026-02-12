import { vi } from 'vitest'
import { Docs } from '../src/api/docs'

export const TOKEN_RESPONSE = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600
}

export function mockFetchResponse(body: unknown, status = 200, statusText = 'OK') {
  return {
    status,
    statusText,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body))
  }
}

export function mockFetch(body: unknown, status = 200) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    mockFetchResponse(body, status) as Response
  )
}

export function mockFetchSequence(responses: Array<{ body: unknown; status?: number; statusText?: string }>) {
  let callIndex = 0
  vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
    const resp = responses[callIndex] || responses[responses.length - 1]
    callIndex++
    return Promise.resolve(mockFetchResponse(resp.body, resp.status, resp.statusText) as Response)
  })
}

export function mockFetchRejection(error: Error) {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(error)
}

export function createAuthenticatedDocs() {
  const docs = new Docs()
  docs.token = {
    accessToken: 'test-token',
    refreshToken: 'test-refresh',
    tokenExpires: Date.now() + 60000,
    authType: 'anonymous'
  }
  return docs
}
