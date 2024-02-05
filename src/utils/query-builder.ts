import { SearchQuery } from '../types'
import nearley from 'nearley'
import { default as grammar } from '../grammar'
import { normalize } from './normalizer'
import { z } from 'zod'

const querySchema = z.string().default('')

const quote = (value: string) => {
  return `"${value}"`
}

const serializeExpression = (expression: ExpressionToken, exclude = false, field?: FieldToken) => {
  if (expression.type !== 'LiteralExpression') throw new Error('Unexpected expression token')

  const fieldName = field?.name || 'all'
  const fieldOperator = exclude ? 'exclude' : ['all', 'title', 'news'].includes(fieldName) ? 'contains' : 'in'
  const fieldValue = expression.quoted && fieldOperator === 'contains' ? [quote(expression.value)] : [normalize(String(expression.value))]

  const results = [{
    name: fieldName,
    [fieldOperator]: fieldValue
  }]

  if (fieldOperator === 'contains') {
    results.push({
      name: `translated.fr.${fieldName}`,
      [fieldOperator]: fieldValue
    })
  }

  return results
}

const serializeTag = (ast: TagToken, exclude = false) => {
  const {
    field,
    expression
  } = ast

  if (field.type === 'ImplicitField') {
    return serializeExpression(expression, exclude)
  }

  return serializeExpression(expression, exclude, field)
}

export const serialize = (ast: Ast, exclude = false): SearchQuery | undefined => {
  if (ast.type === 'ParenthesizedExpression') {
    return serialize(ast.expression, exclude)
  }

  if (ast.type === 'Tag') {
    return {
      ['or']: serializeTag(ast, exclude)
    }
  }

  if (ast.type === 'LogicalExpression') {
    return {
      [ast.operator.operator.toLowerCase()]: [serialize(ast.left, exclude), serialize(ast.right, exclude)]
    }
  }

  if (ast.type === 'UnaryOperator') {
    return serialize(ast.operand, !exclude)
  }

  if (ast.type === 'EmptyExpression') {
    return
  }

  throw new Error('Unexpected AST type.')
}

export function buildQuery (query: unknown) {
  const typedQuery = querySchema.parse(query)
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar))
  parser.feed(typedQuery)
  if (parser.results.length === 0) return
  const parsedQuery = parser.results[0]
  return serialize(parsedQuery)
}
