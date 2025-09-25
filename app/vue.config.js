const { defineConfig } = require('@vue/cli-service');
const path = require('path');

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: 'all',
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws',
    },
  },
  configureWebpack: {
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.(ttl|rq)$/,
          type: 'asset/source',
        },
      ],
    },
    resolve: {
      alias: {
        // datavoyager UMD bundle requires this legacy loader for styles.
        // Alias to a no-op module to avoid incompatible webpack 5 loader execution.
        'font-awesome-sass-loader': path.resolve(__dirname, 'src/shims/empty.ts'),
      },
    },
  },
});
