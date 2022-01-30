module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  transform: {
    '^.+\\.vue$': 'vue-jest'
  },
  snapshotSerializers: [
    '<rootDir>/node_modules/jest-serializer-vue'
  ],
  setupFiles: ['<rootDir>/tests/jest/script/test-setup.js'],
  moduleNameMapper: {
    '^.+\\.gif$': '<rootDir>/tests/jest/__mocks__/fileMock.js'
  }
}
