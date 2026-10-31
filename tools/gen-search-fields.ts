// Génère src/searchFields.ts depuis l'export du catalogue des métadonnées de la doc AFP.
// Usage : bun run tools/gen-search-fields.ts [url-de-l-export]
// À relancer quand la doc publie de nouveaux champs ; le fichier généré est commité.
import { writeFileSync } from 'fs'

const DEFAULT_EXPORT_URL = 'https://afp-api-doc-portal-uat.app.afp.com/exports/afp-api-metadata-fields-fr.json'

type CatalogField = { name: string; type: string; isFacet: boolean; isUsableInSearch: boolean }

const url = process.argv[2] ?? DEFAULT_EXPORT_URL
const response = await fetch(url)
if (!response.ok) throw new Error(`${url} : HTTP ${response.status}`)
const catalog = await response.json() as CatalogField[]

const searchable = catalog.filter(field => field.isUsableInSearch)
const names = (fields: CatalogField[]) => [...new Set(fields.map(field => field.name))].sort()

const lists = {
  // Filtrables par valeur exacte (in / exclude / and) et listables via list/{facet}
  FACET_FIELDS: names(searchable.filter(field => field.isFacet)),
  // Recherche textuelle : contains
  TEXT_FIELDS: names(searchable.filter(field => field.type === 'text')),
  // Utilisables comme dateField (dateRange.targetField) et dans range
  DATE_FIELDS: names(searchable.filter(field => field.type === 'date'))
}

const body = Object.entries(lists)
  .map(([constant, values]) => `export const ${constant} = [\n${values.map(value => `  '${value}'`).join(',\n')}\n] as const`)
  .join('\n\n')

writeFileSync(new URL('../src/searchFields.ts', import.meta.url), `// Généré par \`bun run tools/gen-search-fields.ts\` depuis ${url}
// (catalogue des métadonnées de la doc AFP). Ne pas modifier à la main.

${body}
`)

console.log(Object.entries(lists).map(([constant, values]) => `${constant}: ${values.length}`).join(', '))
