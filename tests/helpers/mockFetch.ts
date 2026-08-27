import { vi, type Mock } from 'vitest'

interface FetchResponseInit {
  body: unknown
  status?: number
  statusText?: string
}

function buildResponse ({ body, status = 200, statusText = 'OK' }: FetchResponseInit): Response {
  // Only the Response members this codebase actually reads are implemented.
  return {
    status,
    statusText,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body))
  } as Response
}

/**
 * Creates a typed `fetch` mock resolving to a single response.
 * Assign it to `globalThis.fetch` or inspect it directly via `.mock.calls`.
 */
export function mockFetchResponse (body: unknown, status = 200, statusText = 'OK'): Mock<typeof fetch> {
  return vi.fn<typeof fetch>(() => Promise.resolve(buildResponse({ body, status, statusText })))
}

/** Assigns `globalThis.fetch` to a mock resolving to a single response. */
export function mockFetch (body: unknown, status = 200, statusText = 'OK'): void {
  globalThis.fetch = mockFetchResponse(body, status, statusText)
}

/** Assigns `globalThis.fetch` to a mock resolving to successive responses, one per call. */
export function mockFetchSequence (responses: FetchResponseInit[]): void {
  let callIndex = 0
  globalThis.fetch = vi.fn<typeof fetch>(() => {
    const resp = responses[callIndex] || responses[responses.length - 1]
    callIndex++
    return Promise.resolve(buildResponse(resp))
  })
}
