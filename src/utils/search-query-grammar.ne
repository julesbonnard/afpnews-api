@{%
	// Moo lexer documention is here:
	// https://github.com/no-context/moo

	import moo from 'moo'
	const lexer = moo.compile({
	  ws: / +/,
	  doublequoted: {
		  match: /"(?:[^"\\]|\\.)*"/,
		  value: (s: string) => s.slice(1, -1)
	  },
	  singlequoted: {
		  match: /'(?:[^'\\]|\\.)*'/,
		  value: (s: string) => s.slice(1, -1)
	  },
	  facet: {
		  match: /[a-zA-Z\._]+[=:]/,
		  value: (s: string) => s.slice(0, -1)
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
	
	function recursive ([left, rest]: [any, any]) {
		if (rest && rest.length > 0) {
			const [, operator,, right] = rest.shift()
			const operatorType = operator.type
			return {
				[operatorType]: [left, recursive([right, rest])].flat()
			}
		}
		return left
	}

	function implicit ([left, rest]: [any, any]) {
		return {
				and: [left, ...rest.map(([, right]: [any, any]) => right)]
			}
	}

	function inverse (data: any) {
		if (data.in) {
			return {
				...data,
				in: undefined,
				exclude: data.in
			}
		}
		if (data.exclude) {
			return {
				...data,
				in: data.exclude,
				exclude: undefined
			}
		}
		const operator = data.or ? 'or' : 'and'
		return {
			[operator] : data[operator].map(inverse)
		}
	}

	function applyFacet (data: any, facetName: string) {
		if (data.in || data.exclude) {
			return {
				...data,
				name: facetName,
				fullText: fullTextFacet.includes(facetName)
			}
		}
		const operator = data.or ? 'or' : 'and'
		return {
			[operator] : data[operator].map((d: any) => applyFacet(d, facetName))
		}
	}
%}

# Pass your lexer with @lexer:
@lexer lexer

STATEMENT -> NODE {% id %}
| NODE (__ OPERATOR __ STATEMENT):+ {% recursive %}
| NODE (__ STATEMENT):+ {% implicit %}

NODE -> %lparen STATEMENT %rparen {% ([, logical]) => logical %}
| EXCLUDE %lparen STATEMENT %rparen {% ([,, logical]) => inverse(logical) %}
| NODE_FACET {% id %}
| NODE_TEXT {% id %}

NODE_FACET -> 
EXCLUDE FACET FACET_TEXT {% ([, facet, node]) => inverse(applyFacet(node, facet.value)) %}
| FACET FACET_TEXT {% ([facet, node]) => applyFacet(node, facet.value) %}

FACET_TEXT -> TEXT_EXPRESSION {% id %}
| EXCLUDE_TEXT_EXPRESSION {% id %}
| %lparen STATEMENT_TEXT %rparen {% ([, logical]) => logical %}

FACET -> %facet {% id %}

STATEMENT_TEXT -> 
NODE_TEXT {% id %}
| NODE_TEXT (__ OPERATOR __ NODE_TEXT):+ {% recursive %}
| NODE_TEXT (__ NODE_TEXT):+ {% implicit %}

NODE_TEXT -> 
%lparen STATEMENT_TEXT %rparen {% ([, logical]) => logical %}
| EXCLUDE %lparen STATEMENT_TEXT %rparen {% ([,, logical]) => inverse(logical) %}
| EXCLUDE_TEXT_EXPRESSION {% id %}
| MULTIPLE_TEXT_EXPRESSION {% id %}
| TEXT_EXPRESSION {% id %}

MULTIPLE_TEXT_EXPRESSION -> TEXT (__ TEXT):+ {% ([text, rest]) => ({
	in: [text.value, ...rest.map(d => d[1].value)],
	name: 'all',
	fullText: true
}) %}

EXCLUDE_TEXT_EXPRESSION -> EXCLUDE TEXT {% ([exclude, text]) => ({
	exclude: [text.value],
	name: 'all',
	fullText: true
}) %}

TEXT_EXPRESSION -> TEXT {% ([text]) => ({
	in: [text.value],
	name: 'all',
	fullText: true
}) %}

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