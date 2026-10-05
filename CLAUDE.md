# CLAUDE.md - AI Assistant Guide for afpnews-api

## Project Overview

**afpnews-api** is a TypeScript client library for the AFP (Agence France-Presse) Core API. It provides authentication, document search, notification management, and social story retrieval for both Node.js and browser environments. Published as an npm package with CommonJS, ESM, and UMD bundle outputs.

## Quick Reference

```bash
# Install dependencies (uses pnpm)
pnpm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint
npm run lint

# Typecheck (tsc --noEmit — tsdown doesn't type-check, only lint/build won't catch type errors)
npm run typecheck

# Full build (parser -> tsdown)
npm run build

# Development with auto-rebuild (tsdown's native watch mode)
npm run build:watch

# Generate the Nearley parser only -> src/grammar/index.ts
npm run build:parser

# Validate the built package.json exports/types (publint + Are the Types Wrong)
npm run verify:package
```

## Architecture

### Class Hierarchy

```
EventEmitter
  └── Auth          (src/api/auth.ts)     - OAuth2 token management
        └── Docs    (src/api/docs.ts)     - Document operations (exported as ApiCore)
```

The main export is `Docs` aliased as `ApiCore` from `src/index.ts`.

### Source Layout

```
src/
├── index.ts              # Main entry: re-exports Docs as ApiCore + types + config
├── index-cjs.ts          # CommonJS entry point
├── types.ts              # All TypeScript type definitions
├── config.ts             # Constants (defaultBaseUrl, defaultSearchParams, etc.)
├── api/
│   ├── auth.ts           # Auth class - token management, OAuth2 flows
│   ├── docs.ts           # Docs class - search, get, mlt, list, notifications
│   ├── story.ts          # Story function - social story HTML retrieval
│   └── notification.ts   # NotificationCenter - subscription management
├── utils/
│   ├── request.ts        # HTTP helpers (get, post, postForm, del) using fetch
│   ├── QueryBuilder.ts   # Query DSL parser -> API search request builder
│   ├── normalizer.ts     # Unicode text normalization
│   ├── shotlist.ts       # parseShotList: video shot list parser (Shot[])
│   └── parseDocument.ts  # parseDocument: raw doc -> canonical AfpDocument model
└── grammar/
    ├── index.ne          # Nearley grammar definition for query DSL
    └── grammar.d.ts      # Type definitions for parser AST nodes
```

### Key Patterns

- **Auth via inheritance**: `Docs extends Auth extends EventEmitter`. Methods on `Docs` call `this.authenticate()` before making API requests.
- **Context binding**: `Story` and `NotificationCenter` are functions invoked with `.call(this, ...)` to bind to the `Docs` instance.
- **Zod validation**: All API responses are validated at runtime with Zod schemas defined inline in each module.
- **Async generators**: `searchAll()` uses `async *` for paginated iteration over large result sets: date cursor on the sort field (`dateField` aligned to it), with `startAt` to skip documents already returned at the boundary date (no duplicates, no infinite loop on ties) and a `uno` dedup safety net; plain `startAt` paging for non-date sort fields; never mutates the caller's `params`.
- **Query DSL**: Complex boolean query strings are parsed via Nearley/Moo into an AST, then converted to nested `SearchQuery` objects by `QueryBuilder`.
- **Opt-in parsing via TS overloads**: `get`/`search`/`searchAll`/`mlt`/`latest`/`searchWithFilter` return raw `unknown` documents by default; passing `{ parse: true }` (a trailing argument, never a runtime union type) switches the *inferred* return type to the canonical `AfpDocument` model via a dedicated overload signature — the unparsed overload's behavior and types are untouched. `list` doesn't fit this pattern (it returns facet values, not documents, so there is no raw/parsed choice) but is still typed: its `keywords` are `AfpFacetValue[]`, a named type matching the existing zod-validated shape (no behavior change, just an explicit exported type). `parseDocument(raw)` (in `utils/parseDocument.ts`) is also exported standalone and throws (via Zod) on malformed input.

### Build Output

```
dist/
├── cjs/        # Unbundled CommonJS, one .cjs + .d.cts + sourcemap per source module
├── esm/        # Unbundled ES Modules, one .mjs + .d.mts + sourcemap per source module
└── bundles/    # apicore.min.js (UMD) + apicore.min.mjs (ESM), minified with source maps
```

## Code Conventions

### Style
- **Indentation**: 2 spaces (enforced via `.editorconfig`)
- **Line endings**: LF
- **Charset**: UTF-8
- **Trailing newline**: Required on all files
- **TypeScript strict mode**: All strict checks enabled (`noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`, etc.)

