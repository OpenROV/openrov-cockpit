module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['gruntfile.js', 'src/lib/*.js', 'src/*plugins/**/*.js'],
      options: {
        //maxlen: 120,
        quotmark: 'single'
      }
    },
    simplemocha: { // server side tests
      options: {
        globals: ['should'],
        timeout: 3000,
        ignoreLeaks: false,
        ui: 'bdd',
        reporter: 'spec',
        grep: 'unit'
      },
      all: { src: [
        'src/*plugins/**/tests/*.js',
        'src/tests/**/*.js'
      ]}
    },
    mocha: { // client side
      test: {
        src: ['src/*plugins/**/public/tests/*.html']
      }
    },
    watch:{
      all:{
        files:[
          'src/*plugins/**/tests/*.js',
          'src/tests/**/*.js'
        ],
        tasks:['test']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-mocha');

  grunt.registerTask('test', ['simplemocha', 'mocha']);
  grunt.registerTask('default', ['jshint', 'test' ]);
  grunt.registerTask('watch', ['test', 'watch:all']);
};
