import { defaultSearchParams, maxRowsByRequest, fullTextSearchFields, translatedSearchFields, langsWithTranslation } from '../config.js'
import type { AdditionalParamValue, SearchFilters, SearchQuery, SearchQuerySortOrder, SearchRequest, SortEntry, WantedFacets } from "../types.js"
import nearley from 'nearley'
import { default as grammar } from '../grammar/index.js'
import { normalize } from './normalizer.js'
import { z } from 'zod'

const querySchema = z.string().default('')

/**
 * Convertit un filtre en conditions de requête : une valeur ou une liste devient `in` ; un objet donne
 * une condition par opérateur renseigné (voir `AdditionalParamValue`). Valeur vide → aucune condition.
 */
function toConditions (name: string, value: AdditionalParamValue): SearchQuery[] {
  if (typeof value === 'string' || typeof value === 'number') return value === '' ? [] : [{ name, in: [value] }]
  if (Array.isArray(value)) return value.length > 0 ? [{ name, in: value }] : []

  const conditions: SearchQuery[] = []
  if (value.in?.length) conditions.push({ name, in: value.in })
  if (value.exclude?.length) conditions.push({ name, exclude: value.exclude })
  if (value.and?.length) conditions.push({ name, and: value.and })
  if (value.contains) conditions.push({ name, contains: value.contains })
  if (value.range) conditions.push({ name, range: value.range })
  if (value.exists !== undefined) conditions.push(value.exists ? { having: name } : { missing: name })
  return conditions
}

const quote = (value: string) => {
  return `"${value}"`
}

// Auto-closes a trailing unclosed `(` or `"`; an extra unmatched `)` is left as a real error.
const balanceQuery = (query: string): string => {
  let parenDepth = 0
  let inQuote = false
  for (let i = 0; i < query.length; i++) {
    const char = query[i]
    if (inQuote) {
      if (char === '\\') { i++; continue }
      if (char === '"') inQuote = false
      continue
    }
    if (char === '"') inQuote = true
    else if (char === '(') parenDepth++
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1)
  }
  return query + (inQuote ? '"' : '') + ')'.repeat(parenDepth)
}

const tokenLabels: Record<string, string> = {
  lparen: '(',
  rparen: ')',
  dquote: '"',
  is: ':',
  and: 'AND',
  or: 'OR',
  not: 'NOT',
  word: 'a term'
}

// Drops nearley's raw Earley derivation trace, keeping only the position/pointer and a deduped "expected" list.
const formatParseError = (rawMessage: string): string => {
  const lines = rawMessage.split('\n')
  const unexpectedLineIndex = lines.findIndex(line => line.startsWith('Unexpected'))
  if (unexpectedLineIndex === -1) return rawMessage

  const header = lines.slice(0, unexpectedLineIndex).join('\n').trimEnd()
  const [reason] = lines[unexpectedLineIndex].split('. Instead,')
  const expected = [...new Set(
    lines
      .filter(line => /^A .+ token based on:$/.test(line))
      .map(line => line.replace(/^A (.+) token based on:$/, '$1'))
      .filter(type => type !== 'space')
      .map(type => tokenLabels[type] ?? type)
  )]

  const parts = [header, `${reason}.`]
  if (expected.length > 0) parts.push(`Expected one of: ${expected.join(', ')}`)
  return parts.join('\n')
}

export class QueryBuilder {
  public fields?: string[]
  public maxRows: number
  public dateFrom: string
  public dateTo: string
  public sortField: string
  public sortOrder: SearchQuerySortOrder
  public langs?: string[]
  public queryString?: string
  public startAt?: number
  public tz?: string
  public dateGap?: string
  public wantCluster?: boolean
  public wantedFacets?: WantedFacets
  public multiSort?: SortEntry[]
  public exactNumFound?: boolean | number
  public dateField?: string
  private additionalParams: SearchQuery[] = []

