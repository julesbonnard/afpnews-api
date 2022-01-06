@{%
	// Moo lexer documention is here:
	// https://github.com/no-context/moo

	const moo = require('moo')
	const lexer = moo.compile({
	  ws: / +/,
	  doublequoted: /"(?:[^"\\]|\\.)*"/,
	  singlequoted: /'(?:[^'\\]|\\.)*'/,
	  facet: {
		  match: /[a-zA-Z\._]+[=:]/,
		  value: (s) => s.slice(0, -1)
	  },
	  lparen: '(',
      rparen: ')',
	  excludeword: 'NOT',
	  excludeoperator: /-|!/,
	  and: 'AND',
	  andbis: '&&',
	  or: 'OR',
	  orbis: '||',
	  word: /[a-zA-ZÀ-ÿ0-9'\.-]+/
	})
	
	const fullTextFacet = ['all', 'news', 'title', 'headline', 'advisory', 'comment', 'copyright', 'disclaimer', 'doc_creator_name', 'summary']

	function logical (left, right, operator = 'and') {
		if (operator === 'and' && left.name && right.name && left.name === right.name) {
			const leftKey = left.and ? 'and' : 'exclude'
			const rightKey = right.and ? 'and' : 'exclude'
			if (leftKey === rightKey && left.fullText === right.fullText) {
				return {
					...left,
					[leftKey]: [...left[leftKey], ...right[rightKey]]
				}
			}
		}
		left = (left[operator] && !left.name) ? left[operator] : [left]
		right = (right[operator] && !right.name) ? right[operator] : [right]
		return {
			[operator]: [...left, ...right]
		}
	}

	function inverse (data) {
		if (data.name) {
			return {
				name: data.name,
				fullText: data.fullText,
				[data.and ? 'exclude' : 'and']: data[data.and ? 'and' : 'exclude']
			}
		}
		const operator = data.or ? 'or' : 'and'
		return {
			[operator] : data[operator].map(inverse)
		}
	}

	function handleQuotes (text, isFullText) {
		if (!isFullText && (text[0] === "'" || text[0] === "\"")) {
			return text.slice(1, -1)
		}
		return text
	}

	function applyFacet (data, facetName) {
		const isFullText = fullTextFacet.includes(facetName)
		if (data.name) {
			const key = data.and ? 'and' : 'exclude'
			return {
				name: facetName,
				fullText: isFullText,
				[key]: data[key].map(d => handleQuotes(d, isFullText))
			}
		}
		const operator = data.or ? 'or' : 'and'
		return {
			[operator] : data[operator].map((d) => applyFacet(d, facetName))
		}
	}

	function concatenateText (left, right, key = 'and') {
		return {
			[key]: right ? [...left[key], ...right[key]] : [left.text],
			name: 'all',
			fullText: true
		}
	}
%}

# Pass your lexer with @lexer:
@lexer lexer

STATEMENT ->
STATEMENT __ STATEMENT {% ([left,, right]) => logical(left, right) %}
| STATEMENT __ OR __ STATEMENT {% ([left,,operator,,right]) => logical(left, right, 'or') %}
| STATEMENT __ AND __ STATEMENT {% ([left,,operator,,right]) => logical(left, right, 'and') %}
| EXCLUDE %lparen STATEMENT %rparen {% ([,, statement]) => inverse(statement) %}
| %lparen STATEMENT %rparen {% ([, statement]) => statement %}
| NODE_FACET {% id %}
| NODE_TEXT {% id %}

NODE_FACET -> 
EXCLUDE %facet %lparen NODE_TEXT %rparen {% ([, facet,, node]) => inverse(applyFacet(node, facet.value)) %}
| %facet EXCLUDE %lparen NODE_TEXT %rparen {% ([facet,,, node]) => inverse(applyFacet(node, facet.value)) %}
| %facet EXCLUDE_TEXT_EXPRESSION {% ([facet, node]) => applyFacet(node, facet.value) %}
| %facet %lparen NODE_TEXT %rparen {% ([facet,, node]) => applyFacet(node, facet.value) %}
| %facet TEXT_EXPRESSION {% ([facet, node]) => applyFacet(node, facet.value) %}

NODE_TEXT -> 
%lparen NODE_TEXT %rparen {% ([, node]) => node %}
| EXCLUDE %lparen NODE_TEXT %rparen {% ([,, node]) => inverse(node) %}
| NODE_TEXT __ OR __ NODE_TEXT {% ([left,, operator,, right]) => logical(left, right, 'or') %}
| NODE_TEXT __ AND __ NODE_TEXT {% ([left,, operator,, right]) => logical(left, right, 'and') %}
| NODE_TEXT __ NODE_TEXT {% ([left,, right]) => logical(left, right) %}
| MULTIPLE_EXCLUDE_TEXT_EXPRESSION {% id %}
| MULTIPLE_TEXT_EXPRESSION {% id %}

MULTIPLE_TEXT_EXPRESSION -> TEXT_EXPRESSION {% id %}
| MULTIPLE_TEXT_EXPRESSION __ TEXT_EXPRESSION {% ([left,, right]) => concatenateText(left, right) %}
| MULTIPLE_TEXT_EXPRESSION __ AND __ TEXT_EXPRESSION {% ([left,,,, right]) => concatenateText(left, right) %}

MULTIPLE_EXCLUDE_TEXT_EXPRESSION -> EXCLUDE_TEXT_EXPRESSION {% id %}
| MULTIPLE_EXCLUDE_TEXT_EXPRESSION __ EXCLUDE_TEXT_EXPRESSION {% ([left,, right]) => concatenateText(left, right, 'exclude') %}
| MULTIPLE_EXCLUDE_TEXT_EXPRESSION __ AND __ EXCLUDE_TEXT_EXPRESSION {% ([left,,,, right]) => concatenateText(left, right, 'exclude') %}

EXCLUDE_TEXT_EXPRESSION -> EXCLUDE TEXT {% ([, text]) => concatenateText(text, null, 'exclude') %}

TEXT_EXPRESSION -> TEXT {% ([text]) => concatenateText(text) %}

TEXT -> %word {% id %} | QUOTED {% id %}

EXCLUDE -> %excludeoperator {% id %} | %excludeword __ {% id %}

OPERATOR -> AND {% id %} | OR {% id %}
AND -> (%and | %andbis) {% () => ({ type: 'and' }) %}
OR -> (%or | %orbis) {% () => ({ type: 'or' }) %}

QUOTED -> SINGLEQUOTED {% id %} | DOUBLEQUOTED {% id %}
SINGLEQUOTED -> %singlequoted {% id %}
DOUBLEQUOTED -> %doublequoted {% id %}

_ -> %ws:? {% id %}
__ -> %ws {% id %}