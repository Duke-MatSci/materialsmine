module.exports = {
  lintOnSave: false,
  devServer: {
    disableHostCheck: true
  },
  chainWebpack: (config) => {
    // Suggestion for having actual lazy-loading
    config.plugins.delete('prefetch')
    // Add a raw loader for certain file types to import file contents as a string
    config.module.rule('raw')
      .test(/\.(ttl|rq)$/)
      .use('raw-loader')
      .loader('raw-loader')
      .end()
  }
}
