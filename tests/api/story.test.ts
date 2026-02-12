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
    const storyUrl = 'https://afp-apicore-prod.afp.com/v1/webstory/abc'
    const storyHtml = '<html><head><title>Story</title></head><body>Content</body></html>'

    let callIndex = 0
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      callIndex++
      if (callIndex === 1) {
        // First call: fetch webstory XML URL
        return Promise.resolve({
          status: 200,
          json: () => Promise.resolve({
            uno: 'story-123',
            href: '/v1/webstory/abc'
          }),
          text: () => Promise.resolve('')
        })
      }
      // Second call: fetch the actual HTML
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve(storyHtml),
        text: () => Promise.resolve(storyHtml)
      })
    })

    const docs = createAuthenticatedDocs()
    const result = await docs.getStoryHtml({
      class: 'webstory',
      href: 'https://example.com/xml/story'
    })

    expect(typeof result).toBe('string')
    expect(result).toContain('<base href=')
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