  constructor (fields?: string[]) {
    if (fields) this.fields = fields
    this.maxRows = defaultSearchParams.size
    this.dateFrom = defaultSearchParams.dateFrom
    this.dateTo = defaultSearchParams.dateTo
    this.sortField = defaultSearchParams.sortField
    this.sortOrder = defaultSearchParams.sortOrder
  }

  public setMaxRows (maxRows?: number) {
    if (maxRows === undefined || maxRows < 0) throw new Error('maxRows is required')
    if (maxRows > maxRowsByRequest) throw new Error(`maxRows cannot be greater than ${maxRowsByRequest}`)
    this.maxRows = maxRows
    return this
  }

  public setDateRange (from?: string, to?: string) {
    if (from) this.dateFrom = from
    if (to) this.dateTo = to
    return this
  }

  public setSort (field?: string, order?: SearchQuerySortOrder) {
    if (field) this.sortField = field
    if (order) this.sortOrder = order
    return this
  }

  public setLangs (langs?: string[]) {
    if (langs && Array.isArray(langs)) this.langs = langs
    return this
  }

  public setQuery (query?: string) {
    if (query) this.queryString = query
    return this
  }

  public setStartAt (startAt?: number) {
    if (startAt !== undefined) this.startAt = startAt
    return this
  }

  public setTz (tz?: string) {
    if (tz) this.tz = tz
    return this
  }

  public setExactNumFound (exactNumFound?: boolean | number) {
    if (exactNumFound !== undefined) this.exactNumFound = exactNumFound
    return this
  }

  public setDateField (dateField?: string) {
    if (dateField) this.dateField = dateField
    return this
  }

  public setDateGap (dateGap?: string) {
    if (dateGap) this.dateGap = dateGap
    return this
  }

  public setWantCluster (wantCluster?: boolean) {
    if (wantCluster !== undefined) this.wantCluster = wantCluster
    return this
  }

  public setWantedFacets (wantedFacets?: WantedFacets) {
    if (wantedFacets) this.wantedFacets = wantedFacets
    return this
  }

  public setMultiSort (sort?: SortEntry[]) {
    if (sort) this.multiSort = sort
    return this
  }

  /** Ajoute des filtres par champ, combinés en ET avec la requête (voir `toConditions`). */
  public addFilters (filters: SearchFilters = {}) {
    for (const [name, value] of Object.entries(filters)) {
      this.additionalParams.push(...toConditions(name, value))
    }
    return this
  }

  private concatenateQueryAndParams () {
    const parsedQuery = this.parseQueryString(this.queryString)

    if (this.additionalParams.length > 0) {
      return {
        and: this.additionalParams.concat(parsedQuery || [])
      } as SearchQuery
    }

    return parsedQuery as SearchQuery
  }

  public build () {
    const request: SearchRequest = {
      dateRange: {
        ...(this.dateField ? { targetField: this.dateField } : {}),
        from: this.dateFrom,
        to: this.dateTo
      },
      maxRows: this.maxRows,
      sortField: this.sortField,
      sortOrder: this.sortOrder,
      lang: this.langs && this.langs.length > 0 && (!this.queryString || !this.queryString.includes('lang:')) ? this.langs.join(',') : undefined,
      fields: this.fields,
      query: this.concatenateQueryAndParams()
    }

    if (this.startAt !== undefined) request.startAt = this.startAt
    if (this.tz) request.tz = this.tz
    if (this.dateGap) request.dateGap = this.dateGap
    if (this.wantCluster !== undefined) request.wantCluster = this.wantCluster
    if (this.wantedFacets) request.wantedFacets = this.wantedFacets
    if (this.multiSort) request.sort = this.multiSort
    if (this.exactNumFound !== undefined) request.exactNumFound = this.exactNumFound

    return request
  }

