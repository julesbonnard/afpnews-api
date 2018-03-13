import { parse as queryParser } from 'lucene-query-parser'

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
    if (query.prefix === '-') {
      return [{
        name: query.field === '<implicit>' ? 'news' : query.field,
        excludes: [query.term]
      }]
    }
    return [{
      name: query.field === '<implicit>' ? 'news' : query.field,
      contains: [query.term]
    }]
  }
}

export async function buildQuery (queryString) {
  try {
    if (!queryString || queryString === '') return []
    const queryParsed = queryParser(queryString)
    const queryBuilt = recursiveBuild(queryParsed)
    return queryBuilt
  } catch (e) {
    return Promise.reject(e)
  }
}
