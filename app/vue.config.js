const path = require('path');
module.exports = {
  lintOnSave: false,
  devServer: {
    disableHostCheck: true
  },
  chainWebpack: (config) => {
    // Add a raw loader for certain file types to import file contents as a string
    config.module.rule('raw')
      .test(/\.(ttl|rq)$/)
      .use('raw-loader')
      .loader('raw-loader')
      .end()
  }
}
