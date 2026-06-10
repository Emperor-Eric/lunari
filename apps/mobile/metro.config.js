// Metro config for the Lunari monorepo (Expo SDK 54).
// Ensures shared workspace packages (packages/ui, packages/utils, …) and the
// mobile app all resolve a SINGLE copy of react / react-native, preventing the
// "Multiple copies of the react package" dual-React render crash.
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

// 3. Force singletons: every `import 'react'` / 'react-native' (including those
//    inside packages/ui and packages/utils) resolves to the app's one copy.
//    This is the key fix for the dual-React error — without it, Metro can pick
//    up a second React instance from a nested node_modules.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
}

module.exports = config
