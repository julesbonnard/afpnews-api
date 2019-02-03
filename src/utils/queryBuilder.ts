import { parse as queryParser } from 'lucene-query-parser'
import { Field, LuceneQueryParsed, Request } from '../@types'
import { normalize } from './normalizer'

function recursiveBuild (query: LuceneQueryParsed): Request[] {
  switch (query.operator) {
    case '<implicit>': {
      return [{
        and: [
          ...recursiveBuild(query.left),
          ...recursiveBuild(query.right)
        ]
      }]
    }
    case 'AND': {
      return [{
        and: [
          ...recursiveBuild(query.left),
          ...recursiveBuild(query.right)
        ]
      }]
    }
    case 'OR': {
      return [{
        or: [
          ...recursiveBuild(query.left),
          ...recursiveBuild(query.right)
        ]
      }]
    }
    default: {
      if (query.left) {
        return [
          ...recursiveBuild(query.left)
        ]
      }
      if (query.field === '<implicit>') {
        return [{
          [query.prefix === '-' ? 'and' : 'or']: [
            ...recursiveBuild({ ...query, field: 'news' }),
            ...recursiveBuild({ ...query, field: 'slug' }),
            ...recursiveBuild({ ...query, field: 'city' }),
            ...recursiveBuild({ ...query, field: 'country' }),
            ...recursiveBuild({ ...query, field: 'title' }),
            ...recursiveBuild({ ...query, field: 'caption' }),
            ...recursiveBuild({ ...query, field: 'creator' }),
            ...recursiveBuild({ ...query, field: 'headline' }),
            ...recursiveBuild({ ...query, field: 'entity_person' }),
            ...recursiveBuild({ ...query, field: 'entity_location' })
          ]
        }]
      }
      const object: {
        name: Field,
        exclude?: Array<string | number>,
        in?: Array<string | number>
      } = {
        name: normalize(query.field) as Field
      }
      if (query.prefix === '-') {
        object.exclude = [normalize(query.term)]
      } else {
        object.in = [normalize(query.term)]
      }
      return [object]
    }
  }
}

export default function buildQuery (query: string | undefined): Request[] {
  if (!query || query === '') {
    return []
  }
  const queryParsed: LuceneQueryParsed = queryParser(query)
  const queryBuilt: Request[] = recursiveBuild(queryParsed)
  return queryBuilt
}
