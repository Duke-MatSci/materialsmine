module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  transform: {
    '^.+\\.vue$': 'vue-jest',
    '\\.(gif)$': '<rootDir>/tests/jest/__mocks__/fileMock.js'
  },
  snapshotSerializers: [
    '<rootDir>/node_modules/jest-serializer-vue'
  ],
  moduleNameMapper: {
    d3: '<rootDir>/node_modules/d3/dist/d3.min.js'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/jest/script/test-setup.js']
}
