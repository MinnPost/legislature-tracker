/**
 * Override Backbone's ajax function to use $.jsonp
 */
(function($, Backbone, undefined) {
  Backbone.ajax = function() {
    return $.jsonp.apply(Backbone.$, arguments);
  };
})(jQuery, Backbone);