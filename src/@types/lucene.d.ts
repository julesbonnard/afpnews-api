declare module 'lucene' {
    export interface LuceneQueryParsed {
        left: LuceneQueryParsed,
        operator: 'AND' | '&&' | 'OR' | '||' | 'NOT' | 'AND NOT' | 'OR NOT' | '<implicit>',
        right: LuceneQueryParsed,
        term: string,
        field: string | '<implicit>',
        prefix?: '-' | '+',
        parenthesized?: boolean,
        quoted?: boolean,
        boost?: number,
        similarity?: number,
        proximity?: number,
        term_min?: string,
        term_max?: string,
        inclusive?: string
    }
    export function parse (query: string): LuceneQueryParsed
}
