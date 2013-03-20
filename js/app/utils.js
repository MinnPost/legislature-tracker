/**
 * Utility functions for Legislature Tracker application.
 */

(function($, w, undefined) {

  /**
   * These will just extend underscore since that is the
   * utility library already being used.
   */
  _.mixin({
    trim: function(str) {
      if (!String.prototype.trim) {
        str = str.replace(/^\s+|\s+$/g, '');
      }
      else {
        str = str.trim();
      }
      
      return str;
    },
    cssClass: function(str) {
      return str.replace(/[^a-z0-9]/g, '-');
    },
    numberFormatCommas: function(number) {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    ellipsisText: function(text, wordCount) {
      var words = text.split(' ');
      var output = '';
      var templateStart = '<span class="ellipsis-start">[[[TEXT]]]</span>';
      var templateEllipsis = '<span class="ellipsis-ellipsis">...</span>';
      var templateEnd = '<span class="ellipsis-end">[[[TEXT]]]</span>';
      var sliceStart, sliceEnd;
      
      if (words.length <= wordCount) {
        output += templateStart.replace('[[[TEXT]]]', text);
      }
      else {
        sliceStart = words.slice(0, wordCount);
        sliceEnd = words.slice(wordCount);
        output += templateStart.replace('[[[TEXT]]]', sliceStart.join(' ')) + ' ';
        output += templateEllipsis + ' ';
        output += templateEnd.replace('[[[TEXT]]]', sliceEnd.join(' ')) + ' ';
      }
      
      return output;
    }
  });
  

  /**
   * Override Backbone's ajax function to use $.jsonp
   */
  if (_.isFunction(Backbone.$.jsonp)) {
    Backbone.ajax = function() {
      return Backbone.$.jsonp.apply(Backbone.$, arguments);
    };
  }
  
  /**
   * Basic jQuery plugin to see if element
   * has a scroll bar.
   */
  $.fn.hasScrollBar = function() {
    return (this.get(0) && this.get(0).scrollHeight) ?
      (this.get(0).scrollHeight > this.height()) : false;
  };
})(jQuery, window);