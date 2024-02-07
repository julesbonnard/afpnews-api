import { defaultSearchParams } from '../default-search-params'
import { AdditionalParamValue, SearchQuery, SearchRequest } from "../types"
import nearley from 'nearley'
import { default as grammar } from '../grammar'
import { normalize } from './normalizer'
import { z } from 'zod'

const querySchema = z.string().default('')

const quote = (value: string) => {
  return `"${value}"`
}

export class QueryBuilder {
  public fields?: string[]
  public maxRows: number
  public dateFrom: string
  public dateTo: string
  public sortField: string
  public sortOrder: string
  public langs?: string[]
  public queryString?: string
  private additionalParams: SearchQuery[] = []

  constructor (fields?: string[]) {
    if (this.fields) this.fields = fields
    this.maxRows = defaultSearchParams.size
    this.dateFrom = defaultSearchParams.dateFrom
    this.dateTo = defaultSearchParams.dateTo
    this.sortField = defaultSearchParams.sortField
    this.sortOrder = defaultSearchParams.sortOrder
    return this
  }

  public setMaxRows (maxRows?: number) {
    if (!maxRows) throw new Error('maxRows is required')
    if (maxRows > 1000) throw new Error('maxRows cannot be greater than 1000')
    this.maxRows = maxRows
    return this
  }

  public setDateRange (from?: string, to?: string) {
    if (from) this.dateFrom = from
    if (to) this.dateTo = to
    return this
  }

  public setSort (field?: string, order?: string) {
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

  public addAdditionalParams (additionalParams?: { [key: string]: AdditionalParamValue | undefined }) {
    if (!additionalParams) return this
    for (const [key, value] of Object.entries(additionalParams)) {
      if (!value) continue
      this.addAdditionalParam(key, value)
    }
    return this
  }

  private addAdditionalParam (name: string, value: AdditionalParamValue) {
    if (!value) return
    const param: SearchQuery = {
      name
    }

    if (typeof value === 'number' || typeof value === 'string') {
      param['in'] = [value]
    } else if (Array.isArray(value)) {
      if (value.length === 0) return
      param['in'] = value
    } else if (value.in) {
      param['in'] = value.in
    } else if (value.exclude) {
      param['exclude'] = value.exclude
    }
    this.additionalParams.push(param)
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
    return {
      dateRange: {
        from: this.dateFrom,
        to: this.dateTo
      },
      maxRows: this.maxRows,
      sortField: this.sortField,
      sortOrder: this.sortOrder,
      lang: this.langs && this.langs.length > 0 && (!this.queryString || !this.queryString.includes('lang:')) ? this.langs.join(',') : undefined,
      fields: this.fields,
      query: this.concatenateQueryAndParams()
    } as SearchRequest
  }

  private serializeExpression = (expression: ExpressionToken, exclude = false, field?: FieldToken) => {
    if (expression.type !== 'LiteralExpression') throw new Error('Unexpected expression token')
  
    const fieldName = field?.name || 'all'
    const fieldOperator = exclude ? 'exclude' : ['all', 'title', 'news'].includes(fieldName) ? 'contains' : 'in'
    const fieldValue = expression.quoted && fieldOperator === 'contains' ? [quote(expression.value)] : [normalize(String(expression.value))]
  
    if (fieldOperator === 'contains') {
      const langs =  this.langs && this.langs.length > 0 ? this.langs : ['fr', 'en', 'es', 'de', 'pt', 'ar']
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
      return {
        [ast.operator.operator.toLowerCase()]: [this.serialize(ast.left, exclude), this.serialize(ast.right, exclude)]
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

  public parseQueryString (queryString?: string) {
    if (!queryString) return
    const typedQuery = querySchema.parse(queryString)
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar))
    parser.feed(typedQuery)
    if (parser.results.length === 0) return
    const parsedQuery = parser.results[0]
    return this.serialize(parsedQuery)
  }
}
