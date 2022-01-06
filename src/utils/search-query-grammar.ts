// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
import moo from 'moo'
function id(x: any) { return x[0]; }

declare var facet: any;
declare var excludeoperator: any;
declare var excludeword: any;
declare var and: any;
declare var andbis: any;
declare var or: any;
declare var orbis: any;
declare var word: any;
declare var singlequoted: any;
declare var doublequoted: any;
declare var lparen: any;
declare var rparen: any;
declare var ws: any;

	// Moo lexer documention is here:
	// https://github.com/no-context/moo

	const lexer = moo.compile({
	  ws: / +/,
	  doublequoted: /"(?:[^"\\]|\\.)*"/,
	  singlequoted: /'(?:[^'\\]|\\.)*'/,
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

	function logical (left: any, right: any, operator = 'and') {
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

	function inverse (data: any) {
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

	function handleQuotes (text: string, isFullText: boolean) {
		if (!isFullText && (text[0] === "'" || text[0] === "\"")) {
			return text.slice(1, -1)
		}
		return text
	}

	function applyFacet (data: any, facetName: string) {
		const isFullText = fullTextFacet.includes(facetName)
		if (data.name) {
			const key = data.and ? 'and' : 'exclude'
			return {
				name: facetName,
				fullText: isFullText,
				[key]: data[key].map((d: string) => handleQuotes(d, isFullText))
			}
		}
		const operator = data.or ? 'or' : 'and'
		return {
			[operator] : data[operator].map((d: any) => applyFacet(d, facetName))
		}
	}

	function concatenateText (left: any, right?: any, key = 'and') {
		return {
			[key]: right ? [...left[key], ...right[key]] : [left.text],
			name: 'all',
			fullText: true
		}
	}
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "STATEMENT", "symbols": ["STATEMENT", "__", "STATEMENT"], "postprocess": ([left,, right]: any[]) => logical(left, right)},
    {"name": "STATEMENT", "symbols": ["STATEMENT", "__", "OR", "__", "STATEMENT"], "postprocess": ([left,,operator,,right]: any[]) => logical(left, right, 'or')},
    {"name": "STATEMENT", "symbols": ["STATEMENT", "__", "AND", "__", "STATEMENT"], "postprocess": ([left,,operator,,right]: any[]) => logical(left, right, 'and')},
    {"name": "STATEMENT", "symbols": ["EXCLUDE", (lexer.has("lparen") ? {type: "lparen"} : lparen), "STATEMENT", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": ([,, statement]: any[]) => inverse(statement)},
    {"name": "STATEMENT", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "STATEMENT", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": ([, statement]: any[]) => statement},
    {"name": "STATEMENT", "symbols": ["NODE_FACET"], "postprocess": id},
    {"name": "STATEMENT", "symbols": ["NODE_TEXT"], "postprocess": id},
    {"name": "NODE_FACET", "symbols": ["EXCLUDE", (lexer.has("facet") ? {type: "facet"} : facet), (lexer.has("lparen") ? {type: "lparen"} : lparen), "NODE_TEXT", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": ([, facet,, node]: any[]) => inverse(applyFacet(node, facet.value))},
    {"name": "NODE_FACET", "symbols": [(lexer.has("facet") ? {type: "facet"} : facet), "EXCLUDE", (lexer.has("lparen") ? {type: "lparen"} : lparen), "NODE_TEXT", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": ([facet,,, node]: any[]) => inverse(applyFacet(node, facet.value))},
    {"name": "NODE_FACET", "symbols": [(lexer.has("facet") ? {type: "facet"} : facet), "EXCLUDE_TEXT_EXPRESSION"], "postprocess": ([facet, node]: any[]) => applyFacet(node, facet.value)},
    {"name": "NODE_FACET", "symbols": [(lexer.has("facet") ? {type: "facet"} : facet), (lexer.has("lparen") ? {type: "lparen"} : lparen), "NODE_TEXT", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": ([facet,, node]: any[]) => applyFacet(node, facet.value)},
    {"name": "NODE_FACET", "symbols": [(lexer.has("facet") ? {type: "facet"} : facet), "TEXT_EXPRESSION"], "postprocess": ([facet, node]: any[]) => applyFacet(node, facet.value)},
    {"name": "NODE_TEXT", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "NODE_TEXT", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": ([, node]: any[]) => node},
    {"name": "NODE_TEXT", "symbols": ["EXCLUDE", (lexer.has("lparen") ? {type: "lparen"} : lparen), "NODE_TEXT", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": ([,, node]: any[]) => inverse(node)},
    {"name": "NODE_TEXT", "symbols": ["NODE_TEXT", "__", "OR", "__", "NODE_TEXT"], "postprocess": ([left,, operator,, right]: any[]) => logical(left, right, 'or')},
    {"name": "NODE_TEXT", "symbols": ["NODE_TEXT", "__", "AND", "__", "NODE_TEXT"], "postprocess": ([left,, operator,, right]: any[]) => logical(left, right, 'and')},
    {"name": "NODE_TEXT", "symbols": ["NODE_TEXT", "__", "NODE_TEXT"], "postprocess": ([left,, right]: any[]) => logical(left, right)},
    {"name": "NODE_TEXT", "symbols": ["MULTIPLE_EXCLUDE_TEXT_EXPRESSION"], "postprocess": id},
    {"name": "NODE_TEXT", "symbols": ["MULTIPLE_TEXT_EXPRESSION"], "postprocess": id},
    {"name": "MULTIPLE_TEXT_EXPRESSION", "symbols": ["TEXT_EXPRESSION"], "postprocess": id},
    {"name": "MULTIPLE_TEXT_EXPRESSION", "symbols": ["MULTIPLE_TEXT_EXPRESSION", "__", "TEXT_EXPRESSION"], "postprocess": ([left,, right]: any[]) => concatenateText(left, right)},
    {"name": "MULTIPLE_TEXT_EXPRESSION", "symbols": ["MULTIPLE_TEXT_EXPRESSION", "__", "AND", "__", "TEXT_EXPRESSION"], "postprocess": ([left,,,, right]: any[]) => concatenateText(left, right)},
    {"name": "MULTIPLE_EXCLUDE_TEXT_EXPRESSION", "symbols": ["EXCLUDE_TEXT_EXPRESSION"], "postprocess": id},
    {"name": "MULTIPLE_EXCLUDE_TEXT_EXPRESSION", "symbols": ["MULTIPLE_EXCLUDE_TEXT_EXPRESSION", "__", "EXCLUDE_TEXT_EXPRESSION"], "postprocess": ([left,, right]: any[]) => concatenateText(left, right, 'exclude')},
    {"name": "MULTIPLE_EXCLUDE_TEXT_EXPRESSION", "symbols": ["MULTIPLE_EXCLUDE_TEXT_EXPRESSION", "__", "AND", "__", "EXCLUDE_TEXT_EXPRESSION"], "postprocess": ([left,,,, right]: any[]) => concatenateText(left, right, 'exclude')},
    {"name": "EXCLUDE_TEXT_EXPRESSION", "symbols": ["EXCLUDE", "TEXT"], "postprocess": ([, text]: any[]) => concatenateText(text, null, 'exclude')},
    {"name": "TEXT_EXPRESSION", "symbols": ["TEXT"], "postprocess": ([text]: any[]) => concatenateText(text)},
    {"name": "TEXT", "symbols": [(lexer.has("word") ? {type: "word"} : word)], "postprocess": id},
    {"name": "TEXT", "symbols": ["QUOTED"], "postprocess": id},
    {"name": "EXCLUDE", "symbols": [(lexer.has("excludeoperator") ? {type: "excludeoperator"} : excludeoperator)], "postprocess": id},
    {"name": "EXCLUDE", "symbols": [(lexer.has("excludeword") ? {type: "excludeword"} : excludeword), "__"], "postprocess": id},
    {"name": "OPERATOR", "symbols": ["AND"], "postprocess": id},
    {"name": "OPERATOR", "symbols": ["OR"], "postprocess": id},
    {"name": "AND$subexpression$1", "symbols": [(lexer.has("and") ? {type: "and"} : and)]},
    {"name": "AND$subexpression$1", "symbols": [(lexer.has("andbis") ? {type: "andbis"} : andbis)]},
    {"name": "AND", "symbols": ["AND$subexpression$1"], "postprocess": () => ({ type: 'and' })},
    {"name": "OR$subexpression$1", "symbols": [(lexer.has("or") ? {type: "or"} : or)]},
    {"name": "OR$subexpression$1", "symbols": [(lexer.has("orbis") ? {type: "orbis"} : orbis)]},
    {"name": "OR", "symbols": ["OR$subexpression$1"], "postprocess": () => ({ type: 'or' })},
    {"name": "QUOTED", "symbols": ["SINGLEQUOTED"], "postprocess": id},
    {"name": "QUOTED", "symbols": ["DOUBLEQUOTED"], "postprocess": id},
    {"name": "SINGLEQUOTED", "symbols": [(lexer.has("singlequoted") ? {type: "singlequoted"} : singlequoted)], "postprocess": id},
    {"name": "DOUBLEQUOTED", "symbols": [(lexer.has("doublequoted") ? {type: "doublequoted"} : doublequoted)], "postprocess": id},
    {"name": "_$ebnf$1", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": id},
    {"name": "_$ebnf$1", "symbols": [], "postprocess": function(d: any) {return null;}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": id},
    {"name": "__", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": id}
]
  , ParserStart: "STATEMENT"
}

export default grammar