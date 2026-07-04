/**
 * Vendored, Babel-8-compatible replacement for `babel-plugin-add-import-extension`.
 *
 * The upstream package (last published 2021, unmaintained) hard-asserts
 * `api.assertVersion(7)` and therefore throws under Babel 8
 * (`BABEL_VERSION_UNSUPPORTED`). Its actual transform logic is tiny, so
 * rather than depend on an abandoned package we vendor an equivalent
 * plugin here, stripped of the Babel-7-only version assertion.
 *
 * Behaviour is intentionally identical to the upstream plugin's defaults
 * (adds a `.js` extension to relative, extension-less import/export
 * specifiers so the emitted ESM output resolves under Node's ESM loader).
 *
 * Upstream reference: https://codeberg.org/karl/babel-plugin-add-import-extension
 */
import { existsSync, lstatSync } from 'node:fs'
import { resolve as resolvePath, extname, dirname } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const isActiveExtension = (module, observedScriptExtensions) =>
  observedScriptExtensions.indexOf(extname(module).replace(/[^a-z]/, '')) > -1

const isNodeModule = module => {
  if (module.startsWith('.') || module.startsWith('/')) {
    return false
  }

  try {
    require.resolve(module)
    return true
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      return false
    }
    console.error(e)
  }
}

const skipModule = (module, { replace, extension, observedScriptExtensions }) =>
  !module.startsWith('.') ||
  isNodeModule(module) ||
  (
    replace && (isActiveExtension(module, observedScriptExtensions) || extname(module) === `.${extension}`)
      ? extname(module) === `.${extension}`
      : extname(module).length &&
        (isActiveExtension(module, observedScriptExtensions) || extname(module) === `.${extension}`) &&
        extname(module) === `.${extension}`
  )

const makeDeclaration =
  (t, { declaration, args, replace = false, extension = 'js', observedScriptExtensions = ['js', 'ts', 'jsx', 'tsx', 'mjs', 'cjs'] }) =>
    (path, { file: { opts: { filename } } }) => {
      const { node } = path
      const { source, exportKind, importKind } = node

      const isTypeOnly = exportKind === 'type' || importKind === 'type'

      if (!source || isTypeOnly) { return }

      const module = source && source.value

      if (skipModule(module, { replace, extension, observedScriptExtensions })) { return }

      const dirPath = resolvePath(dirname(filename), module)

      const hasModuleExt = extname(module).length && isActiveExtension(module, observedScriptExtensions)
      const newModuleName = hasModuleExt ? module.slice(0, -extname(module).length) : module

      const pathLiteral = () => {
        if (existsSync(dirPath) && lstatSync(dirPath).isDirectory()) {
          return `${module}${newModuleName.endsWith('/') ? '' : '/'}index.${extension}`
        }

        return `${newModuleName}.${extension}`
      }

      path.replaceWith(
        declaration(
          ...args(path),
          t.stringLiteral(pathLiteral())
        )
      )
    }

export default function addImportExtensionLocal (api, options) {
  const t = api.types

  return {
    name: 'add-import-extension-local',
    visitor: {
      ImportDeclaration: makeDeclaration(t, {
        ...options,
        declaration: t.importDeclaration,
        args: ({ node: { specifiers } }) => [specifiers]
      }),
      ExportNamedDeclaration: makeDeclaration(t, {
        ...options,
        declaration: t.exportNamedDeclaration,
        args: ({ node: { declaration, specifiers } }) => [declaration, specifiers]
      }),
      ExportAllDeclaration: makeDeclaration(t, {
        ...options,
        declaration: t.exportAllDeclaration,
        args: () => []
      })
    }
  }
}
