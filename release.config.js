module.exports = {
  branches: 'main',
  repositoryUrl: 'https://github.com/Duke-MatSci/materialsmine',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    ['@semantic-release/github', {
      assets: [
        { path: './app-test-coverage-report.zip', label: 'AppBuild' },
        { path: './app-src_code.zip', label: 'AppCoverage' },
        { path: './backend-test-coverage-report.zip', label: 'BackendCoverage' },
        { path: './backend-src_code.zip', label: 'BackendBuild' }
      ]
    }],
    ['@semantic-release/exec',
      {
        publishCmd: 'echo ::set-output name=nextVer::${nextRelease.version}'
      }
    ]
  ]
}
