import { z } from 'zod'
import { get } from '../utils/request.js'
import type { ApiCore } from '../index.js'

const docStorySchema = z.object({
  class: z.literal('webstory'),
  href: z.string().transform(d => d.replace('xml', 'webstory').replace('json', 'webstory'))
})

const storySchema = z.object({
  uno: z.string(),
  href: z.string()
})

function onApiOrigin (url: string, baseUrl: string): string {
  const { origin } = new URL(url)
  if (origin !== new URL(baseUrl).origin) throw new Error(`Story: ${origin} is not the API origin, refusing to send the token there`)
  return url
}

export async function Story (this: ApiCore, doc: unknown) {
  const docHref = onApiOrigin(docStorySchema.parse(doc).href, this.baseUrl)
  const data = await this.withAuth(() => get(docHref, {
    headers: this.authorizationBearerHeaders
  }))

  const { href } = storySchema.parse(data)

  const link = onApiOrigin(`${this.baseUrl}${href}`, this.baseUrl)

  const docbase = `<base href="${link}" />`

  const head = '<head>'

  const content = await this.withAuth(() => get(link, { headers: this.authorizationBearerHeaders }, 'text')) as string
  const pos = content.indexOf(head) + head.length

  return content.slice(0, pos) + docbase + content.slice(pos)
}
