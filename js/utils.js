/**
 * Utility functions for Legislature Tracker application.
 */

(function(global, factory) {
  // Common JS (i.e. browserify) environment
  if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
    factory(require('underscore'), require('jquery'), require('backbone'));
  }
  // AMD?
  else if (typeof define === 'function' && define.amd) {
    define('LTHelpers', ['underscore', 'jquery', 'backbone'], factory);
  }
  // Browser global
  else if (global._ && global.jQuery && global.Backbone) {
    factory(global._, global.jQuery, global.Backbone);
  }
  else {
    throw new Error('Could not find dependencies for LT Helpers.');
  }
})(typeof window !== 'undefined' ? window : this, function(_, $, Backbone) {

  /**
   * These will just extend underscore since that is the
   * utility library already being used.
   */
  _.mixin({
    trim: function(str) {
      if (_.isString(str)) {
        if (!String.prototype.trim) {
          str = str.replace(/^\s+|\s+$/g, '');
        }
        else {
          str = str.trim();
        }
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
      // The default is to count words and create an ellipsis break
      // there that will be handled by showing and hiding the relevant
      // parts on details and non-detailed views.
      //
      // But if the separator is found, we will separate the text
      // there.
      var output = '';
      var templateBreak = '<!-- break -->';
      var templateStart = '<ins class="ellipsis-start">[[[TEXT]]]</ins>';
      var templateEllipsis = '<ins class="ellipsis-ellipsis">...</ins>';
      var templateEnd = '<ins class="ellipsis-end">[[[TEXT]]]</ins>';
      var slice, sliceStart, sliceEnd, words;

      // Look for break, otherwise use word count
      if (text.indexOf(templateBreak) !== -1) {
        slice = text.indexOf(templateBreak);
        output += templateStart.replace('[[[TEXT]]]', text.substring(0, slice)) + ' ';
        output += templateEllipsis + ' ';
        output += templateEnd.replace('[[[TEXT]]]', text.substring(slice, text.length)) + ' ';
      }
      else {
        words = text.split(' ');
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
      }

      return output;
    },

    // A simple URL parser as stolen from
    // https://gist.github.com/jlong/2428561
    parseURL: function(url) {
      var parser = document.createElement('a');
      parser.href = url;
      return parser;
    }
  });


  /**
   * Override Backbone's ajax function to use jsonp
   */
  Backbone.ajax = function() {
    var options = arguments;

    if (options[0].dataTypeForce !== true) {
      options[0].dataType = 'jsonp';
    }
    return Backbone.$.ajax.apply(Backbone.$, options);
  };

  /**
   * Basic jQuery plugin to see if element
   * has a scroll bar.
   */
  $.fn.hasScrollBar = function() {
    return (this.get(0) && this.get(0).scrollHeight) ?
      (this.get(0).scrollHeight > this.height()) : false;
  };
});