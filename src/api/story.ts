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

export async function Story (this: ApiCore, doc: unknown) {
  const docHref = docStorySchema.parse(doc).href
  const data = await get(docHref, {
    headers: this.authorizationBearerHeaders
  })

  const { href } = storySchema.parse(data)

  const link = `${this.baseUrl}${href}`

  const docbase = `<base href="${link}" />`

  const head = '<head>'

  const content = await get(link, {}, 'text') as string
  const pos = content.indexOf(head) + head.length

  return content.slice(0, pos) + docbase + content.slice(pos)
}
