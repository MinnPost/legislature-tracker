/**
 * Library extensions for Legislature Tracker application.
 */

/**
 * These will just extend underscore since that is the
 * utility library already being used.
 */
_.mixin({

  filterEmpty: function(collection) {
    return _.filter(collection, function(c) {
      return c;
    });
  },

  // _.filter for objects, keeps key/value associations
  // but only includes the properties that pass test().
  filterObject: function (input, test, context) {
    return _.reduce(input, function (obj, v, k) {
      if (test.call(context, v, k, input)) {
        obj[k] = v;
      }
      return obj;
    }, {}, context);
  },

  // _.map for objects, keeps key/value associations
  mapObject: function (input, mapper, context) {
    return _.reduce(input, function (obj, v, k) {
      obj[k] = mapper.call(context, v, k, input);
      return obj;
    }, {}, context);
  },

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



/**
 * (copied) Backbone Ractive adaptor plugin
 *
 * original: https://github.com/RactiveJS/Ractive-adaptors-Backbone
 *
 * Added 'sync' event.
*/
(function ( global, factory ) {

  'use strict';

  // Common JS (i.e. browserify) environment
  if ( typeof module !== 'undefined' && module.exports && typeof require === 'function' ) {
    factory( require( 'ractive' ), require( 'backbone' ) );
  }

  // AMD?
  else if ( typeof define === 'function' && define.amd ) {
    define([ 'Ractive', 'Backbone' ], factory );
  }

  // browser global
  else if ( global.Ractive && global.Backbone ) {
    factory( global.Ractive, global.Backbone );
  }

  else {
    throw new Error( 'Could not find Ractive or Backbone! Both must be loaded before the Ractive-Backbone plugin' );
  }

}( typeof window !== 'undefined' ? window : this, function ( Ractive, Backbone ) {

  'use strict';

  var BackboneModelWrapper, BackboneCollectionWrapper;

  if ( !Ractive || !Backbone ) {
    throw new Error( 'Could not find Ractive or Backbone! Check your paths config' );
  }

  Ractive.adaptors.Backbone = {
    filter: function ( object ) {
      if (object instanceof Backbone.Model || object instanceof Backbone.Collection) {
      }
      return object instanceof Backbone.Model || object instanceof Backbone.Collection;
    },
    wrap: function ( ractive, object, keypath, prefix ) {
      if ( object instanceof Backbone.Model ) {
        return new BackboneModelWrapper( ractive, object, keypath, prefix );
      }

      return new BackboneCollectionWrapper( ractive, object, keypath, prefix );
    }
  };

  BackboneModelWrapper = function ( ractive, model, keypath, prefix ) {
    var wrapper = this;

    this.value = model;
    model.on( 'change', this.modelChangeHandler = function () {
      wrapper.setting = true;
      ractive.set( prefix( model.changed ) );
      wrapper.setting = false;
    });
    // Handle sync
    model.on( 'sync', this.modelSyncHandler = function () {
      ractive.update(keypath);
    });
  };

  BackboneModelWrapper.prototype = {
    teardown: function () {
      this.value.off( 'change', this.changeHandler );
      this.value.off( 'sync', this.modelSyncHandler );
    },
    get: function () {
      return this.value.attributes;
    },
    set: function ( keypath, value ) {
      // Only set if the model didn't originate the change itself, and
      // only if it's an immediate child property
      if ( !this.setting && keypath.indexOf( '.' ) === -1 ) {
        this.value.set( keypath, value );
      }
    },
    reset: function ( object ) {
      // If the new object is a Backbone model, assume this one is
      // being retired. Ditto if it's not a model at all
      if ( object instanceof Backbone.Model || typeof object !== 'object' ) {
        return false;
      }

      // Otherwise if this is a POJO, reset the model
      this.value.reset( object );
    }
  };

  BackboneCollectionWrapper = function ( ractive, collection, keypath ) {
    var wrapper = this;

    this.value = collection;

    collection.on( 'add remove reset', this.changeHandler = function () {
      // TODO smart merge. It should be possible, if awkward, to trigger smart
      // updates instead of a blunderbuss .set() approach
      wrapper.setting = true;
      ractive.set( keypath, collection.models );
      wrapper.setting = false;
    });
    // Separate sort handler as sort is not changing the models
    collection.on( 'sort', this.sortHandler = function () {
      wrapper.setting = true;
      ractive.update(keypath);
      wrapper.setting = false;
    });

  };

  BackboneCollectionWrapper.prototype = {
    teardown: function () {
      this.value.off( 'add remove reset', this.changeHandler );
      this.value.off( 'sort', this.sortHandler );
    },
    get: function () {
      return this.value.models;
    },
    reset: function ( models ) {
      if ( this.setting ) {
        return;
      }

      // If the new object is a Backbone collection, assume this one is
      // being retired. Ditto if it's not a collection at all
      if ( models instanceof Backbone.Collection || Object.prototype.toString.call( models ) !== '[object Array]' ) {
        return false;
      }

      // Otherwise if this is a plain array, reset the collection
      this.value.reset( models );
    }
  };

}));
