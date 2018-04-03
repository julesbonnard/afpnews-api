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
    const object = {
      name: query.field === '<implicit>' ? 'news' : query.field,
      fullText: true
    }
    if (query.prefix === '-') {
      object['exclude'] = [query.term]
    } else {
      object['contains'] = [query.term]
    }
    return [object]
  }
}

export async function buildQuery (query) {
  try {
    if (!query || query === '') return []
    const queryParsed = queryParser(query)
    const queryBuilt = recursiveBuild(queryParsed)
    return queryBuilt
  } catch (e) {
    return Promise.reject(e)
  }
}
