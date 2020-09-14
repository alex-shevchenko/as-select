module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai-spies', 'chai'],
    files: [
      'dist/as-select.js',
      'test/**/*.js'
    ],
    preprocessors: {
      'dist/as-select.js': ['coverage']
    },
    reporters: ['mocha', 'coverage', 'remap-coverage'],
    coverageReporter: { type: 'in-memory' },
    remapCoverageReporter: { html: './coverage/html', text: null },
    remapOptions: { basePath: './dist' },

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
    concurrency: Infinity
  })
}
