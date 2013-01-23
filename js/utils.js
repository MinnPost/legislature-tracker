/**
 * Utility functions for Legislature Tracker application.
 */

/**
 * These will just extend underscore since that is the
 * utility library already being used.
 */
(function() {
  _.mixin({
    trim: function(str) {
      if (!String.prototype.trim) {
        return str.replace(/^\s+|\s+$/g, '');;
      }
      else {
        return str.trim();
      }
    }
  })
})();

/**
 * Override Backbone's ajax function to use $.jsonp
 */
(function($, Backbone, undefined) {
  if (_.isFunction(Backbone.$.jsonp)) {
    Backbone.ajax = function() {
      return Backbone.$.jsonp.apply(Backbone.$, arguments);
    };
  }
})(jQuery, Backbone);