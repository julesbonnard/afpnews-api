import { parse as queryParser } from 'lucene-query-parser'
import { normalize } from './normalizer'

function recursiveBuild (query) {
  if (query.operator === '<implicit>') {
    return [
      ...recursiveBuild(query.left),
      ...recursiveBuild(query.right)
    ]
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
    const object = {
      name: query.field === '<implicit>' ? 'news' : normalize(query.field)
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
