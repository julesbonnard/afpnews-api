import { Request } from '../types'
import {
  type LiqeQuery,
  parse,
  ExpressionToken,
  FieldToken,
  TagToken
} from 'liqe'
import { normalize } from './normalizer'
import { z } from 'zod'

const querySchema = z.string().default('')

const quote = (value: string, quotes: 'double' | 'single') => {
  if (quotes === 'double') {
    return `"${value}"`
  }

  if (quotes === 'single') {
    return `'${value}'`
  }

  return value
}

const serializeExpression = (expression: ExpressionToken, exclude = false, field?: FieldToken) => {
  if (expression.type === 'LiteralExpression') {
    if (expression.quoted) {
      return {
        name: field?.name || 'all',
        [exclude ? 'exclude' : 'in']: [quote(expression.value, expression.quotes)]
      }
    }

    return {
      name: field?.name || 'all',
      [exclude ? 'exclude' : 'in']: [normalize(String(expression.value))]
    }
  }

  // if (expression.type === 'EmptyExpression') {
  //   return ''
  // }

  throw new Error('Unexpected expression token')
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

export const serialize = (ast: LiqeQuery, exclude = false): Request | undefined => {
  if (ast.type === 'ParenthesizedExpression') {
    return serialize(ast.expression, exclude)
  }

  if (ast.type === 'Tag') {
    return serializeTag(ast, exclude)
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
  return serialize(parse(querySchema.parse(query)))
}
