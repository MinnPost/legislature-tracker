/**
 * Top wrapper for module.
 *
 * Tries to support different modular libraries.
 */

 (function(global, factory) {
  // Common JS (i.e. browserify) environment
  if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
    factory(require('underscore'), require('jquery'), require('backbone'), require('moment'), require('tabletop'), require('ractive'));
  }
  // AMD
  else if (typeof define === 'function' && define.amd) {
    define('LT', ['underscore', 'jquery', 'backbone', 'moment', 'tabletop', 'Ractive'], factory);
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



this.LTTemplates = {
  'template-application' : '<div class="ls">\n\n  {{#(!!categories)}}\n    <div class="ls-header-container {{#menuOff}}menu-off{{/menuOff}}">\n      <div class="ls-header">\n\n        <a class="all-categories-link" href="#/">\n          <img src="{{ imagePath(\'back-100-85.png\') }}" />\n          All Categories\n        </a>\n\n        <span class="categories-nav">\n          &nbsp;&nbsp;|&nbsp;&nbsp;\n\n          {{#categories}}\n            <a class="" href="#/category/{{ id }}" title="{{ title }}">\n              {{ (short_title) ? short_title : title.split(\' \')[0] }}\n            </a>\n            &nbsp;&nbsp;\n          {{/categories}}\n        </span>\n      </div>\n    </div>\n  {{/()}}\n\n  {{#options.title}}\n    <h2>{{ options.title }}</h2>\n  {{/options.title}}\n\n  <div class="ls-content-container">\n    {{>loading}}\n  </div>\n</div>\n',
  'template-categories' : '\n{{^categories}}\n  {{>loading}}\n{{/categories}}\n\n<div class="categories-container">\n  <ul class="category-list clear-block">\n    {{#categories:i}}\n      <li class="category-item category-item-{{ i }}">\n        <div class="category-inner category-{{ _.cssClass(id) }}">\n          {{#image}}\n            <a href="#/category/{{ encodeURI(id) }}">\n              <img class="category-image" src="{{ imagePath(image) }}" />\n            </a>\n          {{/image}}\n\n          <h3>\n            <a href="#/category/{{ encodeURI(id) }}">\n              {{ title }}\n            </a>\n          </h3>\n\n          <div>\n            Watching <strong>{{ bills.length }}</strong> bills.\n          </div>\n        </div>\n      </li>\n    {{/categories}}\n  </ul>\n</div>',
  'template-category' : '\n{{^category}}\n  {{>loading}}\n{{/category}}\n\n<div class="category-container">\n  <h2>\n    {{#category.image}}\n      <img class="category-image" src="{{ imagePath(category.image) }}" />\n    {{/category.image}}\n\n    {{ category.title }}\n  </h2>\n\n  <p class="category-description">{{ category.description }}</p>\n\n  {{#(category.links && category.links.length && category.links.length > 0)}}\n    <div class="elinks">\n      <strong>In the news</strong>\n      <ul class="elinks-list">\n        {{#category.links}}\n          <li><a href="{{ url }}">{{ title }}</a></li>\n        {{/category.links}}\n      </ul>\n    </div>\n  {{/()}}\n\n  <div class="clear-block bills-list">\n    {{#category.bills:bill}}\n      <ebill bill="{{ this }}" compact="true" imagePath="{{ imagePath }}" options="{{ options }}">\n    {{/category.bills}}\n  </div>\n\n  <div class="clear-block total-bill">\n    Watching\n    <strong>{{ category.bills.length }}</strong>\n    {{#(typeof category.total_bill_count != \'undefined\')}}\n      of {{ category.total_bill_count }}\n    {{/()}}\n    bills in the {{ category.title }} category.\n  </div>\n</div>\n',
  'template-ebill' : '\n<div class="bill ebill {{^bill.hasBill}}no-bill{{/bill.hasBill}}">\n  <div class="bill-status">\n    <img\n      class="lower {{#bill.bill_type.recent}}passed{{/bill.bill_type.recent}}"\n      src="{{ imagePath(\'RecentChanges.png\') }}"\n      title="{{#bill.bill_type.recent}}Recently changed{{/bill.bill_type.recent}}\n        {{^bill.bill_type.recent}}Not changed recently{{/bill.bill_type.recent}}"\n     />\n\n    <img\n      class="lower {{#bill.actions.lower}}passed{{/bill.actions.lower}}"\n      src="{{ imagePath(\'PassedHouse.png\') }}"\n      title="{{#bill.actions.lower}}Passed{{/bill.actions.lower}}\n        {{^bill.actions.lower}}Not passed (yet){{/bill.actions.lower}} {{ translate(\'chamber\', \'lower\') }}"\n     />\n\n    <img\n      class="lower {{#bill.actions.upper}}passed{{/bill.actions.upper}}"\n      src="{{ imagePath(\'PassedSenate.png\') }}"\n      title="{{#bill.actions.upper}}Passed{{/bill.actions.upper}}\n        {{^bill.actions.upper}}Not passed (yet){{/bill.actions.upper}} {{ translate(\'chamber\', \'upper\') }}"\n     />\n\n    {{#options.conferenceBill}}\n      <img\n        class="conference {{#bill.bill_type.conference}}passed{{/bill.bill_type.conference}}"\n        src="{{ imagePath(\'InConferenceCommittee.png\') }}"\n        title="{{#bill.bill_type.conference}}Conference bill created{{/bill.bill_type.conference}}\n          {{#bill.bill_type.conference}}Conference bill not created (yet){{/bill.bill_type.conference}}"\n       />\n    {{/options.conferenceBill}}\n\n   <img\n     class="signed {{#bill.actions.signed}}passed{{/bill.actions.signed}}"\n     src="{{ imagePath(\'SignedIntoLaw.png\') }}"\n     title="{{#bill.actions.signed}}Signed into law by the Governor{{/bill.actions.signed}}\n       {{#bill.actions.signed}}Not signed into law (yet){{/bill.actions.signed}}"\n    />\n  </div>\n\n  {{#compact}}\n    <h3>\n      {{ bill.title }}\n      <a class="permalink" title="Permanent link to bill" href="#/bill/{{ encodeURI(bill.bill) }}"></a>\n    </h3>\n  {{/compact}}\n  {{^compact}}\n    <h2>{{ bill.title }}</h2>\n  {{/compact}}\n\n  {{^bill.hasBill}}\n    <div class="latest-action">\n      <em>This bill has not been tracked by the legislature yet.</em>\n    </div>\n  {{/bill.hasBill}}\n\n  {{#bill.newest_action}}\n    <div class="latest-action">Last action about {{ date.fromNow() }}: {{ action }}.</div>\n  {{/bill.newest_action}}\n\n  <div class="description">\n    {{{ bill.description }}}\n  </div>\n\n  <div class="ebill-categories">\n    <strong>Categories:</strong>\n    {{#bill.categories:i}}\n      <a href="#/category/{{ id }}">\n        {{#image}}\n          <img class="category-image" src="{{ imagePath(image) }}" />\n        {{/image}}\n        {{ title }}\n      </a>{{#(i < bill.categories.length - 1)}},{{/()}}\n    {{/bill.categories}}\n  </div>\n\n  {{#(bill.links && bill.links.length && bill.links.length > 0)}}\n    <div class="elinks">\n      <strong>In the news</strong>\n      <ul class="elinks-list">\n        {{#bill.links}}\n          <li><a href="{{ url }}">{{ title }}</a></li>\n        {{/bill.links}}\n      </ul>\n    </div>\n  {{/()}}\n\n\n  {{#(compact == true)}}\n    <div class="osbills ebill-sponsors clear-block\n      {{#bill.bill_conference}}has-conference{{/bill.bill_conference}}\n      {{#bill.bill_primary}}has-primary{{/bill.bill_primary}}\n      {{#bill.bill_companion}}has-companion{{/bill.bill_companion}}\n      ">\n      {{#bill.bill_conference}}\n        <div class="osbill bill-conference">\n          <strong>Conference bill\n            {{#sources.0.url}}\n              <a href="{{ sources.0.url }}" target="_blank">{{ bill_id }}</a>\n            {{/sources.0.url}}\n            {{^sources.0.url}} {{ bill_id }} {{/sources.0.url}}\n          </strong>\n          {{#sponsors}}\n            <sponsor sponsor="{{ this }}" type="primary">\n          {{/sponsors}}\n        </div>\n      {{/bill.bill_conference}}\n\n      {{#bill.bill_primary}}\n        <div class="osbill bill-primary">\n          <strong>\n            {{ (options.chamberLabel) ? translate(\'chamber\', chamber) + \' Bill\' : \'Primary Bill\' }}\n            {{#sources.0.url}}\n              <a href="{{ sources.0.url }}" target="_blank">{{ bill_id }}</a>\n            {{/sources.0.url}}\n            {{^sources.0.url}} {{ bill_id }} {{/sources.0.url}}\n          </strong>\n          {{#sponsors}}\n            <sponsor sponsor="{{ this }}" type="primary">\n          {{/sponsors}}\n        </div>\n      {{/bill.bill_primary}}\n\n      {{#bill.bill_companion}}\n        <div class="osbill bill-companion">\n          <strong>\n            {{ (options.chamberLabel) ? translate(\'chamber\', chamber) + \' Bill\' : \'Companion Bill\' }}\n            {{#sources.0.url}}\n              <a href="{{ sources.0.url }}" target="_blank">{{ bill_id }}</a>\n            {{/sources.0.url}}\n            {{^sources.0.url}} {{ bill_id }} {{/sources.0.url}}\n          </strong>\n          {{#sponsors}}\n            <sponsor sponsor="{{ this }}" type="primary">\n          {{/sponsors}}\n        </div>\n      {{/bill.bill_companion}}\n    </div>\n\n    <div class="details-link">\n      <a title="See more details about bill" href="#/bill/{{ encodeURI(bill.bill) }}">More details\n        <img src="{{ imagePath(\'forward-100-85.png\') }}" /></a>\n    </div>\n  {{/()}}\n\n\n  {{#(compact != true)}}\n    {{#(bill.custom_events && bill.custom_events.length && bill.custom_events.length > 0)}}\n      <div class="custom-events">\n        <strong>Events</strong>\n        <ul class="custom-events-inner">\n          {{#bill.custom_events}}\n            <li><strong>{{ bill_id }} {{ action }}</strong> on  {{ date.format(\'MMM DD, YYYY\') }}: {{ e.description }}</li>\n          {{/bill.custom_events}}\n        </ul>\n      </div>\n    {{/()}}\n\n    <div class="osbills clear-block\n      {{#bill.bill_conference}}has-conference{{/bill.bill_conference}}\n      {{#bill.bill_primary}}has-primary{{/bill.bill_primary}}\n      {{#bill.bill_companion}}has-companion{{/bill.bill_companion}}\n    ">\n\n      {{#bill.bill_conference}}\n        <div class="osbill conference-bill">\n          <h3>Conference Bill</h3>\n          <osbill bill="{{ this }}" type="conference" imagePath="{{ imagePath }}" translate="{{ translate }}" options="{{ options }}">\n        </div>\n      {{/bill.bill_conference}}\n\n      {{#bill.bill_primary}}\n        <div class="osbill primary-bill">\n          <h3>{{ (options.chamberLabel) ? translate(\'chamber\', chamber) + \' Bill\' : \'Primary Bill\' }}</h3>\n          <osbill bill="{{ this }}" type="primary" imagePath="{{ imagePath }}" translate="{{ translate }}" options="{{ options }}">\n        </div>\n      {{/bill.bill_primary}}\n\n      {{#bill.bill_companion}}\n        <div class="osbill companion-bill">\n          <h3>{{ (options.chamberLabel) ? translate(\'chamber\', chamber) + \' Bill\' : \'Companion Bill\' }}</h3>\n          <osbill bill="{{ this }}" type="companion" imagePath="{{ imagePath }}" translate="{{ translate }}" options="{{ options }}">\n        </div>\n      {{/bill.bill_companion}}\n  {{/()}}\n\n</div>\n',
  'template-error' : '<div class="error-container">\n  <div class="error"><span>There was an error.</span></div>\n</div>',
  'template-legislator' : '\n<div class="legislator">\n  <% if (LT.options.legImageProxy) { %>\n    <img src="<%= LT.options.legImageProxy %><%= encodeURI(photo_url) %>" />\n  <% } else { %>\n    <img src="<%= photo_url %>" />\n  <% } %>\n  \n  <div class="legislator-info">\n    <%= full_name %><br />\n    <% if (typeof district != \'undefined\') { %>\n      District <%= district %>\n    <% } %>\n    <% if (typeof party != \'undefined\') { %>\n      (<%= LT.utils.translate(\'partyAbbr\', party) %>) \n    <% } %> <br />\n    <% if (typeof chamber != \'undefined\') { %>\n      <%= LT.utils.translate(\'chamber\', chamber) %>\n    <% } %>\n  </div>\n</div>',
  'template-loading' : '<div class="loading-general-container">\n  <div class="loading-general"><span>Loading...</span></div>\n</div>',
  'template-osbill' : '\n<div class="osbill-container {{ type }}-bill">\n  <h4>\n    {{#(!!bill.title)}}\n      {{ bill.title }} ({{ bill.bill_id }})\n    {{/()}}\n\n    {{^(!!bill.title)}}\n      {{ bill.bill_id }}\n    {{/()}}\n  </h4>\n\n  <div class="primary-sponsors">\n    <strong>Primary sponsors</strong>\n    <div class="clear-block">\n      {{#bill.sponsors}}\n        <sponsor sponsor="{{ this }}" type="primary">\n      {{/bill.sponsors}}\n    </div>\n  </div>\n\n  <div class="actions">\n    <strong>Actions</strong>\n    <div class="actions-inner">\n      {{#bill.actions}}\n        {{#(!!date)}}\n          <div>\n            {{ date.format(\'MMM DD, YYYY\') }}:\n            {{ action }}\n            ({{ translate(\'chamber\', actor) }})\n          </div>\n        {{/())}}\n      {{/bill.actions}}\n    </div>\n  </div>\n\n  <div class="co-sponsors">\n    <strong>Co-Sponsors</strong>\n    <div>\n      {{#bill.sponsors}}\n        <sponsor sponsor="{{ this }}" type="cosponsor" compact="true">\n      {{/bill.sponsors}}\n    </div>\n  </div>\n\n  {{#(bill.votes && bill.votes.length && bill.votes.length > 0)}}\n    <div class="votes">\n      <strong>Votes</strong>\n      <div>\n        {{#bill.votes}}\n          {{ date.format(\'MMM DD, YYYY\') }}\n          {{ motion }} {{ (passed) ? \'passed\' : \'failed\' }}\n          {{ yes_count }} Y -\n          {{ no_count }} N <br />\n        {{/bill.votes}}\n      </div>\n    </div>\n  {{/()}}\n\n  <div class="sources">\n    <strong>Sources</strong>\n    <div>\n      {{#bill.sources}}\n        <a href="{{ url }}" target="_blank">\n          {{#(!!text)}}\n            {{ text }}\n          {{/()}}\n          {{#(!text)}}\n            {{ url }}\n          {{/()}}\n        </a> <br />\n      {{/bill.sources}}\n    </div>\n  </div>\n</div>\n',
  'template-sponsor' : '\n{{#(((!!type && sponsor.type === type) || !type) && !compact)}}\n\n  <div class="sponsor clear-block">\n    {{#sponsor.leg.photo_url}}\n      <div class="sponsor-image">\n        {{#options.legImageProxy}}\n          <img src="{{ options.legImageProxy }}{{ encodeURI(sponsor.leg.photo_url) }}" />\n        {{/options.legImageProxy}}\n        {{^options.legImageProxy}}\n          <img src="{{ sponsor.leg.photo_url }}" />\n        {{/options.legImageProxy}}\n      </div>\n    {{/sponsor.leg.photo_url}}\n\n    <div class="sponsor-info">\n      {{#sponsor.leg.full_name}}\n        {{ sponsor.leg.full_name }} <br />\n        District {{ sponsor.leg.district }}\n        ({{ translate(\'chamber\', sponsor.leg.chamber) }}) <br />\n        {{ translate(\'partyAbbr\', sponsor.leg.party) }}\n      {{/sponsor.leg.full_name}}\n\n      {{^sponsor.leg.full_name}}\n        {{ sponsor.name }}\n      {{/sponsor.leg.full_name}}\n    </div>\n  </div>\n{{/()}}\n\n\n{{#(((!!type && sponsor.type === type) || !type) && !!compact)}}\n  <div class="sponsor">\n    {{#sponsor.leg.full_name}}\n      {{ sponsor.leg.full_name }},\n      {{ translate(\'partyAbbr\', sponsor.leg.party) }}\n    {{/sponsor.leg.full_name}}\n\n    {{^sponsor.leg.full_name}}\n      {{ sponsor.name }}\n    {{/sponsor.leg.full_name}}\n  </div>\n{{/()}}\n',
};

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


/**
 * Basic parsing out from the spreadsheet data.
 */
LT.parsers = LT.parsers || {};

// Wrapper around console.log
LT.log = function(message) {
  if (_.isObject(console) && _.isFunction(console.log)) {
    console.log(message);
  }
};

// Main parser
LT.parsers.eData = function(tabletop, options) {
  var parsed = {};
  var eBills = tabletop.sheets('Bills').all();

  // Handle max bills
  if (eBills.length > options.maxBills) {
    LT.log('The number of bills in your spreadsheet exceeds maxBills. Set the maxBills option to display them, but be aware that this may significantly slow down the Legislature Tracker.');
  }

  // Parse bills, categories, and events
  parsed.categories = LT.parsers.eCategories(tabletop.sheets('Categories').all(), options);
  parsed.bills = LT.parsers.eBills(eBills.slice(0, options.maxBills), options);
  parsed.events = LT.parsers.eEvents(tabletop.sheets('Events').all(), options);

  // Add events into bills
  _.each(_.groupBy(parsed.events, 'bill_id'), function(e, b) {
    _.each(parsed.bills, function(bill, i) {
      if (bill.bill === b) {
        parsed.bills[i].custom_events = e;
      }
    });
  });

  return parsed;
};

// Validate a bill number
LT.parsers.validateBillNumber = function(billN, options) {
  return options.billNumberFormat.test(billN);
};

// Parse eBill data
LT.parsers.eBills = function(bills, options) {
  return _.map(bills, function(row) {
    LT.parsers.translateFields(options.fieldTranslations.eBills, row);
    row.links = LT.parsers.eLinks(row.links);

    // Back id
    row.id = row.id || _.cssClass(row.bill) + _.cssClass(row.title);

    // Break up categories into an array
    row.categories = (row.categories) ? row.categories.split(',') : [];
    row.categories = _.map(row.categories, _.trim);

    // Ensure bill id is in right form, otherwise we will get a
    // bad response from the API call which will cause a
    // bunch of failures.
    row.bill_primary = _.trim(row.bill);
    if (row.bill && !LT.parsers.validateBillNumber(row.bill, options)) {
      LT.log('Invalid primary bill number "' + row.bill + '" for row ' + row.rowNumber + ', see documentation.');
    }

    row.bill_companion = _.trim(row.bill_companion);
    if (row.bill_companion && !LT.parsers.validateBillNumber(row.bill_companion, options)) {
      LT.log('Invalid companion bill number "' + row.bill_companion + '" for row ' + row.rowNumber + ', see documentation.');
    }

    row.bill_conference = _.trim(row.bill_conference);
    if (row.bill_conference && !LT.parsers.validateBillNumber(row.bill_conference, options)) {
      LT.log('Invalid conference bill number "' + row.bill_conference + '" for row ' + row.rowNumber + ', see documentation.');
    }

    // Check if there is a bill provided.  It is alright if there is
    // no bill provided as some legislatures don't produce
    // bill IDs until late in the process
    row.hasBill = true;
    if (!row.bill || !row.bill_primary) {
      row.hasBill = false;

      // We still want to make a bill ID for linking purposes
      row.bill = _.cssClass(row.title.toLowerCase());
    }

    return row;
  });
};

LT.parsers.eCategories = function(categories, options) {
  return _.map(categories, function(row) {
    LT.parsers.translateFields(options.fieldTranslations.eCategories, row);
    row.links = LT.parsers.eLinks(row.links);
    return row;
  });
};

LT.parsers.eEvents = function(events, options) {
  return _.map(events, function(row) {
    LT.parsers.translateFields(options.fieldTranslations.eEvents, row);
    row.links = LT.parsers.eLinks(row.links);
    row.date = moment(row.date);

    // Add some things to fit format of Open States actions
    row.type = ['custom'];
    return row;
  });
};

// "Title to link|http://minnpost.com", "Another link|http://minnpost.com"
LT.parsers.eLinks = function(link) {
  var links = [];
  link = _.trim(link);

  if (link.length === 0) {
    return links;
  }

  // Remove first and last quotes
  link = (link.substring(0, 1) === '"') ? link.substring(1) : link;
  link = (link.substring(link.length - 1, link.length) === '"') ? link.slice(0, -1) : link;

  // Separate out the parts
  links = link.split('", "');
  links = _.map(links, function(l) {
    return {
      title: l.split('|')[0],
      url: l.split('|')[1]
    };
  });

  return links;
};

// "Environmental", "Energy"
LT.parsers.csvCategories = function(category) {
  category = _.trim(category);
  if (category.length === 0) {
    return [];
  }

  // Remove first and last quotes
  category = (category.substring(0, 1) === '"') ? category.substring(1) : category;
  category = (category.substring(category.length - 1, category.length) === '"') ?
    category.slice(0, -1) : category;

  // Separate out the parts
  return category.split('", "');
};

// Looks at text and tries to find a bill, used for
// getting the companion bill automatically
LT.parsers.detectCompanionBill = function(companionText, options) {
  var parsed, bill;

  // Handle function or handle regex
  if (_.isFunction(options.detectCompanionBill)) {
    parsed = options.detectCompanionBill(companionText);
    bill = LT.parsers.validateBillNumber(parsed, options) ?
      parsed : undefined;
  }
  else if (_.isRegExp(options.detectCompanionBill)) {
    parsed = options.detectCompanionBill.exec(companionText);
    bill = (parsed && LT.parsers.validateBillNumber(parsed[1], options)) ?
      parsed[1] : undefined;
  }

  return _.trim(bill);
};

// Handle changing field names
LT.parsers.translateFields = function(translation, row) {
  _.each(translation, function(input, output) {
    row[output] = row[input];

    if (output !== input) {
      delete row[input];
    }
  });

  return row;
};


/**
 * Models for the Legislature Tracker app.
 */


/**
 * Base Model for Open States items
 */
LT.BaseModel = Backbone.Model.extend({
  initialize: function(attr, options) {
    this.options = options;
    this.app = this.options.app;

    this.on('sync', function(model, resp) {
      model.set('fetched', true);
    });
  }
});

/**
 * Base Model for Open States items
 */
LT.OSModel = LT.BaseModel.extend({
  urlBase: function() {
    return 'http://openstates.org/api/v1/';
  },

  urlEnd: function() {
    return '/?apikey=' + encodeURI(this.app.options.OSKey) + '&callback=?';
  },

  url: function() {
    return this.urlBase() + encodeURI(this.osType) + '/' +
      encodeURI(this.id) + this.urlEnd();
  },

  initialize: function(attr, options) {
    LT.OSModel.__super__.initialize.apply(this, arguments);
  }
});

/**
 * Model for Open States State
 */
LT.OSStateModel = LT.OSModel.extend({
  url: function() {
    return this.urlBase() + 'metadata/'  + encodeURI(this.options.state) +
      this.urlEnd();
  }
});

/**
 * Model for Open States Legislator
 */
LT.OSLegislatorModel = LT.OSModel.extend({
  osType: 'legislators',

  initialize: function(attr, options) {
    LT.OSBillModel.__super__.initialize.apply(this, arguments);

    // When we first get a leg_id, the we should fetch the data
    if (this.get('leg_id')) {
      this.app.fetchModel(this);
    }
  }
});

/**
 * Model for Open States Committee
 */
LT.OSCommitteeModel = LT.OSModel.extend({
  osType: 'committees'
});

/**
 * Model for Open States Bill
 */
LT.OSBillModel = LT.OSModel.extend({
  url: function() {
    // Determine API call if there is an ID or if bill_id
    if (!_.isUndefined(this.id)) {
      return this.urlBase() + 'bills/'  + this.id + this.urlEnd();
    }
    else if (!_.isUndefined(this.get('bill_id')) && this.get('bill_id') !== '') {
      return this.urlBase() + 'bills/'  + encodeURI(this.app.options.state) + '/' +
        encodeURI(this.app.options.session) + '/' +
        encodeURI(this.get('bill_id')) + this.urlEnd();
    }
  },

  initialize: function(attr, options) {
    var thisModel = this;
    LT.OSBillModel.__super__.initialize.apply(this, arguments);
  },

  // Get some aggregate data from the Open State data
  parse: function(data, options) {
    var thisModel = this;

    // Parse some dates
    data.created_at = data.created_at ? moment(data.created_at) : undefined;
    data.updated_at = data.updated_at ? moment(data.updated_at) : undefined;

    // Action dates.  Filter then make into a moment()
    data.action_dates = _.filterObject(data.action_dates, function(a, ai) {
      return a;
    });
    data.action_dates = _.mapObject(data.action_dates, function(a, ai) {
      return moment(a);
    });

    // Actions.  Make dates into moment()s
    data.actions = _.mapObject(data.actions, function(a, ai) {
      a.date = moment(a.date);
      return a;
    });

    // Votes.  Make dates into moment()s
    data.votes = _.mapObject(data.votes, function(v, vi) {
      v.date = moment(v.date);
      return v;
    });

    // Add custom events to actions
    if (this.get('custom_events')) {
      data.actions = _.union(data.actions, this.get('custom_events'));
    }

    // Sort action
    data.actions = _.sortBy(data.actions, function(a, ai) {
      return (a.date.unix() + ai) * -1;
    });

    // Figure out newest
    data.newest_action = data.actions[0];

    // Add a hook for any custom bill parsing
    if (this.app.options.osBillParse && _.isFunction(this.app.options.osBillParse)) {
      data = this.options.osBillParse(data, this);
    }

    // Add a legislator model to each sponsor
    if (data.sponsors) {
      data.sponsors = _.map(data.sponsors, function(s, si) {
        s.id = s.leg_id;
        s.leg = thisModel.app.getModel('OSLegislatorModel', 'leg_id', s);
        return s;
      });
    }

    return data;
  },

  getActionDate: function(type) {
    return (this.get('action_dates')[type]) ? this.get('action_dates')[type] : false;
  },

  isSubstituted: function() {
    var sub = false;
    var thisModel = this;

    if (_.isBoolean(this.get('substitued'))) {
      sub = this.get('substitued');
    }
    else if (this.app.options.substituteMatch === false) {
      sub = false;
    }
    else {
      sub = _.find(this.get('actions'), function(a) {
        return a.action.match(thisModel.app.options.substituteMatch);
      });
      sub = (sub) ? true : false;
      this.set('substitued', sub);
    }

    return sub;
  }
});

/**
 * eBill model.  This model holds the editorial data
 * and references to OS bill.
 */
LT.BillModel = LT.BaseModel.extend({

  subbills: ['bill_primary', 'bill_companion', 'bill_conference'],

  initialize: function() {
    LT.BillModel.__super__.initialize.apply(this, arguments);

    // Create models for sub-bills
    this.loadOSBills();
  },

  // Create sub-bills
  loadOSBills: function() {
    var thisModel = this;
    _.each(this.subbills, function(b, bi) {
      var model;

      if (thisModel.get(b)) {
        // Create and attache new model
        model = thisModel.app.getModel('OSBillModel', 'bill_id', {
          bill_id: thisModel.get(b)
        });
        thisModel.set(b, model);
      }
    });
  },

  // Gets bills in an array
  getOSBills: function() {
    var thisModel = this;
    return _.filterEmpty(_.map(this.subbills, function(b, bi) {
      return thisModel.get(b);
    }));
  },

  // Gets OS bills ids in a an array
  getOSBillIDs: function() {
    var bills = this.getOSBills();

    return _.filterEmpty(_.map(bills, function(b, bi) {
      return _.isObject(b) ? b.get('bill_id') : b;
    }));
  },

  // Get data from individual OS bills.
  fetchOSBills: function() {
    var thisModel = this;
    var defers = [];
    this.getCategories();

    _.each(this.subbills, function(p, pi) {
      if (thisModel.get('hasBill') && thisModel.get(p)) {
        defers.push(thisModel.app.fetchModel(thisModel.get(p)));
      }
    });

    // When done, make some meta data
    return $.when.apply($, defers).done(function() {
      thisModel.loadOSCompanion().done(function() {
        thisModel.parseMeta();
        thisModel.lastUpdatedAt();
        thisModel.newestAction();
        thisModel.trigger('fetched:osbills');
      });
    });
  },

  // Override the fetch method to use the osbills one
  fetch: function() {
    return this.fetchOSBills();
  },

  // Check to see if we don't have a companion but Open States
  // says there is one.
  loadOSCompanion: function() {
    var thisModel = this;
    var match;
    var defers = [];

    if (this.get('hasBill') === true && !this.get('bill_companion') &&
      _.isObject(this.get('bill_primary')) && _.isArray(this.get('bill_primary').get('companions')) &&
        _.isObject(this.get('bill_primary').get('companions')[0])) {

      match = LT.parse.detectCompanionBill(this.get('bill_primary').get('companions')[0].bill_id);
      if (match) {
        this.set('bill_companion', thisModel.app.getModel('OSBillModel', 'bill_id', { bill_id : match }));
        defers.push(thisModel.app.fetchModel(this.get('bill_companion')));
      }
    }

    return $.when.apply($, defers);
  },

  // Get the category objects associated with this bill
  getCategories: function() {
    var thisModel = this;

    if (this.get('categories')) {
      this.set('categories', _.map(this.get('categories'), function(c) {
        if (!_.isObject(c)) {
          c = thisModel.app.getModel('CategoryModel', 'id', { id: c });
        }
        return c;
      }));
    }
  },

  // Determine the last updated date from each osbill
  lastUpdatedAt: function() {
    var last_updated_at;
    var p = this.get('bill_primary');
    var c = this.get('bill_companion');
    var co = this.get('bill_conference');

    if (p && p.get('updated_at')) {
      last_updated_at = p.get('updated_at');

      if (c && c.get('updated_at')) {
        last_updated_at = (c.get('updated_at').unix() >
          last_updated_at.unix()) ?
          c.get('updated_at') : last_updated_at;
      }
      if (co && co.get('updated_at')) {
        last_updated_at = (co.get('updated_at').unix() >
          last_updated_at.unix()) ?
          co.get('updated_at') : last_updated_at;
      }
      this.set('last_updated_at', last_updated_at);
    }

    return this.get('last_updated_at');
  },

  // Determine the last action from each osbill
  newestAction: function() {
    var newest_action;
    var p = this.get('bill_primary');
    var c = this.get('bill_companion');
    var co = this.get('bill_conference');

    if (this.get('hasBill') && p.get('newest_action')) {
      newest_action = p.get('newest_action');

      if (c && c.get('newest_action')) {
        newest_action = (c.get('newest_action').date.unix() >
          newest_action.date.unix()) ?
          c.get('newest_action') : newest_action;
      }
      if (co && co.get('newest_action')) {
        newest_action = (co.get('newest_action').date.unix() >
          newest_action.date.unix()) ?
          co.get('newest_action') : newest_action;
      }
      this.set('newest_action', newest_action);
    }

    return this.get('newest_action');
  },

  // Determines if is recent.  Check for actions and action_dates.
  isRecent: function() {
    var newest = this.newestAction();
    var pActions = (this.get('bill_primary')) ? this.get('bill_primary').get('action_dates') : null;

    if (_.isObject(newest) && newest.date && moment().diff(newest.date, 'days') <= this.app.options.recentChangeThreshold) {
      return true;
    }
    else if (_.isObject(pActions) && pActions.last && moment().diff(pActions.last, 'days') <= this.app.options.recentChangeThreshold) {
      return true;
    }
    return false;
  },

  // We need to get actions and meta data from individual
  // bills.  This could get a bit complicated...
  parseMeta: function() {
    var thisModel = this;
    var swap, swap2;
    var actions = {
      upper: false,
      lower: false,
      conference: false,
      signed: false,
      last: false
    };

    // Let's determine types
    var type = {
      companion: (this.get('bill_companion')) ? true : false,
      conference: (this.get('bill_conference')) ? true : false
    };

    // Sort custom events
    if (this.get('custom_events')) {
      this.set('custom_events', _.sortBy(this.get('custom_events'), function(e, i) {
        return (e.date.unix() + i) * -1;
      }));
    }

    // If there are osBill data to go through
    if (this.get('hasBill')) {
      // The companion or primary bill can stop being relevant.  This is noted
      // by a SF Substituted or HF Substituted
      if (type.companion) {
        if (this.get('bill_companion').isSubstituted()) {
          type.substituted = true;
        }
        if (this.get('bill_primary').isSubstituted()) {
          type.substituted = true;

          // Swap primary for companion.  Yeah, sorry.
          swap = this.get('bill_primary').get('bill_id');
          swap2 = this.get('bill_companion').get('bill_id');
          this.unset('bill_primary');
          this.set('bill_primary', (function() {
            return thisModel.app.getModel('OSBillModel', 'bill_id', { bill_id: swap2 });
          })());
          this.unset('bill_companion');
          this.set('bill_companion', (function() {
            return thisModel.app.getModel('OSBillModel', 'bill_id', { bill_id: swap });
          })());
        }
      }

      // If only primary, get the actions from there, or
      // if substituted, then just get from primary bill
      if (!type.companion || type.substituted) {
        actions.lower = this.get('bill_primary').getActionDate('passed_lower');
        actions.upper = this.get('bill_primary').getActionDate('passed_upper');
      }

      // If companion, get the actions from their respective bills
      if (type.companion && !type.substituted) {
        if (this.get('bill_primary').get('chamber') === 'upper') {
          actions.upper = this.get('bill_primary').getActionDate('passed_upper');
          actions.lower = this.get('bill_companion').getActionDate('passed_lower');
        }
        else {
          actions.lower = this.get('bill_primary').getActionDate('passed_lower');
          actions.upper = this.get('bill_companion').getActionDate('passed_upper');
        }
      }

      // If conference bill, get date if both chambers have passed
      if (type.conference) {
          var lower = this.get('bill_conference').getActionDate('passed_lower');
          var upper = this.get('bill_conference').getActionDate('passed_upper');

          if (lower && upper) {
            actions.conference = (lower.unix() >= upper.unix()) ? lower : upper;
          }
      }

      // Determine signed.  If conference, then use that, otherwise
      // use primary
      if (type.conference) {
        actions.signed = this.get('bill_conference').getActionDate('signed');
      }
      else {
        actions.signed = this.get('bill_primary').getActionDate('signed');
      }

      // Determine last updated date
      if (type.conference) {
        actions.last = this.get('bill_conference').getActionDate('last');
      }
      else if (type.companion) {
        actions.last = (this.get('bill_companion').getActionDate('last').unix() >=
          this.get('bill_primary').getActionDate('last').unix()) ?
          this.get('bill_companion').getActionDate('last') :
          this.get('bill_primary').getActionDate('last');
      }
      else  {
        actions.last = this.get('bill_primary').getActionDate('last');
      }

      // Description
      if (!this.get('description')) {
        this.set('description', this.get('bill_primary').get('summary'));
      }
    }

    // Determine if this bill has been updated recently
    type.recent = this.isRecent();

    // Attach new data
    this.set('actions', actions);
    this.set('bill_type', type);

    // Helps bumps the view a bit
    this.trigger('change');
    return this;
  }
});

/**
 * Model Legislature Tracker category
 */
LT.CategoryModel = LT.BaseModel.extend({

  initialize: function(attr, options) {
    var thisModel = this;
    LT.CategoryModel.__super__.initialize.apply(this, arguments);

    // Keep a reference to bills in this category
    this.set('bills', new LT.BillsCollection(null));
  },

  getBills: function(bills) {
    // Gets reference to bills that are in the category
    var thisModel = this;
    var cat = this.get('id');

    bills.each(function(b, bi) {
      if (_.indexOf(b.get('categories'), cat) !== -1) {
        thisModel.get('bills').push(thisModel.app.getModel('BillModel', 'bill', b.attributes));
      }
    });
    return this;
  }
});


/**
 * Collections for LT
 */

/**
 * Collection of categories.
 */
LT.CategoriesCollection = Backbone.Collection.extend({
  model: LT.CategoryModel,

  comparator: function(cat) {
    return (cat.get('title').toLowerCase().indexOf('recent') !== -1) ?
      'zzzzz' : cat.get('title');
  }
});

/**
 * Collection of editorial (meta) bills.
 */
LT.BillsCollection = Backbone.Collection.extend({
  model: LT.BillModel,

  comparator: function(b) {
    var sort = (b.newestAction()) ? moment().diff(b.newestAction().date, 'days') : null;
    return sort;
  }
});

/**
 * Collection of Open States bills.
 */
LT.OSBillsCollection = Backbone.Collection.extend({
  model: LT.OSBillModel,

  comparator: function(bill) {
    var last_action = bill.get('newest_action');
    return (last_action) ? last_action.date.unix() * -1 : 9999;
  }
});

/**
 * Collection of Open States legistlators.
 */
LT.OSLegislatorsCollection = Backbone.Collection.extend({
  model: LT.OSLegislatorModel,

  comparator: function(sponsor) {
    return ((sponsor.get('type') === 'primary') ? 'aaa' : 'bbb') + sponsor.get('name');
  }
});


/**
 * Views for the Legislator Tracker app
 */

/**
 * Base view.
 */
LT.BaseView = Ractive.extend({
  baseInit: function(options) {
    this.options = options.options;
    this.app = options.app;
    this.router = options.router;
  },
  adaptors: ['Backbone']
});

/**
 * Main View for application.
 */
LT.ApplicationView = LT.BaseView.extend({
  init: function() {
    this.baseInit.apply(this, arguments);

    // Stick the menu
    this.stuck = false;
    this.observe('categories', function(n, o) {
      // Check if the option is enabled
      if (!this.stuck && this.get('options').stickMenu !== true) {
        this.stuck = true;
      }
      // And whether menu is loaded
      if (!this.stuck && n && _.isObject(n) && n.length > 0) {
        this.stuck = true;
        $(this.el).find('.ls-header').ltStick({
          container: $(this.el)
        });
      }
    });
  }
});

/**
 * Categories view.
 */
LT.CategoriesView = LT.BaseView.extend({
  init: function() {
    this.baseInit.apply(this, arguments);
  }
});

/**
 * Category view.
 */
LT.CategoryView = LT.BaseView.extend({
  init: function() {
    this.baseInit.apply(this, arguments);
  }
});

/**
 * EBill view.
 */
LT.EBillView = LT.BaseView.extend({
  init: function() {
    this.baseInit.apply(this, arguments);
  }
});

/**
 * OSBill view.
 */
LT.OSBillView = LT.BaseView.extend({
  init: function() {
    this.baseInit.apply(this, arguments);
  }
});

/**
 * OSSponsor view
 */
LT.OSSponsorView = LT.BaseView.extend({
  init: function() {
    this.baseInit.apply(this, arguments);
  }
});


/**
 * Main application container for the Legislature Tracker
 *
 * An 'e' prefix is referring to editorialized content.
 */

LT.MainRouter = Backbone.Router.extend({
  routes: {
    'categories': 'routeCategories',
    'category/recent': 'routeRecentCategory',
    'category/:category': 'routeCategory',
    'bill/:bill': 'routeEBill',
    '*defaultR': 'routeDefault'
  },

  initialize: function(options) {
    var thisRouter = this;
    options.router = this;
    this.options = options;
    this.app = options.app;

    // Some helpful bound functions
    this.imagePath = _.bind(this.app.imagePath, this.app);
    this.translate = _.bind(this.app.translate, this.app);

    // Main view for application
    this.app.views.application = new LT.ApplicationView({
      el: this.app.$el,
      template: this.app.templates.application,
      data: {
        options: this.options,
        categories: this.app.categories,
        imagePath: this.imagePath
      },
      options: this.options,
      partials: {
        loading: this.app.templates.loading
      }
    });

    // Make reference to content to change
    this.$content = this.app.$el.find('.ls-content-container');
  },

  // Start application (after data has been loaded)
  start: function() {
    // Start handling routing and history
    Backbone.history.start();
  },

  // Default route
  routeDefault: function() {
    this.navigate('/categories', { trigger: true, replace: true });
  },

  // Categories view
  routeCategories: function() {
    // If we are viewing the categories, we want to get
    // some basic data about the bills from Open States
    // for the recent categories.  We can use the bill search
    // to do this.
    this.app.fetchBasicBillData();

    // Turn off the top menu
    this.app.views.application.set('menuOff', true);

    // Check if we already have this view
    if (_.isObject(this.app.views.categories)) {
      this.app.views.categories.teardown();
    }

    // Create categories view
    this.app.views.categories = new LT.CategoriesView({
      el: this.$content,
      template: this.app.templates.categories,
      data: {
        options: this.options,
        categories: this.app.categories,
        imagePath: this.imagePath
      },
      options: this.options,
      partials: {
        loading: this.app.templates.loading
      }
    });

    this.scrollFocus();
  },

  // Single Category view
  routeCategory: function(category, fetchData) {
    fetchData = fetchData || true;
    var thisRouter = this;
    var categoryID = decodeURI(category);
    var commonData = {
      options: this.options,
      imagePath: this.imagePath,
      translate: this.translate
    };

    // Get category
    category = this.app.categories.get(categoryID);

    // Turn on the top menu
    this.app.views.application.set('menuOff', false);

    // Check for valid bill
    if (!category) {
      this.navigate('/', { trigger: true, replace: true });
    }

    // Check if we already have this view
    if (_.isObject(this.app.views.category)) {
      this.app.views.category.teardown();
    }

    // Fetch bills in category
    if (fetchData) {
      this.app.fetchOSBillsFromCategory(category);
    }

    // Create categories view
    this.app.views.category = new LT.CategoryView({
      el: this.$content,
      template: this.app.templates.category,
      data: _.extend({}, commonData, {
        category: category,
        categoryID: categoryID
      }),
      options: this.options,
      partials: {
        loading: this.app.templates.loading
      },
      components: {
        ebill: LT.EBillView.extend({
          template: this.app.templates.ebill,
          data: commonData,
          components: {
            osbill: LT.OSBillView.extend({
              template: this.app.templates.osbill,
              data: commonData
            }),
            sponsor: LT.OSSponsorView.extend({
              template: this.app.templates.sponsor,
              data: commonData
            })
          }
        })
      }
    });

    this.scrollFocus();

    // Most of the data has been loaded at this point
    this.app.on('fetched:osbills:category:' + category.id, function() {
      category.get('bills').sort();
    });
  },

  // Recent category is like any other except that
  // we need to load the basic data from each bill
  routeRecentCategory: function() {
    var thisRouter = this;

    // Need basic info about bills, then get full data
    this.app.fetchBasicBillData().done(function() {
      thisRouter.app.fetchOSBillsFromCategory(thisRouter.app.categories.get('recent'));
    });
    this.routeCategory('recent', false);
  },

  // eBill route
  routeEBill: function(bill) {
    var thisRouter = this;
    var billID = decodeURI(bill);
    var commonData = {
      options: this.options,
      imagePath: this.imagePath,
      translate: this.translate
    };
    bill = this.app.bills.where({ bill: billID })[0];

    // Turn on the top menu
    this.app.views.application.set('menuOff', false);

    // Check for valid bill
    if (!bill) {
      this.navigate('/', { trigger: true, replace: true });
    }

    // Check if we already have this view
    if (_.isObject(this.app.views.bill)) {
      this.app.views.bill.teardown();
    }

    // Load up bill parts
    bill.fetchOSBills();

    // Create categories view
    this.app.views.bill = new LT.EBillView({
      el: this.$content,
      template: this.app.templates.ebill,
      data: _.extend({}, commonData, {
        bill: bill,
        billID: billID
      }),
      options: this.options,
      partials: {
        loading: this.app.templates.loading
      },
      components: {
        osbill: LT.OSBillView.extend({
          template: this.app.templates.osbill,
          data: commonData,
          components: {
            sponsor: LT.OSSponsorView.extend({
              template: this.app.templates.sponsor,
              data: commonData
            })
          }
        })
      }
    });

    this.scrollFocus();
  },

  // Move view to top of app
  hasInitalFocus: false,
  scrollFocus: function() {
    // Only do after initial load
    if (this.hasInitalFocus && this.app.options.scollFocus) {
      $('html, body').animate({
        scrollTop: this.app.$el.offset().top + this.app.options.scollFocusOffset
      }, this.app.options.scollFocusTime);
    }
    this.hasInitalFocus = true;
  },

  // Handle error
  error: function(e) {

  }
});


/**
 * Main Leg Tracker application
 */

// Container "class" for objects
App = function(options) {
  // Options and dom element
  this.options = _.extend({}, this.defaultOptions, options);
  this.options.app = this;
  this.options.$el = this.$el = $(this.options.el);

  // Event handling
  this.on('fetched:base-data', this.loadBaseData);
  this.on('loaded:basic-bill-data', this.loadRecentCategory);

  // Set up collections
  this.categories = new LT.CategoriesCollection(null);
  this.bills = new LT.BillsCollection(null);

  // Attach templates
  this.getTemplates();

  // Fetch base data
  this.fetchBaseData();

  // Create main router which will handle views and specific
  // data loading, start routing once we have base data
  this.router = new LT.MainRouter(this.options);
  this.on('loaded:base-data', this.startRouting);
};

// Allow app to create and manage events
_.extend(App.prototype, Backbone.Events);

// Some helpful methods and default options
_.extend(App.prototype, {
  views: {},
  cache: {},
  fetched: {},

  // Start routing
  startRouting: function() {
    this.router.start();
  },

  // Get base data that is not dependent on routing
  fetchBaseData: function() {
    var thisApp = this;

    // Only do once
    if (this.fetched.baseData === true) {
      return;
    }

    // Get data from spreadsheets
    this.tabletop = Tabletop.init(_.extend(this.options.tabletopOptions, {
      key: this.options.eKey,
      callback: function(data, tabletop) {
        thisApp.fetched.baseData = true;
        thisApp.trigger('fetched:base-data', data, tabletop);
      },
      callbackContext: thisApp,
      wanted: this.options.sheetsWanted
    }));
  },

  // Parse and load the base data
  loadBaseData: function(data, tabletop) {
    var thisApp = this;
    var category, parsed;

    // Parse out data from sheets
    parsed = LT.parsers.eData(tabletop, this.options);

    // Add bills and categories models
    _.each(parsed.categories, function(c) {
      this.categories.add(this.getModel('CategoryModel', 'id', c));
    }, this);
    _.each(parsed.bills, function(b) {
      this.bills.add(this.getModel('BillModel', 'bill', b));
    }, this);

    // Make recent category
    category = {
      id: 'recent',
      title: 'Recent Actions',
      description: 'The following bills have been updated in the past ' +
        this.options.recentChangeThreshold + ' days.',
      image: this.options.recentImage
    };
    this.categories.add(this.getModel('CategoryModel', 'id', category));

    // Attach reference of bills to categories
    this.categories.each(function(c, ci) {
      c.getBills(thisApp.bills);
    });

    // Trigger that we are done
    this.trigger('loaded:base-data');
  },

  // Fetch all basic bill data
  fetchBasicBillData: function() {
    var thisApp = this;
    var billIDs = [];
    var url;

    // Only do once
    if (this.fetched.basicBillData === true) {
      return $.when.apply($, []);
    }

    // First collect all the bill id's we need
    this.bills.each(function(b, bi) {
      _.each(b.getOSBillIDs(), function(b, bi) {
        billIDs.push(b);
      });
    });

    // Make URL to search with all the bill ids
    url = 'http://openstates.org/api/v1/bills/?state=' +
      this.options.state +
      '&fields=action_dates,chamber,title,id,created_at,updated_at,bill_id' +
      '&search_window=session:' + this.options.session +
      '&bill_id__in=' + encodeURI(billIDs.join('|')) +
      '&apikey=' + this.options.OSKey + '&callback=?';

    // Make request and load data into models
    return $.getJSON(url)
      .done(function(data) {
        thisApp.fetched.basicBillData = true;
        thisApp.trigger('fetched:basic-bill-data');

        _.each(data, function(d) {
          // This should someone how use another fetch and model parsing,
          // but for now this will do.
          d.action_dates = _.filterObject(d.action_dates, function(a, ai) {
            return a;
          });
          d.action_dates = _.mapObject(d.action_dates, function(a, ai) {
            return moment(a);
          });
          d.created_at = moment(d.created_at);
          d.updated_at = moment(d.updated_at);
          thisApp.getModel('OSBillModel', 'bill_id', d).set(d);
        });
        thisApp.trigger('loaded:basic-bill-data');
      });
  },

  // Load recent category.  Once we have actual bill data
  // then we can determine which bills are "recent"
  loadRecentCategory: function() {
    var thisApp = this;
    var recent = this.getModel('CategoryModel', 'id', { id: 'recent' });

    // Go through each bill and determine if bill is in
    // the right timeframe
    this.bills.each(function(b, bi) {
      var c = b.get('categories');
      if (b.isRecent()) {
        c.push(recent.get('id'));
        b.set('categories', c);
      }
    });

    // Add bills to category
    recent.getBills(this.bills);
  },

  // Get bills, given a bill
  fetchOSBillsFromBill: function(bill) {
    var id = category.get('id');
    var defers = [];

    _.each(category.get('bills'), function(b, bi) {
      defers.push(b.fetch());
    });
  },

  // Get bills, given a category
  fetchOSBillsFromCategory: function(category) {
    var thisApp = this;
    var defers = [];

    // Ensure that the categories has bills
    category.getBills(this.bills);
    category.get('bills').each(function(b, bi) {
      defers.push(thisApp.fetchModel(b));
    });
    return $.when.apply($, defers).done(function() {
      thisApp.trigger('fetched:osbills');
      thisApp.trigger('fetched:osbills:category:' + category.id);
    });
  },

  // Make new model, and utilize cache.  Model and idAttr should
  // be strings, and attr and options are passed through to
  // the new model
  getModel: function(model, idAttr, attr, options) {
    var hash = 'models:' + model + ':' + idAttr + ':' + attr[idAttr];
    options = _.extend(options || {}, { app: this });

    if (_.isUndefined(this.cache[hash])) {
      this.cache[hash] = new LT[model](attr, options);
    }

    return this.cache[hash];
  },

  // Fetch model wrapper.  Data will not change
  // in the scope of someone looking at the page
  // so we mark it as such.
  fetchModel: function(model) {
    var defer;

    if (model.get('fetched') !== true) {
      return model.fetch({
        success: function(model, response, options) {
          model.set('fetched', true, { silent: true });
        }
      });
    }
    else {
      defer = $.Deferred();
      defer.resolveWith(model);
      return defer;
    }
  },

  // Translate words, usually for presentation
  translate: function(section, input) {
    var output = input;

    if (_.isObject(this.options.wordTranslations[section]) &&
      _.isString(this.options.wordTranslations[section][input])) {
      output = this.options.wordTranslations[section][input];
    }

    return output;
  },

  // Make image path.  If the image path is a full
  // path with http, then don't prepend image path
  imagePath: function(image) {
    return (image.indexOf('http') === 0) ? image : this.options.imagePath + image;
  },

  // Wrapper around templates.  Given the build/dev process,
  // the templates are embedded already.
  getTemplate: function(name) {
    return LT.templates[name];
  },

  // Get all templates
  templates: {},
  getTemplates: function() {
    this.templates.application = this.getTemplate('template-application');
    this.templates.loading = this.getTemplate('template-loading');
    this.templates.error = this.getTemplate('template-error');
    this.templates.ebill = this.getTemplate('template-ebill');
    this.templates.osbill = this.getTemplate('template-osbill');
    this.templates.category = this.getTemplate('template-category');
    this.templates.categories = this.getTemplate('template-categories');
    this.templates.sponsor = this.getTemplate('template-sponsor');
  },

  // Default options
  defaultOptions: {
    sheetsWanted: ['Categories', 'Bills', 'Events'],
    fieldTranslations: {
      eCategories: {
        'id': 'categoryid',
        'short_title': 'shorttitle'
      },
      eBills: {
        'bill': 'bill',
        'bill_companion': 'companionbill',
        'bill_conference': 'conferencebill',
        'categories': 'categories',
        'title': 'title',
        'description': 'description'
      },
      eEvents: {
        'bill_id': 'bill',
        'actor': 'chamber',
        'action': 'title'
      }
    },
    wordTranslations: {
      chamber: {
        'upper': 'Senate',
        'lower': 'House'
      },
      partyAbbr: {
        'Democratic-Farmer-Labor': 'DFL',
        'Democratic': 'D',
        'Republican': 'R'
      }
    },
    maxBills: 30,
    substituteMatch: (/substituted/i),
    imagePath: './styles/images/',
    recentChangeThreshold: 7,
    tabletopOptions: {},
    conferenceBill: true,
    recentImage: 'RecentUpdatedBill.png',
    chamberLabel: false,
    detectCompanionBill: (/([A-Z]+ [1-9][0-9]*)$/),
    billNumberFormat: (/[A-Z]+ [1-9][0-9]*/),
    osBillParse: undefined,
    stickMenu: true,
    scollFocus: true,
    scollFocusOffset: -15,
    scollFocusTime: 500
  }
});





  // Templates get attached to this which makes them global
  LT.templates = this.LTTemplates;

  return App;
});
