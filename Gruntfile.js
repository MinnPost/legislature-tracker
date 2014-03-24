/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") + "\\n" %>' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */' +
        '<%= "\\n\\n" %>'
    },

    // JS code quality
    jshint: {
      files: ['Gruntfile.js', 'js/**.js', 'examples/**.js']
    },

    // Cleanup dist filder
    clean: {
      folder: 'dist/'
    },

    // Embed in template files
    template_inline: {
      options: {
        namespace: 'LTTemplates',
        processName: function(filename) {
          return filename.split('/').pop().split('.')[0];
        }
      },
      templates: {
        src: ['js/templates/*.html'],
        dest: '_tmp/templates.js'
      }
    },


    // Set it up so that it generates to _tmp/styles (we use this
    // in the hosted version so it should be versioned)
    compass: {
      options: {
        sassDir: 'styles',
        cssDir: '_tmp/styles',
        generatedImagesDir: '_tmp/styles/images',
        fontsDir: 'styles/fonts',
        imagesDir: 'styles/images',
        javascriptsDir: 'js',
        importPath: 'bower_components',
        httpPath: './',
        relativeAssets: true,
        outputStyle: 'expanded'
      },
      compile: {
        options: {
        }
      }
    },

    // Combine files
    concat: {
      options: {
        separator: '\r\n\r\n'
      },
      dist: {
        src: [
          'js/build/intro.js',
          '_tmp/templates.js',
          'js/extensions.js',
          'js/parsers.js',
          'js/models.js',
          'js/collections.js',
          'js/views.js',
          'js/routers.js',
          'js/app.js',
          'js/build/outro.js'
        ],
        dest: 'dist/<%= pkg.name %>.js'
      },
      libs: {
        src: [
          'bower_components/underscore/underscore-min.js',
          'bower_components/jquery/jquery.min.js',
          'bower_components/backbone/backbone.js',
          'bower_components/tabletop/src/tabletop.js',
          'bower_components/moment/moment.js',
          'bower_components/ractive/build/Ractive-legacy.min.js',
          'bower_components/ractive-backbone/Ractive-Backbone.min.js',
          'bower_components/Ractive-events-tap/Ractive-events-tap.min.js'
        ],
        dest: 'dist/<%= pkg.name %>.libs.js',
        options: {
          separator: ';\r\n\r\n'
        }
      },
      css: {
        src: [
          '_tmp/styles/style.css'
        ],
        dest: 'dist/<%= pkg.name %>.css'
      }
    },

    // Minify files
    uglify: {
      options: {
        banner: '<%= meta.banner %>'
      },
      dist: {
        src: ['<%= concat.dist.dest %>'],
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },

    // Minify CSS for network efficiency
    cssmin: {
      options: {
        banner: '<%= meta.banner %>',
        report: true
      },
      css: {
        src: ['<%= concat.css.dest %>'],
        dest: 'dist/<%= pkg.name %>.min.css'
      }
    },

    // Copy files
    copy: {
      images: {
        files: [
          {
            cwd: './styles/images/',
            expand: true,
            filter: 'isFile',
            src: ['*'],
            dest: 'dist/images/'
          }
        ]
      }
    },

    // HTTP Server
    connect: {
      server: {
        options: {
          port: 8136
        }
      }
    },

    // Watches files for changes and performs task
    watch: {
      files: ['<%= jshint.files %>', '<%= template_inline.templates.src %>', 'examples/*.js', 'styles/*.scss'],
      tasks: ['default']
    }
  });

  // Load plugin tasks
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-template-inline');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-compass');

  // Default build task.
  grunt.registerTask('default', ['compass', 'jshint', 'clean', 'template_inline', 'concat', 'uglify', 'cssmin', 'copy']);

  // Development server
  grunt.registerTask('server', ['default', 'connect', 'watch']);
};
