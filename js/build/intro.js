/**
 * Top wrapper for module.
 *
 * Tries to support different modular libraries.
 */

 (function(global, factory) {
  // Common JS (i.e. browserify) environment
  if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
    module.exports = factory(require('underscore'), require('jquery'), require('Backbone'), require('moment'), require('tabletop'), require('Ractive'));
  }
  // AMD
  else if (typeof define === 'function' && define.amd) {
    define('LT', ['underscore', 'jquery', 'Backbone', 'moment', 'tabletop', 'Ractive'], factory);
  }
  // Browser global
  else if (global._ && global.jQuery && global.Backbone && global.moment && global.Tabletop) {
    global.LT = factory(global._, global.jQuery, global.Backbone, global.moment, global.Tabletop, global.Ractive);
  }
  else {
    throw new Error('Could not find dependencies for Legislature Tracker.');
  }
})(typeof window !== 'undefined' ? window : this, function(_, $, Backbone, moment, Tabletop, Ractive) {

  // Container for objects and functions that do not need
  // the application context
  var LT = {};

  // Application "class"
  var App;
