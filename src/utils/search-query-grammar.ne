@preprocessor typescript
@{%
	// Moo lexer documention is here:
	// https://github.com/no-context/moo

	import moo from 'moo'
	const lexer = moo.compile({
	  ws: / +/,
	  doublequoted: /"(?:[^"\\]|\\.)*"?/,
	  singlequoted: /'(?:[^'\\]|\\.)*'?/,
	  facet: {
		  match: /[a-zA-Z\._-]+[=:]/,
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
	  word: /[a-zA-ZÀ-ÿ0-9-]+/
	})
	
	const fullTextFacet = ['all', 'news', 'title', 'headline', 'advisory', 'comment', 'copyright', 'disclaimer', 'doc_creator_name', 'summary']

	function flattenText (data: any): string {
		return data.flat(Infinity)
			.filter((d: any) => d && d.type !== 'ws')
			.map((d: any) => d && d.text)
	}
	
	function recursive ([left, rest]: any[]): any {
		if (rest && rest.length > 0) {
			const [_, operator, right] = rest.shift()
			return {
				[operator && operator[0] || 'and']: [left, recursive([right, rest])]
			}
		}
		return left
	}
%}

# Pass your lexer with @lexer:
@lexer lexer

STATEMENT -> NODE (__ (OPERATOR __):? NODE):* {% recursive %}

NODE -> 
GROUPED_EXPRESSIONS {% id %}
| LOGICAL_EXPRESSION {% id %}

GROUPED_EXPRESSIONS -> lparen LOGICAL_EXPRESSION rparen {% ([lparen, logical]) => logical %}

LOGICAL_EXPRESSION -> TEXT_FACET_EXPRESSION (__ (OPERATOR __):? TEXT_FACET_EXPRESSION):* {% recursive %}

TEXT_FACET_EXPRESSION -> 
FACET:? EXCLUDE:? lparen WORDS rparen {% ([facet, exclude, lparen, text, rparen], i, reject) => {
return {
		name: facet && facet.name || 'all',
		exclude: facet && facet.exclude || exclude ? flattenText(text) : undefined,
		in: facet && facet.exclude || exclude ? undefined : flattenText(text),
		fullText: facet ? facet.fullText : true
	}
} %}
| FACET:? EXCLUDE:? WORD {% ([facet, exclude, text], i, reject) => {
return {
		name: facet && facet.name || 'all',
		exclude: facet && facet.exclude || exclude ? flattenText(text) : undefined,
		in: facet && facet.exclude || exclude ? undefined : flattenText(text),
		fullText: facet ? facet.fullText : true
	}
} %}

FACET -> EXCLUDE:? %facet {% ([exclude, facet]) => ({
	exclude: exclude !== null,
	name: facet.value,
	fullText: fullTextFacet.includes(facet.value) || undefined
}) %}

EXCLUDE -> (%excludeoperator | %excludeword __) {% id %}

OPERATOR -> (AND | OR)
AND -> (%and | %andbis) {% d => 'and' %}
OR -> (%or | %orbis) {% d => 'or' %}

WORDS -> WORD (__ WORD):*
WORD -> %word | QUOTED
QUOTED -> (SINGLEQUOTED | DOUBLEQUOTED)
SINGLEQUOTED -> %singlequoted
DOUBLEQUOTED -> %doublequoted

lparen -> %lparen {% undefined %}
rparen -> %rparen {% undefined %}
_ -> %ws:? {% undefined %}
__ -> %ws {% undefined %}