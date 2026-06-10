// Metro config for the Lunari monorepo (Expo SDK 54).
// Paired with `node-linker=hoisted` in the root .npmrc, which flattens pnpm's
// node_modules so there is exactly one react / react-native in the tree. Metro
// then only needs to know where the monorepo lives and which node_modules to
// search — hierarchical resolution finds the single hoisted copy on its own, so
// no extraNodeModules forcing is required.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// 1. Watch the whole monorepo so Metro can read the workspace packages.
config.watchFolders = [monorepoRoot]

// 2. Resolve modules from the app first, then the hoisted root node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

module.exports = config
