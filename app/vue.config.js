/* eslint-disable @typescript-eslint/no-var-requires */
const { defineConfig } = require('@vue/cli-service');
const path = require('path');

module.exports = defineConfig({
  transpileDependencies: [], // Explicitly transpile only what's needed

  devServer: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: 'all',
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws',
    },
  },

  configureWebpack: {
    devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',

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
        'font-awesome-sass-loader': path.resolve(__dirname, 'src/shims/empty.ts'),
      },
      fallback: {
        fs: false,
        path: false,
      },
    },

    optimization: {
      splitChunks: {
        chunks: 'all',
      },
      minimize: process.env.NODE_ENV === 'production',
    },

    // Suppress specific webpack warnings
    ignoreWarnings: [
      {
        module: /node_modules/,
      },
      /Should not import the named export/,
      /export.*was not found/,
    ],
  },

  chainWebpack: (config) => {
    // Exclude large libs from Babel transpilation
    config.module
      .rule('js')
      .exclude.add(/node_modules[\\/]lodash/)
      .add(/node_modules[\\/]plotly.js/)
      .add(/node_modules[\\/]mapbox-gl/)
      .add(/node_modules[\\/]v-jsoneditor/)
      .add(/node_modules[\\/]@triply[\\/]yasqe/)
      .add(/node_modules[\\/]@triply[\\/]yasr/)
      .end();

    // Configure ESLint plugin to exclude node_modules
    if (config.plugins.has('eslint')) {
      config.plugin('eslint').tap((args) => {
        args[0] = {
          ...args[0],
          exclude: ['node_modules', 'dist', 'build'],
          emitWarning: process.env.NODE_ENV !== 'production',
          emitError: process.env.NODE_ENV === 'production',
        };
        return args;
      });
    }
  },

  productionSourceMap: false, // Prevent .map files from bloating production
});
