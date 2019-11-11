module.exports = {
  displayName: 'tsc',
  transform: {
    ".(ts)": "ts-jest"
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  verbose: true,
  coverageThreshold: {
    global: {
      statements: 90,
      functions: 90,
      branches: 90,
      lines: 90
    }
  }
}
