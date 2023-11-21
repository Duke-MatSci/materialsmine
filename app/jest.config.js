module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{js,vue}', '!src/router/**'],
  coverageThreshold: {
    // global: {
    //   branches: 13,
    //   functions: 30,
    //   lines: 30,
    //   statements: 30
    // }
  },
  transform: {
    '\\.(gif)$': '<rootDir>/tests/jest/__mocks__/fileMock.js',
    '\\.(ttl|rq)': 'jest-raw-loader',
    '^.+\\.js$': 'babel-jest',
    '.*\\.(vue)$': 'vue-jest'
  },
  snapshotSerializers: [
    '<rootDir>/node_modules/jest-serializer-vue'
  ],
  moduleNameMapper: {
    d3: '<rootDir>/node_modules/d3/dist/d3.min.js',
    prismjs: '<rootDir>/node_modules/prismjs/prism.js',
    plotly: '<rootDir>/node_modules/plotly.js/dist/plotly.min.js',
    'style-loader!(.*)': '<rootDir>/node_modules/style-loader'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/jest/script/test-setup.js'],
  moduleFileExtensions: ['js', 'vue', 'json'],
  globals: {
    'vue-jest': {
      templateCompiler: {
        compiler: require('vue-template-babel-compiler')
      }
    }
  }
}
