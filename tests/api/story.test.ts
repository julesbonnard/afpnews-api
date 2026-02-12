import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockFetchSequence, mockFetchRejection, createAuthenticatedDocs } from '../helpers'

describe('Story (via Docs.getStoryHtml)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should fetch webstory and inject base tag', async () => {
    const storyHtml = '<html><head><title>Story</title></head><body>Content</body></html>'

    mockFetchSequence([
      {
        body: {
          uno: 'story-123',
          href: '/v1/webstory/abc'
        }
      },
      { body: storyHtml }
    ])

    const docs = createAuthenticatedDocs()
    const result = await docs.getStoryHtml({
      class: 'webstory',
      href: 'https://example.com/xml/story'
    })

    expect(typeof result).toBe('string')
    expect(result).toContain('<base href=')
  })

  it('should transform xml to webstory in href URL', async () => {
    const storyHtml = '<html><head></head><body></body></html>'

    mockFetchSequence([
      {
        body: {
          uno: 'story-123',
          href: '/v1/webstory/abc'
        }
      },
      { body: storyHtml }
    ])

    const docs = createAuthenticatedDocs()
    await docs.getStoryHtml({
      class: 'webstory',
      href: 'https://example.com/xml/story'
    })

    // First call should use the transformed URL (xml -> webstory)
    const firstCallUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(firstCallUrl).toContain('webstory')
    expect(firstCallUrl).not.toContain('/xml/')
  })

  it('should inject correct base tag with full URL', async () => {
    const storyHtml = '<html><head><title>Story</title></head><body>Content</body></html>'

    mockFetchSequence([
      {
        body: {
          uno: 'story-123',
          href: '/v1/webstory/abc'
        }
      },
      { body: storyHtml }
    ])

    const docs = createAuthenticatedDocs()
    const result = await docs.getStoryHtml({
      class: 'webstory',
      href: 'https://example.com/xml/story'
    })

    expect(result).toContain('<base href="https://afp-apicore-prod.afp.com/v1/webstory/abc" />')
  })

  it('should inject base tag right after <head>', async () => {
    const storyHtml = '<html><head><title>Story</title></head><body>Content</body></html>'

    mockFetchSequence([
      {
        body: {
          uno: 'story-123',
          href: '/v1/webstory/abc'
        }
      },
      { body: storyHtml }
    ])

    const docs = createAuthenticatedDocs()
    const result = await docs.getStoryHtml({
      class: 'webstory',
      href: 'https://example.com/xml/story'
    })

    expect(result).toContain('<head><base href=')
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

  it('should reject documents without class', async () => {
    const docs = createAuthenticatedDocs()

    await expect(
      docs.getStoryHtml({ href: 'https://example.com/xml/story' })
    ).rejects.toThrow()
  })

  it('should throw on network failure during first fetch', async () => {
    mockFetchRejection(new Error('Network error'))

    const docs = createAuthenticatedDocs()
    await expect(
      docs.getStoryHtml({ class: 'webstory', href: 'https://example.com/xml/story' })
    ).rejects.toThrow('Network error')
  })

  it('should throw on network failure during HTML fetch', async () => {
    let callIndex = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      callIndex++
      if (callIndex === 1) {
        return Promise.resolve({
          status: 200,
          json: () => Promise.resolve({
            uno: 'story-123',
            href: '/v1/webstory/abc'
          }),
          text: () => Promise.resolve('')
        } as Response)
      }
      return Promise.reject(new Error('HTML fetch failed'))
    })

    const docs = createAuthenticatedDocs()
    await expect(
      docs.getStoryHtml({ class: 'webstory', href: 'https://example.com/xml/story' })
    ).rejects.toThrow('HTML fetch failed')
  })

  it('should throw when first fetch returns invalid schema', async () => {
    mockFetchSequence([
      { body: { invalid: 'data' } }
    ])

    const docs = createAuthenticatedDocs()
    await expect(
      docs.getStoryHtml({ class: 'webstory', href: 'https://example.com/xml/story' })
    ).rejects.toThrow()
  })
})
