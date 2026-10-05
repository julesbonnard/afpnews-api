@preprocessor typescript

@{%
  // Moo lexer documentation is here:
  // https://github.com/no-context/moo

  import moo from 'moo'

  // All casings of a keyword (AND, And, aNd, ...), not just a few hardcoded ones.
  const caseVariants = (word: string): string[] =>
    word.length === 0
      ? ['']
      : caseVariants(word.slice(1)).flatMap(rest => [word[0].toLowerCase() + rest, word[0].toUpperCase() + rest])

  const lexer = moo.compile({
    space: { match: /\s/, lineBreaks: true },
    lparen: '(',
    rparen: ')',
    lbracket: '[',
    rbracket: ']',
    dquote: '"',
    backslash: '\\',
    is: ':',
    word: {
      match: /[,'\._*?@#%$a-zA-Z0-9\u0080-￿-]+/,
      type: moo.keywords({
        and: caseVariants('and'),
        or: caseVariants('or'),
        not: caseVariants('not')
      })
    }
  });

  const buildField = (raw: { name: string, quoted: boolean, quotes?: string }) => {
    const negated = !raw.quoted && raw.name.startsWith('-') && raw.name.length > 1
    const field: { type: string, name: string, quoted: boolean, quotes?: string } = {
      type: 'Field',
      name: negated ? raw.name.slice(1) : raw.name,
      quoted: raw.quoted
    }
    if (raw.quotes) field.quotes = raw.quotes
    return { field, negated }
  }

  const negate = (negated: boolean, node: any) => negated ? { type: 'UnaryOperator', operator: 'NOT', operand: node } : node

  // Rewrites every ImplicitField leaf of a `field:(...)` group to the group's own field, so `title:(a OR b)` reads as `title:a OR title:b`.
  const applyFieldToGroup = (field: unknown, node: any): any => {
    if (node.type === 'Tag' && node.field?.type === 'ImplicitField') return { ...node, field }
    if (node.type === 'LogicalExpression') return { ...node, left: applyFieldToGroup(field, node.left), right: applyFieldToGroup(field, node.right) }
    if (node.type === 'UnaryOperator') return { ...node, operand: applyFieldToGroup(field, node.operand) }
    if (node.type === 'ParenthesizedExpression') return { ...node, expression: applyFieldToGroup(field, node.expression) }
    return node
  }
%}

# Pass your lexer with @lexer:
@lexer lexer

main -> _ expr _ {% (data) => data[1] %}

# Double-quoted string with escape support
dqstring -> %dquote dqchar:* %dquote {% (data) => data[1].join('') %}

dqchar ->
    %word {% (data) => data[0].text || data[0].value %}
  | %space {% (data) => data[0].text || data[0].value %}
  | %lparen {% () => '(' %}
  | %rparen {% () => ')' %}
  | %lbracket {% () => '[' %}
  | %rbracket {% () => ']' %}
  | %is {% () => ':' %}
  | %and {% (data) => data[0].text %}
  | %or {% (data) => data[0].text %}
  | %not {% (data) => data[0].text %}
  | %backslash %dquote {% () => '"' %}
  | %backslash %backslash {% () => '\\' %}
  | %backslash %word {% (data) => {
      const c = (data[1].text || data[1].value)[0]
      switch (c) {
        case 'n': return '\n' + (data[1].text || data[1].value).slice(1)
        case 't': return '\t' + (data[1].text || data[1].value).slice(1)
        default: return c + (data[1].text || data[1].value).slice(1)
      }
    } %}

comparison_operator ->
  %is {% () => ({operator: ':', type: 'ComparisonOperator'}) %}

boolean_operator ->
    %or {% () => ({operator: 'OR', type: 'BooleanOperator'}) %}
  | %and {% () => ({operator: 'AND', type: 'BooleanOperator'}) %}

_ -> %space:*
__ -> %space:+

# AND, OR and implicit AND (space-separated terms) share one left-assoc precedence tier; NOT binds tighter; parens override.
expr ->
    expr _ boolean_operator _ unary_expr {% (data) => ({
      type: 'LogicalExpression',
      operator: data[2],
      left: data[0],
      right: data[4]
    }) %}
  | expr __ unary_expr {% (data) => ({
      type: 'LogicalExpression',
      operator: {
        operator: 'AND',
        type: 'ImplicitBooleanOperator'
      },
      left: data[0],
      right: data[2]
    }) %}
  | unary_expr {% id %}

unary_expr ->
    %not __ primary {% (data) => ({
      type: 'UnaryOperator',
      operator: 'NOT',
      operand: data[2]
    }) %}
  | primary {% id %}

primary ->
    %lparen _ %rparen {% () => ({type: 'ParenthesizedExpression', expression: {
      type: 'EmptyExpression'
    }}) %}
  | %lparen _ expr _ %rparen {% data => ({type: 'ParenthesizedExpression', expression: data[2]}) %}
  | tag_expression {% id %}

tag_expression ->
    field comparison_operator %lparen _ expr _ %rparen {% data => {
      const { field, negated } = buildField(data[0])
      return negate(negated, applyFieldToGroup(field, data[4]))
    } %}
  # Intervalle `field:[from TO to]` ; `*` = borne ouverte. `TO` n'est pas un mot-clé du lexer (le mot
  # « to » reste cherchable en texte libre) : il n'est reconnu qu'ici, entre crochets.
  | field comparison_operator %lbracket _ range_bound __ %word __ range_bound _ %rbracket {% (data, _location, reject) => {
      if (data[6].text.toUpperCase() !== 'TO') return reject
      const { field, negated } = buildField(data[0])
      return negate(negated, {
        type: 'Tag',
        field,
        operator: data[1],
        expression: { type: 'RangeExpression', from: data[4], to: data[8] }
      })
    } %}
  | field comparison_operator expression {% data => {
      const { field, negated } = buildField(data[0])
      return negate(negated, {
        type: 'Tag',
        field,
        operator: data[1],
        expression: data[2].expression
      })
    } %}
  | field comparison_operator {% data => {
      const { field, negated } = buildField(data[0])
      return negate(negated, {
        type: 'Tag',
        field,
        operator: data[1],
        expression: {
          type: 'EmptyExpression'
        }
      })
    } %}
  | expression {% (data) => {
      const tag = data[0]
      const expr = tag.expression
      const negated = !expr.quoted && typeof expr.value === 'string' && expr.value.startsWith('-') && expr.value.length > 1
      const stripped = negated ? { ...tag, expression: { ...expr, value: expr.value.slice(1) } } : tag
      return negate(negated, { field: {type: 'ImplicitField'}, ...stripped })
    } %}

field ->
    %word {% ([data]) => ({type: 'LiteralExpression', name: data.text, quoted: false}) %}
  | dqstring {% ([data]) => ({type: 'LiteralExpression', name: data, quoted: true, quotes: 'double'}) %}

expression ->
    unquoted_value {% ([value]) => ({
      type: 'Tag',
      expression: {
        type: 'LiteralExpression',
        quoted: false,
        value: value.text
      }
    }) %}
  | dqstring {% (data) => ({type: 'Tag', expression: {type: 'LiteralExpression', quoted: true, quotes: 'double', value: data.join('')}}) %}

unquoted_value -> %word {% id %}

range_bound ->
    %word {% ([token]) => token.text === '*' ? undefined : token.text %}
  | dqstring {% ([value]) => value %}
