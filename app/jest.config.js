module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  transform: {
    '^.+\\.vue$': 'vue-jest'
  },
  snapshotSerializers: [
    '<rootDir>/node_modules/jest-serializer-vue'
  ],
  moduleNameMapper: {
    '\\.(gif)$': '<rootDir>/tests/jest/__mocks__/fileMock.js',
    '^@$': '<rootDir>/src',
    '^@/(.*)': '<rootDir>/src/$1',
    '^@\/(.*)': '<rootDir>/src/$1',
  }
}
