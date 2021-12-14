// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
import moo from 'moo'
function id(d: any[]): any { return d[0]; }
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
		  match: /"(?:[^"\\]|\\.)*"?/,
		  value: (s: string) => s.slice(1, -1)
	  },
	  singlequoted: {
		  match: /'(?:[^'\\]|\\.)*'?/,
		  value: (s: string) => s.slice(1, -1)
	  },
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
	  word: /[a-zA-ZÀ-ÿ0-9\.-]+/
	})
	
	const fullTextFacet = ['all', 'news', 'title', 'headline', 'advisory', 'comment', 'copyright', 'disclaimer', 'doc_creator_name', 'summary']

	function flattenText (data: any[], allowQuoted: true) {
		return data.flat(Infinity)
			.filter((d: any) => d.type !== 'ws')
			.map((d: any) => allowQuoted ? d.text : d.value)
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

interface NearleyToken {
  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: never) => string;
  has: (tokenType: string) => boolean;
};

interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any;
};

type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

interface Grammar {
  Lexer: NearleyLexer | undefined;
  ParserRules: NearleyRule[];
  ParserStart: string;
};

const grammar: Grammar = {
  Lexer: lexer,
  ParserRules: [
    {"name": "STATEMENT$ebnf$1", "symbols": []},
    {"name": "STATEMENT$ebnf$1$subexpression$1$ebnf$1$subexpression$1", "symbols": ["OPERATOR", "__"]},
    {"name": "STATEMENT$ebnf$1$subexpression$1$ebnf$1", "symbols": ["STATEMENT$ebnf$1$subexpression$1$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "STATEMENT$ebnf$1$subexpression$1$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "STATEMENT$ebnf$1$subexpression$1", "symbols": ["__", "STATEMENT$ebnf$1$subexpression$1$ebnf$1", "NODE"]},
    {"name": "STATEMENT$ebnf$1", "symbols": ["STATEMENT$ebnf$1", "STATEMENT$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "STATEMENT", "symbols": ["NODE", "STATEMENT$ebnf$1"], "postprocess": recursive},
    {"name": "NODE", "symbols": ["lparen", "STATEMENT", "rparen"], "postprocess": ([lparen, logical]) => logical},
    {"name": "NODE", "symbols": ["LOGICAL_EXPRESSION"], "postprocess": id},
    {"name": "LOGICAL_EXPRESSION$ebnf$1", "symbols": []},
    {"name": "LOGICAL_EXPRESSION$ebnf$1$subexpression$1$ebnf$1$subexpression$1", "symbols": ["OPERATOR", "__"]},
    {"name": "LOGICAL_EXPRESSION$ebnf$1$subexpression$1$ebnf$1", "symbols": ["LOGICAL_EXPRESSION$ebnf$1$subexpression$1$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "LOGICAL_EXPRESSION$ebnf$1$subexpression$1$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "LOGICAL_EXPRESSION$ebnf$1$subexpression$1", "symbols": ["__", "LOGICAL_EXPRESSION$ebnf$1$subexpression$1$ebnf$1", "TEXT_FACET_EXPRESSION"]},
    {"name": "LOGICAL_EXPRESSION$ebnf$1", "symbols": ["LOGICAL_EXPRESSION$ebnf$1", "LOGICAL_EXPRESSION$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "LOGICAL_EXPRESSION", "symbols": ["TEXT_FACET_EXPRESSION", "LOGICAL_EXPRESSION$ebnf$1"], "postprocess": recursive},
    {"name": "TEXT_FACET_EXPRESSION$ebnf$1", "symbols": ["FACET"], "postprocess": id},
    {"name": "TEXT_FACET_EXPRESSION$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "TEXT_FACET_EXPRESSION$ebnf$2", "symbols": ["EXCLUDE"], "postprocess": id},
    {"name": "TEXT_FACET_EXPRESSION$ebnf$2", "symbols": [], "postprocess": () => null},
    {"name": "TEXT_FACET_EXPRESSION", "symbols": ["TEXT_FACET_EXPRESSION$ebnf$1", "TEXT_FACET_EXPRESSION$ebnf$2", "lparen", "WORDS", "rparen"], "postprocess":  ([facet, exclude, lparen, text, rparen], i, reject) => {
        const fullText = facet ? facet.fullText : true
        return {
        		name: facet && facet.name || 'all',
        		exclude: facet && facet.exclude || exclude ? flattenText(text, fullText) : undefined,
        		in: facet && facet.exclude || exclude ? undefined : flattenText(text, fullText),
        		fullText
        	}
        } },
    {"name": "TEXT_FACET_EXPRESSION$ebnf$3", "symbols": ["FACET"], "postprocess": id},
    {"name": "TEXT_FACET_EXPRESSION$ebnf$3", "symbols": [], "postprocess": () => null},
    {"name": "TEXT_FACET_EXPRESSION$ebnf$4", "symbols": ["EXCLUDE"], "postprocess": id},
    {"name": "TEXT_FACET_EXPRESSION$ebnf$4", "symbols": [], "postprocess": () => null},
    {"name": "TEXT_FACET_EXPRESSION", "symbols": ["TEXT_FACET_EXPRESSION$ebnf$3", "TEXT_FACET_EXPRESSION$ebnf$4", "WORD"], "postprocess":  ([facet, exclude, text], i, reject) => {
        const fullText = facet ? facet.fullText : true
        return {
        		name: facet && facet.name || 'all',
        		exclude: facet && facet.exclude || exclude ? flattenText(text, fullText) : undefined,
        		in: facet && facet.exclude || exclude ? undefined : flattenText(text, fullText),
        		fullText
        	}
        } },
    {"name": "FACET$ebnf$1", "symbols": ["EXCLUDE"], "postprocess": id},
    {"name": "FACET$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "FACET", "symbols": ["FACET$ebnf$1", (lexer.has("facet") ? {type: "facet"} : facet)], "postprocess":  ([exclude, facet]) => ({
        	exclude: exclude !== null,
        	name: facet.value,
        	fullText: fullTextFacet.includes(facet.value) || undefined
        }) },
    {"name": "EXCLUDE$subexpression$1", "symbols": [(lexer.has("excludeoperator") ? {type: "excludeoperator"} : excludeoperator)]},
    {"name": "EXCLUDE$subexpression$1", "symbols": [(lexer.has("excludeword") ? {type: "excludeword"} : excludeword), "__"]},
    {"name": "EXCLUDE", "symbols": ["EXCLUDE$subexpression$1"], "postprocess": id},
    {"name": "OPERATOR$subexpression$1", "symbols": ["AND"]},
    {"name": "OPERATOR$subexpression$1", "symbols": ["OR"]},
    {"name": "OPERATOR", "symbols": ["OPERATOR$subexpression$1"]},
    {"name": "AND$subexpression$1", "symbols": [(lexer.has("and") ? {type: "and"} : and)]},
    {"name": "AND$subexpression$1", "symbols": [(lexer.has("andbis") ? {type: "andbis"} : andbis)]},
    {"name": "AND", "symbols": ["AND$subexpression$1"], "postprocess": d => 'and'},
    {"name": "OR$subexpression$1", "symbols": [(lexer.has("or") ? {type: "or"} : or)]},
    {"name": "OR$subexpression$1", "symbols": [(lexer.has("orbis") ? {type: "orbis"} : orbis)]},
    {"name": "OR", "symbols": ["OR$subexpression$1"], "postprocess": d => 'or'},
    {"name": "WORDS$ebnf$1", "symbols": []},
    {"name": "WORDS$ebnf$1$subexpression$1", "symbols": ["__", "WORD"]},
    {"name": "WORDS$ebnf$1", "symbols": ["WORDS$ebnf$1", "WORDS$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "WORDS", "symbols": ["WORD", "WORDS$ebnf$1"]},
    {"name": "WORD", "symbols": [(lexer.has("word") ? {type: "word"} : word)]},
    {"name": "WORD", "symbols": ["QUOTED"]},
    {"name": "QUOTED$subexpression$1", "symbols": ["SINGLEQUOTED"]},
    {"name": "QUOTED$subexpression$1", "symbols": ["DOUBLEQUOTED"]},
    {"name": "QUOTED", "symbols": ["QUOTED$subexpression$1"]},
    {"name": "SINGLEQUOTED", "symbols": [(lexer.has("singlequoted") ? {type: "singlequoted"} : singlequoted)]},
    {"name": "DOUBLEQUOTED", "symbols": [(lexer.has("doublequoted") ? {type: "doublequoted"} : doublequoted)]},
    {"name": "lparen", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen)], "postprocess": undefined},
    {"name": "rparen", "symbols": [(lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": undefined},
    {"name": "_$ebnf$1", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": id},
    {"name": "_$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": undefined},
    {"name": "__", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": undefined}
  ],
  ParserStart: "STATEMENT",
};

export default grammar;
