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
│   └── normalizer.ts     # Unicode text normalization
└── grammar/
    ├── index.ne          # Nearley grammar definition for query DSL
    └── grammar.d.ts      # Type definitions for parser AST nodes
```

### Key Patterns

- **Auth via inheritance**: `Docs extends Auth extends EventEmitter`. Methods on `Docs` call `this.authenticate()` before making API requests.
- **Context binding**: `Story` and `NotificationCenter` are functions invoked with `.call(this, ...)` to bind to the `Docs` instance.
- **Zod validation**: All API responses are validated at runtime with Zod schemas defined inline in each module.
- **Async generators**: `searchAll()` uses `async *` for paginated iteration over large result sets.
- **Query DSL**: Complex boolean query strings are parsed via Nearley/Moo into an AST, then converted to nested `SearchQuery` objects by `QueryBuilder`.

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
- [oxlint](https://oxc.rs/docs/guide/usage/linter.html) (`.oxlintrc.json`), not type-aware (matches the previous ESLint config's non-type-checked `recommended` preset)
- Ignored paths: `node_modules`, `dist`, `src/grammar/index.ts` (generated), `examples`, `tools`
- Run with: `npm run lint`

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
- Everything in `dist/` - Build artifacts, gitignored.

### Build Order Matters
The full build (`npm run build`) runs in a specific sequence:
1. `build:parser` - Generate parser from grammar
2. `tsdown` - Single [tsdown](https://tsdown.dev) run producing unbundled esm/cjs (with per-module `.d.mts`/`.d.cts` declarations and sourcemaps) and the two minified browser bundles, all defined in `tsdown.config.mts`. tsdown cleans `dist/` itself before writing (use `--no-clean` to skip); `npm run clean` is only needed as a manual utility.
- CJS output uses `.cjs` and ESM output uses `.mjs` (not a shared `.js` + a `dist/*/package.json` `"type"` marker) so module type is unambiguous by extension alone — this is also what `tsdown --publint --attw` flagged when the old `.js`-based setup was tried.

### Environment Variables (for testing/examples)
```
AFPNEWS_BASE_URL        # API base URL (default: https://afp-apicore-prod.afp.com)
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
- Custom `ApiError` class in `src/utils/request.ts` with `code` and `message` fields
- API errors are parsed from JSON response bodies using Zod
- HTTP status codes used as fallback when JSON parsing fails

### Authentication Flows
1. **Anonymous**: `GET /oauth/token?grant_type=anonymous` with Basic auth (apiKey or clientId:clientSecret)
2. **Credentials**: `POST /oauth/token` with form data `grant_type=password` + username/password
3. **Refresh**: `POST /oauth/token` with form data `grant_type=refresh_token` + stored refresh token
- Tokens emit `tokenChanged` events via EventEmitter

### Publish Lifecycle
`npm run prepare` runs `lint` then `build` before publish, ensuring dist/ is always fresh.

### Node.js Compatibility
Minimum Node.js version: 12.20.0 (declared in `engines` field).
