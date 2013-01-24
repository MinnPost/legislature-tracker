/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    lint: {
      files: ['grunt.js', 'js/app/*.js']
    },
    concat: {
      dist: {
        src: ['js/app/utils.js', 'js/app/core.js', 'js/app/models.js', 'js/app/collections.js', 'js/app/views.js', 'js/app/app.js'],
        dest: 'dist/<%= pkg.name %>.<%= pkg.version %>.js'
      },
      libs: {
        src: ['js/lib/jquery.1.8.3.min.js', 'jquery.jsonp-2.4.0.min.js', 'underscore.1.4.3.min.js', 'backbone.0.9.10.min.js', 'tabletop.master-20130121.min.js'],
        dest: 'dist/<%= pkg.name %>.libs.js'
      }
    },
    min: {
      dist: {
        src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
        dest: 'dist/<%= pkg.name %>.<%= pkg.version %>.min.js'
      }
    },
    copy: {
      dist: {
        files: {
          'dist/<%= pkg.name %>.<%= pkg.version %>.css': 'css/style.css',
          'dist/<%= pkg.name %>.<%= pkg.version %>.ie.css': 'css/style.ie.css',
        }
      }
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint'
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true
      },
      globals: {
        jQuery: true,
        _: true,
        Backbone: true,
        Tabletop: true,
        LT: true
      }
    },
    uglify: {}
  });
  
  // Load plugin tasks
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task.
  grunt.registerTask('default', 'lint concat min copy');

};
