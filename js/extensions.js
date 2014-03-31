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
    return str.toLowerCase().replace(/[^a-z0-9]/g, '-');
  },

  numberFormatCommas: function(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
 * Sticky navbar jQuery plugin
 */
LT.nav = LT.nav || {};

// Plugin for sticking things.  Defaults are for sticking to top.
LT.nav.stickDefaults = {
  activeClass: 'stuck top',
  wrapperClass: 'menu-stick-container',
  topPadding: 0,
  throttle: 90
};
function LTStick(element, options) {
  // Defined some values and process options
  this.element = element;
  this.$element = $(element);
  this._defaults = LT.nav.stickDefaults;
  this.options = $.extend( {}, this._defaults, options);
  this._name = 'ltStick';
  this._scrollEvent = 'scroll.lt.ltStick';
  this._on = false;

  this.init();
}
LTStick.prototype = {
  init: function() {
    // If contaier not passed, use parent
    this.$container = (this.options.container === undefined) ? this.$element.parent() : $(this.options.container);
    this.elementHeight = this.$element.outerHeight(true);

    // Create a spacer element so content doesn't jump
    this.$spacer = $('<div>').height(this.elementHeight).hide();
    this.$element.after(this.$spacer);

    // Add wrapper
    if (this.options.wrapperClass) {
      this.$element.wrapInner('<div class="' + this.options.wrapperClass + '"></div>');
    }

    // Throttle the scoll listen for better perfomance
    this._throttledListen = _.bind(_.throttle(this.listen, this.options.throttle), this);
    this._throttledListen();
    $(window).on(this._scrollEvent, this._throttledListen);
  },

  listen: function() {
    var containerTop = this.$container.offset().top;
    var containerBottom = containerTop + this.$container.height();
    var scrollTop = $(window).scrollTop();
    var top = (containerTop - this.options.topPadding);
    var bottom = (containerBottom - this.elementHeight - this.options.topPadding - 2);

    // Test whether we are in the container and whether its
    // already stuck or not
    if (!this._on && scrollTop > top && scrollTop < bottom) {
      this.on();
    }
    else if (this._on && (scrollTop < top || scrollTop > bottom)) {
      this.off();
    }
  },

  on: function() {
    this.$element.addClass(this.options.activeClass);
    if (this.options.topPadding) {
      this.$element.css('top', this.options.topPadding);
    }
    this.$spacer.show();
    this._on = true;
  },

  off: function() {
    this.$element.removeClass(this.options.activeClass);
    if (this.options.topPadding) {
      this.$element.css('top', 'inherit');
    }
    this.$spacer.hide();
    this._on = false;
  },

  remove: function() {
    this.$container.off(this._scrollEvent);
  }
};
// Register plugin
$.fn.ltStick = function(options) {
  return this.each(function() {
    if (!$.data(this, 'ltStick')) {
      $.data(this, 'ltStick', new LTStick(this, options));
    }
  });
};



/**
 * (copied) Backbone Ractive adaptor plugin
 *
 * original: https://github.com/RactiveJS/Ractive-adaptors-Backbone
 *
 * Added 'sync' event.
*/
(function ( global, factory ) {

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

    collection.on( 'add remove reset sort', this.changeHandler = function () {
      // TODO smart merge. It should be possible, if awkward, to trigger smart
      // updates instead of a blunderbuss .set() approach
      wrapper.setting = true;
      ractive.set( keypath, collection.models );
      wrapper.setting = false;
    });

  };

  BackboneCollectionWrapper.prototype = {
    teardown: function () {
      this.value.off( 'add remove reset sort', this.changeHandler );
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

})();
