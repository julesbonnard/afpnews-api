type ComparisonOperator = ':'
type ComparisonOperatorToken = {
  operator: ComparisonOperator
  type: 'ComparisonOperator'
}
type ImplicitFieldToken = {
  type: 'ImplicitField'
}
type FieldToken = {
  name: string
  path?: readonly string[]
  type: 'Field'
} & ({
  quoted: false
} | {
  quoted: true
  quotes: 'double'
})
type LiteralExpressionToken = {
  type: 'LiteralExpression'
} & ({
  quoted: false
  value: boolean | string | null
} | {
  quoted: true
  quotes: 'double'
  value: string
})
type EmptyExpression = {
  type: 'EmptyExpression'
}
type ExpressionToken = EmptyExpression | LiteralExpressionToken
type BooleanOperatorToken = {
  operator: 'AND' | 'OR'
  type: 'BooleanOperator'
}
type ImplicitBooleanOperatorToken = {
  operator: 'AND'
  type: 'ImplicitBooleanOperator'
}
type TagToken = {
  expression: ExpressionToken
  field: FieldToken | ImplicitFieldToken
  operator: ComparisonOperatorToken
  type: 'Tag'
}
type LogicalExpressionToken = {
  left: ParserAst
  operator: BooleanOperatorToken | ImplicitBooleanOperatorToken
  right: ParserAst
  type: 'LogicalExpression'
}
type UnaryOperatorToken = {
  operand: ParserAst
  operator: '-' | 'NOT'
  type: 'UnaryOperator'
}
type ParenthesizedExpressionToken = {
  expression: ParserAst
  type: 'ParenthesizedExpression'
}
type ParserAst = EmptyExpression | LogicalExpressionToken | ParenthesizedExpressionToken | TagToken | UnaryOperatorToken
type Ast = ParserAst & {
  getValue?: (subject: unknown) => unknown
  left?: Ast
  operand?: Ast
  right?: Ast
}