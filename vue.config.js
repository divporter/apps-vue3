const { ProvidePlugin } = require("webpack")
const { defineConfig } = require("@vue/cli-service")
module.exports = defineConfig({
  transpileDependencies: true,
  css: {
    extract: true,
    sourceMap: true,
  },
  configureWebpack: (config) => ({
    plugins: [
      new ProvidePlugin({
        process: "process/browser",
        Buffer: ["buffer", "Buffer"],
      }),
    ],
    resolve: {
      alias: {
        stream: "stream-browserify",
        assert: require.resolve("assert/"),
      },
    },
  }),
  chainWebpack: (config) => {
    config.module
      .rule("vue")
      .use("vue-loader")
      .tap((options) => ({
        ...options,
        compilerOptions: {
          // treat any tag that starts with ion- as custom elements
          isCustomElement: (tag) => ["on-loading"].includes(tag),
        },
      }))
  },
})
