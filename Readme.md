# AfpNews API

[![npm version](https://img.shields.io/npm/v/afpnews-api.svg)](https://www.npmjs.com/package/afpnews-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE.md)

A TypeScript client library for the [AFP Core API](https://afp-apicore-prod.afp.com). Provides authentication, document search, notification management, saved filters, and social story retrieval for both Node.js and browser environments.

## Installation

### Node.js

```bash
npm install afpnews-api
```

```js
import { ApiCore } from 'afpnews-api'
// or CommonJS
const { ApiCore } = require('afpnews-api')
```

### Browser (UMD)

```html
<script src="https://unpkg.com/afpnews-api/dist/bundles/apicore.min.js"></script>
```

### Browser (ESM)

```js
import { ApiCore } from 'https://cdn.jsdelivr.net/npm/afpnews-api/dist/bundles/apicore.min.mjs'
```

## Prerequisites

You need an API key or client credentials (client ID + secret) to connect. For user-authenticated requests, you also need a username and password.

## Quick Start

```js
import { ApiCore } from 'afpnews-api'

// Initialize with client credentials
const afp = new ApiCore({ clientId: 'your-id', clientSecret: 'your-secret' })

// Or with an API key
const afp = new ApiCore({ apiKey: 'your-api-key' })

// Optionally override the base URL
const afp = new ApiCore({ clientId: 'your-id', clientSecret: 'your-secret', baseUrl: 'https://custom-api.afp.com' })
```

## Authentication

```js
// Anonymous authentication (uses API key or client credentials)
await afp.authenticate()

// Authenticate with user credentials
await afp.authenticate({ username: 'user', password: 'pass' })

// Listen for token changes
afp.on('tokenChanged', (token) => {
  console.log(token)
  // { accessToken, refreshToken, tokenExpires, authType }
})

// Token is automatically refreshed when expired
```

## Latest Documents

Get the most recent documents:

```js
const { count, documents } = await afp.latest({ lang: 'fr', tz: 'Europe/Paris' })
```

## Searching Documents

### Basic Search

```js
const { count, documents } = await afp.search()
```

### Search with Parameters

```js
const { count, documents } = await afp.search({
  query: 'Macron',
  langs: ['fr', 'en'],
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  size: 20,
  sortField: 'published',
  sortOrder: 'desc',
  tz: 'Europe/Paris',
  dateGap: '+1HOUR',
  startAt: 0,
  wantedFacets: { slug: { size: 10, minDocCount: 1 }, country: { size: 5, minDocCount: 1 } },
  sort: [{ sortField: 'published', sortOrder: 'desc' }]
})
```

### Additional Filtering Parameters

Any extra key-value pair is passed as an additional query filter:

```js
const { documents } = await afp.search({
  query: 'climate',
  country: 'fra',
  urgency: 3,
  slug: ['politics', 'economy']
})
```

You can also use include/exclude syntax:

```js
const { documents } = await afp.search({
  country: { in: ['fra', 'deu'] },
  product: { exclude: ['photo'] }
})
```

### Specify Response Fields

Pass an array of field names to limit the returned fields:

```js
const { documents } = await afp.search({}, ['uno', 'title', 'published'])
```

### Paginated Search

Use `searchAll()` to iterate over large result sets automatically:

```js
for await (const doc of afp.searchAll({ size: 5000, query: 'climate' })) {
  console.log(doc.uno)
}
```

## Query Syntax

The `query` parameter supports a boolean query DSL:

| Syntax | Example |
|---|---|
| Simple term | `Macron` |
| Field search | `title:Macron` |
| AND | `Macron AND Merkel` |
| OR | `title:Macron OR title:Merkel` |
| NOT | `Macron AND NOT country:fra` |
| Parentheses | `(title:Macron OR title:Merkel) AND country:fra` |
| Quoted phrase | `title:"climate change"` |
| Implicit AND | `Macron France` (space-separated terms) |

## Retrieving a Single Document

```js
const document = await afp.get('uno')
```

## More Like This

Find documents similar to a given one:

```js
const { count, documents } = await afp.mlt('uno', 'en', 10)
```

## Listing Facet Values

Retrieve the most used values for a specific facet:

```js
const { count, keywords } = await afp.list('slug')

// With custom search scope and minimum document count
const { keywords } = await afp.list('country', { dateFrom: 'now-7d', langs: ['en'] }, 5)
```

## Field Mapping

Get the API field mapping:

```js
const mapping = await afp.mapping('en')
```

## Filter Center

Manage saved search filters.

```js
const fc = afp.filterCenter

// Create a filter
await fc.add('breaking-politics', { query: 'urgency:1', country: 'fra' })

// Update a filter
await fc.update('breaking-politics', { query: 'urgency:1 OR urgency:2' })

// Get a specific filter
const filter = await fc.get('breaking-politics')

// List all filters
const allFilters = await fc.all()

// Delete a filter
await fc.delete('breaking-politics')
```

### Search with Saved Filter

```js
const { count, documents } = await afp.searchWithFilter('my-filter', {
  startat: 0,
  size: 50
})
```

## RSS/ATOM Feed

Retrieve an RSS/ATOM feed based on a saved filter:

```js
const xmlContent = await afp.feed('my-filter', { size: 20 })
```

## Notification Center

Subscribe to real-time document notifications via mail, REST, SQS, or JMS services.

```js
const nc = afp.notificationCenter

// Register a REST service
const serviceId = await nc.registerService({
  name: 'my-webhook',
  type: 'rest',
  datas: { href: 'https://example.com/webhook' }
})

// Add a subscription
const subId = await nc.addSubscription('breaking-news', 'my-webhook', {
  query: 'urgency:1',
  langs: ['en']
})

// List services and subscriptions
const services = await nc.listServices()
const subscriptions = await nc.listSubscriptions()
const subs = await nc.subscriptionsInService('my-webhook')

// Cleanup
await nc.deleteSubscription('my-webhook', 'breaking-news')
await nc.removeSubscriptionsFromService('my-webhook', ['sub1', 'sub2'])
await nc.deleteService('my-webhook')
```

## Social Stories

Retrieve the embeddable HTML for a social story document:

```js
const html = afp.getStoryHtml(doc)
```

## Search Parameters Reference

| Parameter | Type | Default | Description |
|---|---|---|---|
| `query` | `string` | — | Boolean query string (see Query Syntax) |
| `langs` | `string[]` | — | Filter by language codes |
| `dateFrom` | `string` | `'1980-01-01'` | Start date (ISO date or relative like `'now-7d'`) |
| `dateTo` | `string` | `'now'` | End date |
| `size` | `number` | `10` | Number of results (max 1000 per request) |
| `sortField` | `string` | `'published'` | Field to sort by |
| `sortOrder` | `'asc' \| 'desc'` | `'desc'` | Sort direction |
| `startAt` | `number` | — | Offset for pagination |
| `tz` | `string` | — | Timezone (e.g. `'Europe/Paris'`) |
| `dateGap` | `string` | — | Date gap for facet ranges (e.g. `'+1HOUR'`, `'+1DAY'`) |
| `wantedFacets` | `WantedFacets` | — | Facets configuration `{ facetName: { size, minDocCount }, empty?: boolean }` |
| `sort` | `SortEntry[]` | — | Multi-field sort `[{ sortField, sortOrder }]` |

Any additional key-value pairs are treated as field filters.

## Development

```bash
# Install dependencies
npm install

# Build (clean + parser + types + ESM/CJS/bundles)
npm run build

# Development with auto-rebuild
npm run build:watch

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint
npm run lint
```

## Environment Variables

Used for running tests and examples:

| Variable | Description |
|---|---|
| `AFPNEWS_BASE_URL` | API base URL (default: `https://afp-apicore-prod.afp.com`) |
| `AFPNEWS_API_KEY` | API key for anonymous auth |
| `AFPNEWS_CLIENT_ID` | OAuth client ID |
| `AFPNEWS_CLIENT_SECRET` | OAuth client secret |
| `AFPNEWS_USERNAME` | User credentials |
| `AFPNEWS_PASSWORD` | User credentials |

## Author

[Jules Bonnard](https://github.com/julesbonnard)

## License

MIT - see [LICENSE.md](LICENSE.md)
