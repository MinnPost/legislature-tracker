/**
 * Utility functions for Legislature Tracker application.
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