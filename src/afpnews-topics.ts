import AfpNewsDocs from './afpnews-docs'
import { ClientCredentials, AfpResponseOnlineIndex, AfpResponseOnlineTopics, Token, Lang, AfpDocument } from './types'
import { get } from './utils/request'

export default class AfpNewsTopics extends AfpNewsDocs {
  constructor (credentials: ClientCredentials & { baseUrl?: string, saveToken?: (token: Token | null) => void } = {}) {
    super(credentials)
  }

  public async topics (lang: Lang) {
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

  public async topicIndex (topic: string, lang: Lang, onlyPreviews = false) {
    await this.authenticate()

    const data: AfpResponseOnlineIndex = await get(`${this.baseUrl}/onlinenews/api/index`, {
      headers: this.authorizationBearerHeaders,
      params: {
        topic,
        lang
      }
    })

    const documents: [AfpDocument] | [] = Array.isArray(data.response.docs.documents) ? data.response.docs.documents : []

    if (onlyPreviews === true || documents.length === 0) {
      return {
        count: data.response.numFound,
        documents: documents
      }
    }

    const index = documents.map(d => d.uno)
    const news = await this.search({
      query: `uno:(${index.join(' OR ')})`
    })

    return {
      count: news.count,
      documents: news.documents.sort((a, b) => index.indexOf(a.uno) - index.indexOf(b.uno))
    }
  }

  public async topicFeed (topic: string, lang: Lang) {
    await this.authenticate()

    // return getXml(`${this.baseUrl}/onlinenews/api/feed?topic=${topic}&lang=${lang}`, {
    //   headers: this.authorizationBearerHeaders
    // })

    return this.search({
      query: `topic:${topic}`,
      langs: [lang]
    })
  }
}
