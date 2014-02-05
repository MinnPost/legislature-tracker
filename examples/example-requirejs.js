/**
 * Require JS
 */
require.config({
  shim: {
    'underscore': {
      exports: '_'
    },
    'backbone': {
      exports: 'Backbone',
      deps: ['jquery', 'underscore']
    },
    'tabletop': {
      exports: 'Tabletop'
    }
  },
  paths: {
    'jquery': '../bower_components/jquery/jquery.min',
    'underscore': '../bower_components/underscore/underscore-min',
    'backbone': '../bower_components/backbone/backbone-min',
    'tabletop': '../bower_components/tabletop/src/tabletop',
    'moment': '../bower_components/moment/min/moment.min',
    'LT': '../dist/legislature-tracker',
    'LTApp': '../dist/legislature-tracker',
    'LTHelpers': '../dist/legislature-tracker',
    'LTModels': '../dist/legislature-tracker',
    'LTCollections': '../dist/legislature-tracker',
    'LTViews': '../dist/legislature-tracker'
  }
});

require(['LT', 'LTApp'], function(LT) {
  var options = {
    el: '#legislature-tracker-container',
    templatePath: '../js/templates/',
    tabletopOptions: {
      parameterize: 'http://gs-proxy.herokuapp.com/proxy?url='
    },
    state: 'MN',
    session: '2013-2014',
    OSKey: '49c5c72c157d4b37892ddb52c63d06be',
    eKey: '0AtX8MXQ89fOKdFNaY1Nzc3p6MjJQdll1VEZwSDkzWEE',
    legImageProxy: 'http://i-mage-proxerific.herokuapp.com/resize?size=100x100&url=',
    imagePath: '../styles/images/'
  };

  // Make application
  var app = new LT.Application(options);
});