### Linting
- [oxlint](https://oxc.rs/docs/guide/usage/linter.html) (`.oxlintrc.json`), type-aware via `oxlint-tsgolint` (`options.typeAware: true`) — the enabled `typescript/*` rule set matches `typescript-eslint`'s `recommendedTypeChecked` preset (the non-type-checked `recommended` rules, plus its `recommended-type-checked-only` additions)
- Ignored paths: `node_modules`, `dist`, `src/grammar/index.ts` (generated), `examples`, `tools`
- Run with: `npm run lint`
- Test-only `fetch` mocks are typed via `tests/helpers/mockFetch.ts` (`Mock<typeof fetch>`) rather than each test file rolling its own loosely-typed mock

### TypeScript
- Target: ES6, Module: ESNext, Lib: ES2015
- Module resolution: Node
- Source maps enabled
- Types are defined in `src/types.ts` - keep type definitions centralized there

### Dependencies
- Runtime: `btoa-lite`, `events`, `moo`, `nearley`, `statuses`, `zod`
- `@types/*` packages are in `dependencies` (not `devDependencies`) since they're needed by consumers
- Package manager: pnpm (lock file: `pnpm-lock.yaml`)

## Important Notes

### Generated Files - Do Not Edit
- `src/grammar/index.ts` - Generated from `src/grammar/index.ne` by `npm run build:parser`. Edit the `.ne` file instead.
- `src/searchFields.ts` - `FACET_FIELDS` / `TEXT_FIELDS` / `DATE_FIELDS`, generated from the AFP doc's metadata catalogue export by `bun run tools/gen-search-fields.ts` (committed; re-run when the doc adds fields). They feed the `FacetField` / `TextField` / `DateField` types, `SearchFilters` autocompletion and `fullTextSearchFields` (which fields the query DSL searches with `contains`). `translatedSearchFields` (config) lists the text fields that also have a `translated.{lang}.*` counterpart in the prod mapping — wider than the doc, which only names `all` and `news`.
- Everything in `dist/` - Build artifacts, gitignored.

### Build Order Matters
The full build (`npm run build`) runs in a specific sequence:
1. `build:parser` - Generate parser from grammar
2. `tsdown` - Single [tsdown](https://tsdown.dev) run producing unbundled esm/cjs (with per-module `.d.mts`/`.d.cts` declarations and sourcemaps) and the two minified browser bundles, all defined in `tsdown.config.mts`. tsdown cleans `dist/` itself before writing (use `--no-clean` to skip); `npm run clean` is only needed as a manual utility.
- CJS output uses `.cjs` and ESM output uses `.mjs` (not a shared `.js` + a `dist/*/package.json` `"type"` marker) so module type is unambiguous by extension alone — this is also what `tsdown --publint --attw` flagged when the old `.js`-based setup was tried.

### Environment Variables (for testing/examples)
```
AFPNEWS_BASE_URL        # API base URL (default: https://afp-apicore-prod.afp.com, see src/config.ts)
AFPNEWS_API_KEY         # API key for anonymous auth
AFPNEWS_CLIENT_ID       # OAuth client ID
AFPNEWS_CLIENT_SECRET   # OAuth client secret
AFPNEWS_USERNAME        # User credentials
AFPNEWS_PASSWORD        # User credentials
```

### Testing
- **Framework**: Vitest (config in `vitest.config.mts`)
- **Test location**: `tests/` directory, mirroring `src/` structure
- **Run**: `npm test` (single run) or `npm run test:watch` (watch mode)
- **Mocking**: Tests mock `globalThis.fetch` directly or use `vi.spyOn` for method-level mocking
- **Pattern**: Each source module has a corresponding `.test.ts` file in `tests/`

```
tests/
├── index.test.ts              # Export verification
├── api/
│   ├── auth.test.ts           # Auth class: token management, auth flows
│   ├── docs.test.ts           # Docs class: search, get, mlt, list, searchAll
│   ├── story.test.ts          # Story HTML retrieval
│   └── notification.test.ts   # NotificationCenter: services, subscriptions
└── utils/
    ├── normalizer.test.ts     # Unicode normalization
    ├── QueryBuilder.test.ts   # Query DSL parsing, builder methods
    └── request.test.ts        # HTTP helpers, error handling
```

### Error Handling
- Custom `ApiError` class in `src/utils/request.ts` (exported from the package) with `code`, `message`, `status`, `type`, `subcode` and `expireAt`
- Bodies are read as text then parsed: an error payload is detected even with HTTP 200, and a non-JSON body yields an `ApiError` (never a `SyntaxError`)
- Shapes observed in production: `{ error: { code, message, type } }` (no `subcode`), `{ expireAt }` for 429, `{ error: "…" }` (string) for the credits API
- One retry on 429 (only if `expireAt` is within 10 s) and 502/503/504 (short jittered backoff), for reads only: `get` retries by default (`retry: false` for GETs that write, e.g. filter delete), `post` only with `retry: true` (search, list), `del` and `postForm` (`/oauth/token`) never
- Token renewal is single-flight (`pendingToken` / `trackPendingToken` in `Auth`), 30 s before expiry; a login waits for an in-flight refresh; `withAuth` only expires the token it actually used before replaying a call that got a 401

### Authentication Flows
1. **Anonymous**: `GET /oauth/token?grant_type=anonymous` with Basic auth (apiKey or clientId:clientSecret)
2. **Credentials**: `POST /oauth/token` with an `application/x-www-form-urlencoded` body `grant_type=password` + username/password
3. **Refresh**: `POST /oauth/token` with an `application/x-www-form-urlencoded` body `grant_type=refresh_token` + stored refresh token
- Tokens emit `tokenChanged` events via EventEmitter

### Publish Lifecycle
`npm run prepare` runs `lint`, `typecheck`, then `build` before publish, ensuring dist/ is always fresh.

### Node.js Compatibility
Minimum Node.js version: 12.20.0 (declared in `engines` field).
