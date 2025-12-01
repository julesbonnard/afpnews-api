@preprocessor typescript

@{%
	// Moo lexer documention is here:
	// https://github.com/no-context/moo

  import moo from 'moo'
	const lexer = moo.compile({
	newline: { match: /\r?\n/, lineBreaks: true },
		space: { match: /[\t\s]/, lineBreaks: true },
	  lparen: '(',
	  rparen: ')',
	  dquote: '"',
	  and: 'AND',
	  or: 'OR',
	  not: 'NOT',
	  is: ':',
	  word: /[,'\._*?@#%$a-zA-Z0-9\u0080-\uFFFF-]+/
	});
%}

# Pass your lexer with @lexer:
@lexer lexer

main -> _ logical_expression _ {% (data) => data[1] %}

# Double-quoted string
dqstring -> %dquote [^"]:* %dquote {% (data) => data[1].join('') %}

comparison_operator ->
    %is {% () => ({operator: ':', type: 'ComparisonOperator'}) %}
	
boolean_operator ->
    %or {% () => ({operator: 'OR', type: 'BooleanOperator'}) %}
  | %and {% () => ({operator: 'AND', type: 'BooleanOperator'}) %}
 
boolean_primary ->
  tag_expression {% id %}

post_boolean_primary ->
    __ %lparen _ two_op_logical_expression _ %rparen {% d => ({type: 'ParenthesizedExpression', expression: d[3]}) %}
  | __ boolean_primary {% d => d[1] %}
  
_ -> %space:?
__ -> %space:+

logical_expression -> two_op_logical_expression {% id %}

two_op_logical_expression ->
    pre_two_op_logical_expression boolean_operator post_one_op_logical_expression {% (data) => ({
      type: 'LogicalExpression',
      operator: data[1],
      left: data[0],
      right: data[2]
    }) %}
  | pre_two_op_implicit_logical_expression __ post_one_op_implicit_logical_expression {% (data) => ({
      type: 'LogicalExpression',
      operator: {
        operator: 'AND',
        type: 'ImplicitBooleanOperator'
      },
      left: data[0],
      right: data[2]
    }) %}
	| one_op_logical_expression {% d => d[0] %}

pre_two_op_implicit_logical_expression ->
    two_op_logical_expression {% d => d[0] %}
  | %lparen _ two_op_logical_expression _ %rparen {% d => ({type: 'ParenthesizedExpression', expression: d[2]}) %}

post_one_op_implicit_logical_expression ->
    one_op_logical_expression {% d => d[0] %}
  | %lparen _ one_op_logical_expression _ %rparen {% d => ({type: 'ParenthesizedExpression', expression: d[2]}) %}

pre_two_op_logical_expression ->
    two_op_logical_expression __ {% d => d[0] %}
  | %lparen _ two_op_logical_expression _ %rparen {% d => ({type: 'ParenthesizedExpression', expression: d[2]}) %}

one_op_logical_expression ->
    %lparen _ %rparen {% _ => ({type: 'ParenthesizedExpression', expression: {
      type: 'EmptyExpression'
    }}) %}
  | %lparen _ two_op_logical_expression _ %rparen {% d => ({type: 'ParenthesizedExpression', expression: d[2]}) %}
	|	%not post_boolean_primary {% (data) => {
  return {
    type: 'UnaryOperator',
    operator: 'NOT',
    operand: data[1]
  };
} %}
| boolean_primary {% d => d[0] %}
  
post_one_op_logical_expression ->
    __ one_op_logical_expression {% d => d[1] %}
  | %lparen _ one_op_logical_expression _ %rparen {% d => ({type: 'ParenthesizedExpression', expression: d[2]}) %}

tag_expression ->
    field comparison_operator expression {% data => {
    const field = {
      type: 'Field',
      name: data[0].name,
      quoted: data[0].quoted,
      quotes: data[0].quotes
    };

    if (!data[0].quotes) {
      delete field.quotes;
    }

    return {
      field,
      operator: data[1],
      ...data[2]
    }
  } %}
  | field comparison_operator {% data => {
    const field = {
      type: 'Field',
      name: data[0].name,
      quoted: data[0].quoted,
      quotes: data[0].quotes
    };

    if (!data[0].quotes) {
      delete field.quotes;
    }

    return {
      type: 'Tag',
      field,
      operator: data[1],
      expression: {
        type: 'EmptyExpression'
      }
    }
  } %}
  | expression {% (data) => {
    return {field: {type: 'ImplicitField'}, ...data[0]};
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