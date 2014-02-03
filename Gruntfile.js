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
      files: ['Gruntfile.js', 'js/*.js']
    },
    clean: {
      folder: 'dist/'
    },
    jst: {
      options: {
        namespace: 'LT.templates'
      },
      templates: {
        src: ['js/templates/*.html'],
        dest: 'dist/templates.js'
      }
    },
    concat: {
      options: {
        separator: '\r\n\r\n'
      },
      dist: {
        src: [
          'js/utils.js',
          'js/core.js',
          'dist/templates.js',
          'js/models.js',
          'js/collections.js',
          'js/views.js',
          'js/app.js'
        ],
        dest: 'dist/<%= pkg.name %>.<%= pkg.version %>.js'
      },
      dist_latest: {
        src: ['<%= concat.dist.src %>'],
        dest: 'dist/<%= pkg.name %>.latest.js'
      },
      libs: {
        src: [
          'bower_components/underscore/underscore-min.js',
          'bower_components/jquery/jquery.min.js',
          'bower_components/qtip2/jquery.qtip.min.js',
          'bower_components/backbone/backbone-min.js',
          'bower_components/tabletop/src/tabletop.js',
          'bower_components/moment/moment.js'
        ],
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
    'sftp-deploy': {
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
  grunt.loadNpmTasks('grunt-sftp-deploy');
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
  
  // Deploy task for sft.  Same as sftp
  // grunt deploy-sftp --ftpserver="example.com" --ftpdir="/path/to/dest/" --ftpport=22
  // Not working
  grunt.registerTask('deploy-sftp', ['sftp-deploy']);

};
