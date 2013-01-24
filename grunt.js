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
    clean: {
      folder: 'dist/'
    },
    concat: {
      dist: {
        src: ['js/app/utils.js', 'js/app/core.js', 'js/app/models.js', 'js/app/collections.js', 'js/app/views.js', 'js/app/app.js'],
        dest: 'dist/<%= pkg.name %>.<%= pkg.version %>.js'
      },
      dist_latest: {
        src: '<config:concat.dist.src>',
        dest: 'dist/<%= pkg.name %>.latest.js'
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
      },
      dist_latest: {
        src: ['<banner:meta.banner>', '<config:concat.dist_latest.dest>'],
        dest: 'dist/<%= pkg.name %>.latest.min.js'
      }
    },
    copy: {
      dist: {
        files: {
          'dist/<%= pkg.name %>.<%= pkg.version %>.css': 'css/style.css',
          'dist/<%= pkg.name %>.<%= pkg.version %>.ie.css': 'css/style.ie.css'
        }
      },
      dist_latest: {
        files: {
          'dist/<%= pkg.name %>.latest.css': 'css/style.css',
          'dist/<%= pkg.name %>.latest.ie.css': 'css/style.ie.css'
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
    uglify: {},
    s3: {
      // This is specific to MinnPost
      //
      // These are assumed to be environment variables
      // See https://npmjs.org/package/grunt-s3
      //key: 'YOUR KEY',
      //secret: 'YOUR SECRET',
      bucket: 'data.minnpost',
      access: 'public-read',
      upload: [
        {
          src: 'dist/*',
          dest: 'projects/legislature-tracker/'
        }
      ]
    }
  });
  
  // Load plugin tasks
  grunt.loadNpmTasks('grunt-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-s3');

  // Default task.
  grunt.registerTask('default', 'lint clean concat min copy');
  grunt.registerTask('mp-deploy', 's3');

};
