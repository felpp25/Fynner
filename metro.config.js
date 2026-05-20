// Configuração do Metro bundler com suporte ao NativeWind v4.
// O arquivo global.css é o ponto de entrada das classes Tailwind.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
