module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    // react-native-worklets/plugin replaces the old react-native-reanimated/plugin
    // in SDK 54 (Reanimated 4). It must be listed last.
    plugins: ['react-native-worklets/plugin'],
  }
}
