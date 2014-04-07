/**
 * Require JS
 */
require.config({
  shim: {
    'tabletop': {
      exports: 'Tabletop'
    }
  },
  paths: {
    'jquery': '../bower_components/jquery/jquery.min',
    'underscore': '../bower_components/underscore/underscore',
    'Backbone': '../bower_components/backbone/backbone',
    'tabletop': '../bower_components/tabletop/src/tabletop',
    'Ractive': '../bower_components/ractive/build/Ractive-legacy.min',
    'Ractive-events-tap': '../bower_components/ractive-events-tap/Ractive-events-tap.min',
    'moment': '../bower_components/moment/min/moment.min',
    'LT': '../dist/legislature-tracker'
  }
});

require(['LT'], function(LT) {
  var app = new LT({
    el: '#legislature-tracker-container',
    imagePath: '../styles/images/',
    tabletopOptions: {
      parameterize: 'http://gs-proxy.herokuapp.com/proxy?url='
    },
    state: 'MN',
    session: '2013-2014',
    OSKey: '49c5c72c157d4b37892ddb52c63d06be',
    eKey: '0AtX8MXQ89fOKdFNaY1Nzc3p6MjJQdll1VEZwSDkzWEE',
    legImageProxy: 'http://i-mage-proxerific.herokuapp.com/resize?size=100x100&url='
  });
});
