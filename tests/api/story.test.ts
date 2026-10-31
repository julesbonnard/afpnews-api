import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Docs } from '../../src/api/docs'

function createAuthenticatedDocs() {
  const docs = new Docs()
  docs.token = {
    accessToken: 'test-token',
    refreshToken: 'test-refresh',
    tokenExpires: Date.now() + 60000,
    authType: 'anonymous'
  }
  return docs
}

describe('Story (via Docs.getStoryHtml)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should fetch webstory and inject base tag', async () => {
    const storyHtml = '<html><head><title>Story</title></head><body>Content</body></html>'

    let callIndex = 0
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callIndex++
      if (callIndex === 1) {
        return Promise.resolve({
          status: 200,
          json: () => Promise.resolve({
            uno: 'story-123',
            href: '/v1/webstory/abc'
          }),
          text: () => Promise.resolve(JSON.stringify({ uno: 'story-123', href: '/v1/webstory/abc' }))
        })
      }
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve(storyHtml),
        text: () => Promise.resolve(storyHtml)
      })
    })

    const docs = createAuthenticatedDocs()
    const result = await docs.getStoryHtml({
      class: 'webstory',
      href: 'https://afp-apicore-prod.afp.com/objects/api/get?id=abc.xml'
    })

    expect(typeof result).toBe('string')
    expect(result).toContain('<base href=')
  })

  it('should refuse to send the token outside the API origin', async () => {
    const docs = createAuthenticatedDocs()
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ uno: 'story-123', href: '@evil.example/steal' }))
    })

    await expect(docs.getStoryHtml({ class: 'webstory', href: 'https://evil.example/xml' })).rejects.toThrow('not the API origin')
    await expect(docs.getStoryHtml({ class: 'webstory', href: 'https://afp-apicore-prod.afp.com/objects/api/get?id=abc.xml' })).rejects.toThrow('not the API origin')
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('should reject non-webstory documents', async () => {
    const docs = createAuthenticatedDocs()

    await expect(
      docs.getStoryHtml({ class: 'text', href: 'https://example.com' })
    ).rejects.toThrow()
  })

  it('should reject documents without href', async () => {
    const docs = createAuthenticatedDocs()

    await expect(
      docs.getStoryHtml({ class: 'webstory' })
    ).rejects.toThrow()
  })
})
