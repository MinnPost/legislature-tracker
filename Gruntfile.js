/*global module:false*/
module.exports = function(grunt) {

  // FTP deploy variables
  var ftpserver = grunt.option('ftpserver') || '';
  var ftpdir = grunt.option('ftpdir') || '';
  var ftpport = parseInt(grunt.option('ftpport'), 10) || 21;

  // S3 deploy variables
  var s3bucket = grunt.option('s3bucket') || '';
  var s3dir = grunt.option('s3dir') || '';

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
    jshint: {
      files: ['Gruntfile.js', 'js/app/*.js']
    },
    clean: {
      folder: 'dist/'
    },
    jst: {
      compile: {
        options: {
          namespace: 'LT.templates'
        },
        templates: {
          src: ['js/app/templates/*.html'],
          dest: 'dist/templates.js'
        }
      }
    },
    concat: {
      options: {
        separator: '\r\n\r\n'
      },
      dist: {
        src: ['js/app/utils.js', 'js/app/core.js', 'dist/templates.js', 'js/app/models.js', 'js/app/collections.js', 'js/app/views.js', 'js/app/app.js'],
        dest: 'dist/<%= pkg.name %>.<%= pkg.version %>.js'
      },
      dist_latest: {
        src: ['<%= concat.dist.src %>'],
        dest: 'dist/<%= pkg.name %>.latest.js'
      },
      libs: {
        src: ['js/lib/underscore.1.4.3.min.js', 'js/lib/jquery.1.8.3.min.js', 'js/lib/jquery.jsonp-2.4.0.min.js', 'js/lib/jquery.qtip.master-20130221.min.js', 'js/lib/backbone.0.9.10.min.js', 'js/lib/tabletop-zzolo.master-20130402.min.js', 'js/lib/moment.2.0.0.min.js'],
        dest: 'dist/<%= pkg.name %>.libs.js',
        options: {
          separator: ';\r\n\r\n'
        }
      }
    },
    uglify: {
      options: {
        banner: '<%= meta.banner %>'
      },
      dist: {
        src: ['<%= concat.dist.dest %>'],
        dest: 'dist/<%= pkg.name %>.<%= pkg.version %>.min.js'
      },
      dist_latest: {
        src: ['<%= concat.dist_latest.dest %>'],
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
      },
      images: {
        files: [
          {
            cwd: './css/images/',
            expand: true,
            filter: 'isFile',
            src: ['*'],
            dest: 'dist/images/'
          }
        ]
      }
    },
    'ftp-deploy': {
      deploy: {
        auth: {
          host: ftpserver,
          port: ftpport,
          authKey: 'leg-tracker-key'
        },
        src: 'dist',
        dest: ftpdir,
        exclusions: ['dist/**/.DS_Store', 'dist/**/Thumbs.db']
      }
    },
    s3: {
      options: {
        // This is specific to MinnPost
        //
        // These are assumed to be environment variables
        // See https://npmjs.org/package/grunt-s3
        //key: 'YOUR KEY',
        //secret: 'YOUR SECRET',
        bucket: s3bucket,
        access: 'public-read'
      },
      deploy: {
        upload: [
          { src: 'dist/*', dest: s3dir },
          { src: 'dist/images/*', dest: s3dir + 'images/' }
        ]
      }
    }
  });
  
  // Load plugin tasks
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jst');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-ftp-deploy');
  grunt.loadNpmTasks('grunt-s3');

  // Default task.
  grunt.registerTask('default', ['jshint', 'clean', 'jst', 'concat', 'uglify', 'copy']);
  
  // Deploy task that uses environment variables.  Example
  // grunt deploy-s3 --s3bucket="our_bucket" --s3dir="path/to/dest/"
  // Not working
  grunt.registerTask('deploy-s3', ['s3']);
  
  // Deploy task for ftp that uses environment variables.  Example
  // grunt deploy-ftp --ftpserver="example.com" --ftpdir="projects/leg-tracker/" --ftpport=21
  // Not working
  grunt.registerTask('deploy-ftp', ['ftp-deploy']);

};
