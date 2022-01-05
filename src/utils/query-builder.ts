// import nearley from 'nearley'
import { Request } from '../types'
import { Parser, Grammar } from 'nearley'
import grammar from './search-query-grammar'

export default function buildQuery (query: string | undefined): Request | undefined {
  if (!query || query.trim() === '') {
    return undefined
  }
  const parser = new Parser(Grammar.fromCompiled(grammar as any))
  try {
    parser.feed(query.trim())
  } catch (parseError: any) {
    return
  }
  if (!parser.results || parser.results.length === 0) {
    throw new Error('Invalid query')
  }
  const queryBuilt: Request = parser.results.map(result => ({
    result,
    length: JSON.stringify(result).length
  })).sort((a, b) => a.length - b.length)[0].result

  return queryBuilt
}
