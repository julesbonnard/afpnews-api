import { parse as queryParser } from 'lucene-query-parser'
import { normalize } from './normalizer'

function recursiveBuild (query) {
  if (query.operator === '<implicit>') {
    return [{
      and: [
        ...recursiveBuild(query.left),
        ...recursiveBuild(query.right)
      ]
    }]
  } else if (query.operator === 'AND') {
    return [{
      and: [
        ...recursiveBuild(query.left),
        ...recursiveBuild(query.right)
      ]
    }]
  } else if (query.operator === 'OR') {
    return [{
      or: [
        ...recursiveBuild(query.left),
        ...recursiveBuild(query.right)
      ]
    }]
  } else if (!query.operator) {
    if (query.left) {
      return [
        ...recursiveBuild(query.left)
      ]
    }
    if (query.field === '<implicit>') {
      return [{
        [query.prefix === '-' ? 'and' : 'or']: [
          ...recursiveBuild(Object.assign({}, query, { field: 'news' })),
          ...recursiveBuild(Object.assign({}, query, { field: 'slug' })),
          ...recursiveBuild(Object.assign({}, query, { field: 'city' })),
          ...recursiveBuild(Object.assign({}, query, { field: 'country' })),
          ...recursiveBuild(Object.assign({}, query, { field: 'title' })),
          ...recursiveBuild(Object.assign({}, query, { field: 'caption' })),
          ...recursiveBuild(Object.assign({}, query, { field: 'creator' })),
          ...recursiveBuild(Object.assign({}, query, { field: 'headline' })),
          ...recursiveBuild(Object.assign({}, query, { field: 'entity_person' })),
          ...recursiveBuild(Object.assign({}, query, { field: 'entity_location' }))
        ]
      }]
    }
    const object = {
      name: normalize(query.field)
    }
    if (query.prefix === '-') {
      object['exclude'] = [normalize(query.term)]
    } else {
      object['in'] = [normalize(query.term)]
    }
    return [object]
  }
}

export function buildQuery (query) {
  if (query === '') return []
  const queryParsed = queryParser(query)
  const queryBuilt = recursiveBuild(queryParsed)
  return queryBuilt
}
