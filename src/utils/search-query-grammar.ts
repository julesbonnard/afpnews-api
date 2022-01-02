// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
import moo from 'moo'

function id(x: any[]) { return x[0]; }

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
	
	function recursive ([left, rest]: [any, any]): any {
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
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "STATEMENT", "symbols": ["NODE"], "postprocess": id},
    {"name": "STATEMENT$ebnf$1$subexpression$1", "symbols": ["__", "OPERATOR", "__", "STATEMENT"]},
    {"name": "STATEMENT$ebnf$1", "symbols": ["STATEMENT$ebnf$1$subexpression$1"]},
    {"name": "STATEMENT$ebnf$1$subexpression$2", "symbols": ["__", "OPERATOR", "__", "STATEMENT"]},
    {"name": "STATEMENT$ebnf$1", "symbols": ["STATEMENT$ebnf$1", "STATEMENT$ebnf$1$subexpression$2"], "postprocess": function arrpush(d: any) {return d[0].concat([d[1]]);}},
    {"name": "STATEMENT", "symbols": ["NODE", "STATEMENT$ebnf$1"], "postprocess": recursive},
    {"name": "STATEMENT$ebnf$2$subexpression$1", "symbols": ["__", "STATEMENT"]},
    {"name": "STATEMENT$ebnf$2", "symbols": ["STATEMENT$ebnf$2$subexpression$1"]},
    {"name": "STATEMENT$ebnf$2$subexpression$2", "symbols": ["__", "STATEMENT"]},
    {"name": "STATEMENT$ebnf$2", "symbols": ["STATEMENT$ebnf$2", "STATEMENT$ebnf$2$subexpression$2"], "postprocess": function arrpush(d: any) {return d[0].concat([d[1]]);}},
    {"name": "STATEMENT", "symbols": ["NODE", "STATEMENT$ebnf$2"], "postprocess": implicit},
    {"name": "NODE", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "STATEMENT", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": ([, logical]: any[]) => logical},
    {"name": "NODE", "symbols": ["EXCLUDE", (lexer.has("lparen") ? {type: "lparen"} : lparen), "STATEMENT", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": ([,, logical]: any[]) => inverse(logical)},
    {"name": "NODE", "symbols": ["NODE_FACET"], "postprocess": id},
    {"name": "NODE", "symbols": ["NODE_TEXT"], "postprocess": id},
    {"name": "NODE_FACET", "symbols": ["EXCLUDE", "FACET", "FACET_TEXT"], "postprocess": ([, facet, node]: any[]) => inverse(applyFacet(node, facet.value))},
    {"name": "NODE_FACET", "symbols": ["FACET", "FACET_TEXT"], "postprocess": ([facet, node]: any[]) => applyFacet(node, facet.value)},
    {"name": "FACET_TEXT", "symbols": ["TEXT_EXPRESSION"], "postprocess": id},
    {"name": "FACET_TEXT", "symbols": ["EXCLUDE_TEXT_EXPRESSION"], "postprocess": id},
    {"name": "FACET_TEXT", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "STATEMENT_TEXT", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": ([, logical]: any[]) => logical},
    {"name": "FACET", "symbols": [(lexer.has("facet") ? {type: "facet"} : facet)], "postprocess": id},
    {"name": "STATEMENT_TEXT", "symbols": ["NODE_TEXT"], "postprocess": id},
    {"name": "STATEMENT_TEXT$ebnf$1$subexpression$1", "symbols": ["__", "OPERATOR", "__", "NODE_TEXT"]},
    {"name": "STATEMENT_TEXT$ebnf$1", "symbols": ["STATEMENT_TEXT$ebnf$1$subexpression$1"]},
    {"name": "STATEMENT_TEXT$ebnf$1$subexpression$2", "symbols": ["__", "OPERATOR", "__", "NODE_TEXT"]},
    {"name": "STATEMENT_TEXT$ebnf$1", "symbols": ["STATEMENT_TEXT$ebnf$1", "STATEMENT_TEXT$ebnf$1$subexpression$2"], "postprocess": function arrpush(d: any) {return d[0].concat([d[1]]);}},
    {"name": "STATEMENT_TEXT", "symbols": ["NODE_TEXT", "STATEMENT_TEXT$ebnf$1"], "postprocess": recursive},
    {"name": "STATEMENT_TEXT$ebnf$2$subexpression$1", "symbols": ["__", "NODE_TEXT"]},
    {"name": "STATEMENT_TEXT$ebnf$2", "symbols": ["STATEMENT_TEXT$ebnf$2$subexpression$1"]},
    {"name": "STATEMENT_TEXT$ebnf$2$subexpression$2", "symbols": ["__", "NODE_TEXT"]},
    {"name": "STATEMENT_TEXT$ebnf$2", "symbols": ["STATEMENT_TEXT$ebnf$2", "STATEMENT_TEXT$ebnf$2$subexpression$2"], "postprocess": function arrpush(d: any) {return d[0].concat([d[1]]);}},
    {"name": "STATEMENT_TEXT", "symbols": ["NODE_TEXT", "STATEMENT_TEXT$ebnf$2"], "postprocess": implicit},
    {"name": "NODE_TEXT", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "STATEMENT_TEXT", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": ([, logical]: any[]) => logical},
    {"name": "NODE_TEXT", "symbols": ["EXCLUDE", (lexer.has("lparen") ? {type: "lparen"} : lparen), "STATEMENT_TEXT", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": ([,, logical]: any[]) => inverse(logical)},
    {"name": "NODE_TEXT", "symbols": ["EXCLUDE_TEXT_EXPRESSION"], "postprocess": id},
    {"name": "NODE_TEXT", "symbols": ["MULTIPLE_TEXT_EXPRESSION"], "postprocess": id},
    {"name": "NODE_TEXT", "symbols": ["TEXT_EXPRESSION"], "postprocess": id},
    {"name": "MULTIPLE_TEXT_EXPRESSION$ebnf$1$subexpression$1", "symbols": ["__", "TEXT"]},
    {"name": "MULTIPLE_TEXT_EXPRESSION$ebnf$1", "symbols": ["MULTIPLE_TEXT_EXPRESSION$ebnf$1$subexpression$1"]},
    {"name": "MULTIPLE_TEXT_EXPRESSION$ebnf$1$subexpression$2", "symbols": ["__", "TEXT"]},
    {"name": "MULTIPLE_TEXT_EXPRESSION$ebnf$1", "symbols": ["MULTIPLE_TEXT_EXPRESSION$ebnf$1", "MULTIPLE_TEXT_EXPRESSION$ebnf$1$subexpression$2"], "postprocess": function arrpush(d: any) {return d[0].concat([d[1]]);}},
    {"name": "MULTIPLE_TEXT_EXPRESSION", "symbols": ["TEXT", "MULTIPLE_TEXT_EXPRESSION$ebnf$1"], "postprocess":  ([text, rest]: any[]) => ({
        	in: [text.value, ...rest.map((d: any) => d[1].value)],
        	name: 'all',
        	fullText: true
        }) },
    {"name": "EXCLUDE_TEXT_EXPRESSION", "symbols": ["EXCLUDE", "TEXT"], "postprocess":  ([exclude, text]: any[]) => ({
        	exclude: [text.value],
        	name: 'all',
        	fullText: true
        }) },
    {"name": "TEXT_EXPRESSION", "symbols": ["TEXT"], "postprocess":  ([text]: any[]) => ({
        	in: [text.value],
        	name: 'all',
        	fullText: true
        }) },
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
};

export default grammar;
