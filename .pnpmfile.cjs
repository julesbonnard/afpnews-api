// Temporary shim while typescript-eslint and rollup-plugin-dts wait on stable
// TS7/Corsa support: give them TS6's API via @typescript/typescript6 instead of
// the root project's typescript@7, since pnpm.overrides can't target peerDependencies.
// See PR #101.
const TS6_SHIM = 'npm:@typescript/typescript6@^6.0.2'

const PACKAGES_NEEDING_TS6 = new Set([
  'typescript-eslint',
  '@typescript-eslint/parser',
  '@typescript-eslint/eslint-plugin',
  '@typescript-eslint/typescript-estree',
  '@typescript-eslint/type-utils',
  '@typescript-eslint/utils',
  '@typescript-eslint/project-service',
  '@typescript-eslint/tsconfig-utils',
  'ts-api-utils',
  'rollup-plugin-dts',
])

function readPackage(pkg) {
  if (PACKAGES_NEEDING_TS6.has(pkg.name)) {
    if (pkg.peerDependencies) delete pkg.peerDependencies.typescript
    if (pkg.peerDependenciesMeta) delete pkg.peerDependenciesMeta.typescript
    pkg.dependencies = { ...pkg.dependencies, typescript: TS6_SHIM }
  }
  return pkg
}

module.exports = {
  hooks: {
    readPackage,
  },
}