  private serializeExpression = (expression: ExpressionToken, exclude = false, field?: FieldToken) => {
    if (expression.type !== 'LiteralExpression') {
      throw new Error(`missing value after "${field?.name ?? ''}:"`)
    }
  
    const fieldName = field?.name || 'all'
    const fieldOperator = exclude ? 'exclude' : fullTextSearchFields.includes(fieldName) ? 'contains' : 'in'
    const fieldValue = expression.quoted && fieldOperator === 'contains' ? [quote(expression.value)] : [normalize(String(expression.value))]
  
    if (fieldOperator === 'contains' && translatedSearchFields.includes(fieldName)) {
      const langs =  this.langs && this.langs.length > 0 ? this.langs : langsWithTranslation
      return [{
        name: fieldName,
        [fieldOperator]: fieldValue
      },
      ...langs.map(lang => ({
        name: `translated.${lang}.${fieldName}`,
        [fieldOperator]: fieldValue
      }))]
    } else {
      return [{
        name: fieldName,
        [fieldOperator]: fieldValue
      }]
    }
  }

  private serializeTag = (ast: TagToken, exclude = false) => {
    const {
      field,
      expression
    } = ast
  
    if (field.type === 'ImplicitField') {
      return this.serializeExpression(expression, exclude)
    }
  
    return this.serializeExpression(expression, exclude, field)
  }

  private serialize = (ast: Ast, exclude = false): SearchQuery | undefined => {
    if (ast.type === 'ParenthesizedExpression') {
      return this.serialize(ast.expression, exclude)
    }
  
    if (ast.type === 'Tag') {
      return {
        ['or']: this.serializeTag(ast, exclude)
      }
    }
  
    if (ast.type === 'LogicalExpression') {
      const operator = ast.operator.operator.toLowerCase()
      // De Morgan: NOT distributes over AND/OR by flipping the connective, e.g. NOT (a OR b) = NOT a AND NOT b.
      const connective = exclude ? (operator === 'and' ? 'or' : 'and') : operator
      return {
        [connective]: [this.serialize(ast.left, exclude), this.serialize(ast.right, exclude)]
      }
    }
  
    if (ast.type === 'UnaryOperator') {
      return this.serialize(ast.operand, !exclude)
    }
  
    if (ast.type === 'EmptyExpression') {
      return
    }
  
    throw new Error('Unexpected AST type.')
  }

  // nearley's parser.results is typed `any[]`; the grammar guarantees each
  // result matches the Ast shape declared in grammar/grammar.d.ts.
  private runParser (queryToFeed: string, typedQuery: string): Ast {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar))
    try {
      parser.feed(queryToFeed)
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : String(error)
      throw Object.assign(
        new Error(`Failed to parse query "${typedQuery}": ${formatParseError(rawMessage)}`),
        { cause: error }
      )
    }
    if (parser.results.length === 0) {
      const lexerState = parser.lexerState as { line?: number, col?: number } | undefined
      const position = lexerState?.line !== undefined && lexerState.col !== undefined
        ? ` at line ${lexerState.line}, col ${lexerState.col}`
        : ''
      throw new Error(`Failed to parse query "${typedQuery}": incomplete query, unexpected end of input${position}`)
    }
    if (parser.results.length > 1) {
      console.warn(`Ambiguous query "${typedQuery}": ${parser.results.length} possible parses`)
    }
    return parser.results[0] as Ast
  }

  public parseQueryString (queryString?: string) {
    if (!queryString) return
    const typedQuery = querySchema.parse(queryString)
    const balancedQuery = balanceQuery(typedQuery)
    let parsedQuery: Ast
    try {
      parsedQuery = this.runParser(balancedQuery, typedQuery)
    } catch (error) {
      // Re-report against what the user typed, never against an auto-added `)`/`"`.
      if (balancedQuery === typedQuery) throw error
      parsedQuery = this.runParser(typedQuery, typedQuery)
    }
    try {
      return this.serialize(parsedQuery)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw Object.assign(
        new Error(`Failed to parse query "${typedQuery}": ${message}`),
        { cause: error }
      )
    }
  }
}
