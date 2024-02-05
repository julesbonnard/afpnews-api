import { z } from 'zod'
import { get } from '../utils/request'
import type ApiCore from '../'

const docStorySchema = z.object({
  class: z.literal('webstory'),
  href: z.string().transform(d => d.replace('xml', 'webstory'))
})

const storySchema = z.object({
  uno: z.string(),
  href: z.string()
})

function insert (mainString: string, insString: string, pos: number) {
  return mainString.slice(0, pos) + insString + mainString.slice(pos)
}

export async function Story (this: ApiCore, doc: unknown) {
  const docHref = docStorySchema.parse(doc).href
  const data = await get(docHref, {
    headers: this.authorizationBearerHeaders
  })

  const { href } = storySchema.parse(data)

  const link = `${this.baseUrl}${href}`

  const docbase = `<base href="${link}" />`

  const head = '<head>'

  let content = await get(link, {}, 'text') as string

  content = insert(content, docbase, content.indexOf(head) + head.length)

  return content
}
