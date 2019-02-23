import { LuceneQueryParsed, parse as queryParser } from 'lucene'
import { Field, Request } from '../@types'
import { normalize } from './normalizer'

function recursiveBuild (query: LuceneQueryParsed): Request[] {
  if (query.field && query.field !== '<implicit>') {
    if (query.left) {
      Object.assign(query.left, { field: query.field })
    }
    if (query.right) {
      Object.assign(query.right, { field: query.field })
    }
  }
  if (query.prefix === '-') {
    if (query.left) {
      Object.assign(query.left, { prefix: query.prefix })
    }
    if (query.left) {
      Object.assign(query.right, { prefix: query.prefix })
    }
  }
  switch (query.operator) {
    case '<implicit>': {
      return [{
        and: [
          ...recursiveBuild(query.left),
          ...recursiveBuild(query.right)
        ]
      }]
    }
    case '&&':
    case 'AND': {
      return [{
        and: [
          ...recursiveBuild(query.left),
          ...recursiveBuild(query.right)
        ]
      }]
    }
    case '||':
    case 'OR': {
      return [{
        or: [
          ...recursiveBuild(query.left),
          ...recursiveBuild(query.right)
        ]
      }]
    }
    case 'AND NOT':
    case 'NOT': {
      return [{
        and: [
          ...recursiveBuild(query.left),
          ...recursiveBuild(Object.assign(query.right, { prefix: '-' }))
        ]
      }]
    }
    case 'OR NOT':
      return [{
        or: [
          ...recursiveBuild(query.left),
          ...recursiveBuild(Object.assign(query.right, { prefix: '-' }))
        ]
      }]
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
  const queryParsed = queryParser(query)
  const queryBuilt: Request[] = recursiveBuild(queryParsed)
  return queryBuilt
}
