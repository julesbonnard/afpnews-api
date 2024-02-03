import { Request } from '../types'
import * as nearley from 'nearley'
import grammar from '../grammar'
import { normalize } from './normalizer'
import { z } from 'zod'

const querySchema = z.string().default('')

const quote = (value: string) => {
  return `"${value}"`
}

export type ComparisonOperator = ':'
export type ComparisonOperatorToken = {
  operator: ComparisonOperator
  type: 'ComparisonOperator'
}
export type ImplicitFieldToken = {
  type: 'ImplicitField'
}
export type FieldToken = {
  name: string
  path?: readonly string[]
  type: 'Field'
} & ({
  quoted: false
} | {
  quoted: true
  quotes: 'double'
})
export type LiteralExpressionToken = {
  type: 'LiteralExpression'
} & ({
  quoted: false
  value: boolean | string | null
} | {
  quoted: true
  quotes: 'double'
  value: string
})
export type EmptyExpression = {
  type: 'EmptyExpression'
}
export type ExpressionToken = EmptyExpression | LiteralExpressionToken
export type BooleanOperatorToken = {
  operator: 'AND' | 'OR'
  type: 'BooleanOperator'
}
export type ImplicitBooleanOperatorToken = {
  operator: 'AND'
  type: 'ImplicitBooleanOperator'
}
export type TagToken = {
  expression: ExpressionToken
  field: FieldToken | ImplicitFieldToken
  operator: ComparisonOperatorToken
  type: 'Tag'
}
export type LogicalExpressionToken = {
  left: ParserAst
  operator: BooleanOperatorToken | ImplicitBooleanOperatorToken
  right: ParserAst
  type: 'LogicalExpression'
}
export type UnaryOperatorToken = {
  operand: ParserAst
  operator: '-' | 'NOT'
  type: 'UnaryOperator'
}
export type ParenthesizedExpressionToken = {
  expression: ParserAst
  type: 'ParenthesizedExpression'
}
export type ParserAst = EmptyExpression | LogicalExpressionToken | ParenthesizedExpressionToken | TagToken | UnaryOperatorToken
export type Ast = ParserAst & {
  getValue?: (subject: unknown) => unknown
  left?: Ast
  operand?: Ast
  right?: Ast
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

export const serialize = (ast: Ast, exclude = false): Request | undefined => {
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

export default function buildQuery (query: unknown) {
  const typedQuery = querySchema.parse(query)
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar))
  parser.feed(typedQuery)
  if (parser.results.length === 0) return
  const parsedQuery = parser.results[0]
  return serialize(parsedQuery)
}
