// babel-preset-taro 更多选项和默认值：
// https://docs.taro.zone/docs/next/babel-config
module.exports = {
  plugins: [
  ['@babel/plugin-proposal-optional-chaining'], // 支持 ?. 语法
  ['@babel/plugin-proposal-nullish-coalescing-operator'] // 支持 ??
],
  presets: [
    ['taro', {
      framework: 'vue3',
      ts: false,
      compiler: 'webpack5',
    }]
  ]
}
