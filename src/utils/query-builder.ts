// import nearley from 'nearley'
import { Request } from '../types'
import { Parser, Grammar } from 'nearley'
import grammar from './search-query-grammar'

export default function buildQuery (query: string | undefined): Request | undefined {
  if (!query || query.trim() === '') {
    return undefined
  }
  const parser = new Parser(Grammar.fromCompiled(grammar))
  parser.feed(query.trim())
  if (parser.results.length === 0) {
    throw new Error('Invalid query')
  }
  const queryBuilt: Request = parser.results[0]
  return queryBuilt
}
