import AfpNewsDocs from './afpnews-docs'
import { ClientCredentials, AfpResponseOnlineIndex, AfpResponseOnlineTopics, Token } from './types'
import { get } from './utils/request'

export default class AfpNewsTopics extends AfpNewsDocs {
  constructor (credentials: ClientCredentials & { baseUrl?: string, saveToken?: (token: Token | null) => void } = {}) {
    super(credentials)
  }

  public async topics (lang: string) {
    await this.authenticate()

    const data: AfpResponseOnlineTopics = await get(`${this.baseUrl}/onlinenews/api/topics`, {
      headers: this.authorizationBearerHeaders,
      params: {
        lang
      }
    })

    const { topics, numFound: count } = data.response

    return {
      count,
      topics: topics.map(d => d.name)
    }
  }

  public async topicIndex (topic: string, lang: string, onlyPreviews = false) {
    await this.authenticate()

    const data: AfpResponseOnlineIndex = await get(`${this.baseUrl}/onlinenews/api/index`, {
      headers: this.authorizationBearerHeaders,
      params: {
        topic,
        lang
      }
    })

    const { docs, numFound } = data.response

    if (onlyPreviews === true) {
      return {
        count: numFound,
        documents: docs.documents
      }
    }

    const index = docs.documents.map(d => d.uno)
    const { documents, count } = await this.search({
      query: `uno:(${index.join(' OR ')})`
    })

    return {
      count,
      documents: documents.sort((a, b) => index.indexOf(a.uno) - index.indexOf(b.uno))
    }
  }

  // public async topicFeed (topic: string, lang: string) {
  //   await this.authenticate()

  //   const data = await getXml(`${this.baseUrl}/onlinenews/api/feed?topic=${topic}&lang=${lang}`, {
  //     headers: this.authorizationBearerHeaders
  //   })

  //   return data
  // }
}
