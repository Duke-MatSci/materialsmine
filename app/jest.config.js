module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{js,vue}', '!src/router/**'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  transform: {
    '^.+\\.vue$': 'vue-jest',
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
