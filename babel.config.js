// Babel é necessário para que o NativeWind v4 processe as classes Tailwind
// no JSX e para que o Reanimated/Worklets transforme as funções de animação.
// O plugin 'react-native-worklets/plugin' DEVE ser o último da lista.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: ["react-native-worklets/plugin"],
  };
};
