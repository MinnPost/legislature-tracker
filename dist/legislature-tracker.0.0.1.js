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
})(jQuery, window);
/**
 * Core file for Legislature tracker.
 *
 * Namespaces LT and allows for no conflict function.
 */
var LT;
var originalLT;
var exports = exports || undefined;

if (!_.isUndefined(exports)) {
  LT = exports;
}
else {
  originalLT = window.LT;
  LT = {};

  LT.noConflict = function() {
    window.LT = originalLT;
    return this;
  };

  window.LT = LT;
}

(function($, w, undefined) {
  // Cache for models, as Backbone will create new model objects
  // with the same id.
  LT.cache = {};
  LT.cache.models = {};
  
  /**
   * Utility functions for LT
   */
  LT.utils = {};
  
  // Make new model, and utilize cache
  LT.utils.getModel = function(model, idAttr, attr, options) {
    var hash = model + ':' + idAttr + ':' + attr[idAttr];
    options = options || LT.options;
  
    if (_.isUndefined(LT.cache.models[hash])) {
      LT.cache.models[hash] = new LT[model](attr, options);
    }
    
    return LT.cache.models[hash];
  };
  
  // Fetch model, unless has already been fetched.
  LT.utils.fetchModel = function(model) {
    var defer;
  
    if (model.get('fetched') !== true) {
      return model.fetch();
    }
    else {
      defer = $.Deferred();
      defer.resolveWith(model);
      return defer;
    }
  };
  
  // Translate words, usually for presentation
  LT.utils.translate = function(section, input) {
    var output = input;
    
    if (_.isObject(LT.options.wordTranslations[section]) && 
      _.isString(LT.options.wordTranslations[section][input])) {
      output = LT.options.wordTranslations[section][input];
    }
    
    return output;
  };
  
  /**
   * Template handling.  For development, we want to use
   * the template files directly, but for build, they should be
   * compiled into JS.
   *
   * Assigment is used to not worry about asyncronomonity
   */
  LT.templates = LT.templates || {};
  LT.utils.getTemplate = function(name, assignment, property, callback) {
    var templatePath = 'js/app/templates/' + name + '.html';
    
    if (!_.isUndefined(LT.templates[templatePath])) {
      assignment[property] = LT.templates[templatePath];
    }
    else {
      $.ajax({
        url: templatePath,
        method: 'GET',
        async: false,
        contentType: 'text',
        success: function(data) {
          LT.templates[templatePath] = _.template(data);
          assignment[property] = LT.templates[templatePath];

          if (_.isFunction(callback)) {
            callback.apply(this, [ data ]);
          }
        }
      });
    }
  };
  
  /**
   * Parsing out data from spreadsheet.
   *
   * Collection of functions for parsing
   */
  LT.parse = LT.parse || {};
  LT.parse.eData = function(tabletop) {
    var parsed = {};
    
    parsed.categories = LT.parse.eCategories(tabletop.sheets('Categories').all());
    parsed.bills = LT.parse.eBills(tabletop.sheets('Bills').all());
    parsed.events = LT.parse.eEvents(tabletop.sheets('Events').all());
    
    // Add events into bills
    _.each(_.groupBy(parsed.events, 'bill_id'), function(e, b) {
      _.each(parsed.bills, function(bill, i) {
        if (bill.bill_id === b) {
          parsed.bills[i].custom_events = e;
        }
      });
    });
    
    return parsed;
  };
  
  LT.parse.eBills = function(bills) {
    return _.map(bills, function(row) {
      LT.parse.translateFields(LT.options.fieldTranslations.eBills, row);
      row.links = LT.parse.eLinks(row.links);
      
      // Break up categories into an array
      row.categories = (row.categories) ? row.categories.split(',') : [];
      row.categories = _.map(row.categories, _.trim);
      
      // Create open states bill objects
      row.bill_primary = (row.bill) ?
        LT.utils.getModel('OSBillModel', 'bill_id', { bill_id: row.bill }) : undefined;
      row.bill_companion = (row.bill_companion) ?
        LT.utils.getModel('OSBillModel', 'bill_id', { bill_id: row.bill_companion }) : undefined;
      row.bill_conference = (row.conference_bill) ?
        LT.utils.getModel('OSBillModel', 'bill_id', { bill_id: row.bill_conference }) : undefined;
      return row;
    });
  };
  
  LT.parse.eCategories = function(categories) {
    return _.map(categories, function(row) {
      LT.parse.translateFields(LT.options.fieldTranslations.eCategories, row);
      row.links = LT.parse.eLinks(row.links);
      row.open_states_subjects = LT.parse.csvCategories(row.open_states_subjects);
      row.legislator_subjects = LT.parse.csvCategories(row.legislator_subjects);
      return row;
    });
  };
  
  LT.parse.eEvents = function(events) {
    return _.map(events, function(row) {
      LT.parse.translateFields(LT.options.fieldTranslations.eEvents, row);
      row.links = LT.parse.eLinks(row.links);
      row.date = moment(row.date);
      
      // Add some things to fit format of Open States actions
      row.type = [ 'custom' ];
      
      return row;
    });
  };
  
  // "Title to link|http://minnpost.com", "Another link|http://minnpost.com"
  LT.parse.eLinks = function(link) {
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
  LT.parse.csvCategories = function(category) {
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
  
  // Handle changing field names
  LT.parse.translateFields = function(translation, row) {
    _.each(translation, function(input, output) {
      row[output] = row[input];
      
      if (output !== input) {
        delete row[input];
      }
    });
  };
  
  // Default options
  LT.defaultOptions = {
    sheetsWanted: ['Categories', 'Bills', 'Events'],
    fieldTranslations: {
      eCategories: {
        'id': 'categoryid',
        'open_states_subjects': 'openstatessubjects',
        'legislator_subjects': 'legislatorsubjects'
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
    }
  };
  
})(jQuery, window);
this["LT"] = this["LT"] || {};
this["LT"]["templates"] = this["LT"]["templates"] || {};

this["LT"]["templates"]["js/app/templates/template-categories.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='\n<div class="categories-container">\n  ';
 if (options.title) { 
;__p+='\n    <h2>'+
( options.title )+
'</h2>\n  ';
 } 
;__p+='\n\n  <ul class="category-list clear-block">\n    ';
 for (var c in categories) { 
;__p+='\n      <li class="category-item category-item-'+
( c )+
'">\n        <div class="category-inner category-'+
( _.cssClass(categories[c].id) )+
'">\n          <h3>\n            <a href="#/category/'+
( encodeURI(categories[c].id) )+
'">\n              '+
( categories[c].title )+
'\n            </a>\n          </h3>\n           \n          <div>\n            Watching \n            <strong>'+
( categories[c].bills.length )+
'</strong>\n            ';
 if (categories[c].total_bill_count) { 
;__p+='\n              of '+
( categories[c].total_bill_count )+
'\n            ';
 } 
;__p+='\n            bills.\n          </div>\n        </div>\n      </li>\n    ';
 } 
;__p+='\n  </ul>\n</div>';
}
return __p;
};

this["LT"]["templates"]["js/app/templates/template-category.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='\n<div class="ls-header">\n  <a href="#/">All Categories</a>\n</div>\n\n<div class="category-container">\n  <h2>'+
( category.title )+
'</h2>\n  \n  <p>'+
( category.description )+
'</p>\n  \n  ';
 if (_.isArray(category.links) && category.links.length > 0) { 
;__p+='\n    <ul class="e-links">\n      ';
 for (var l in category.links) { 
;__p+='\n        <li><a href="'+
( category.links[l].url )+
'">'+
( category.links[l].title )+
'</a></li>\n      ';
 } 
;__p+='\n    </ul>\n  ';
 } 
;__p+='\n  \n  <div class="clear-block bills-list">\n    ';
 category.bills.each(function(b) { 
;__p+='\n      '+
( templates.ebill({
        bill: b.toJSON(),
        expandable: true,
        templates: templates
      }) )+
'\n    ';
 }); 
;__p+='\n  </div>\n  \n  <div class="clear-block total-bill">\n    Watching \n    <strong>'+
( category.bills.length )+
'</strong>\n    ';
 if (typeof category.total_bill_count != 'undefined') { 
;__p+='\n      of '+
( category.total_bill_count )+
'\n    ';
 } 
;__p+='\n    bills in the '+
( category.title )+
' category.\n  </div>\n</div>';
}
return __p;
};

this["LT"]["templates"]["js/app/templates/template-ebill.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='';
 if (!expandable) { 
;__p+='\n  <div class="ls-header">\n    ';
 _.each(bill.categories, function(c, i) { 
;__p+='\n      <a href="#/category/'+
( c.get('id') )+
'">'+
( c.get('title') )+
'</a>';
 if (i < bill.categories.length - 1) { 
;__p+=',';
 } 
;__p+='\n    ';
 }) 
;__p+='\n  </div>\n';
 } 
;__p+='\n\n<div class="bill ebill ';
 if (expandable) { 
;__p+='is-expandable';
 } 
;__p+='">\n  <div class="bill-top">\n    ';
 if (expandable) { 
;__p+='<h3>';
 } else { 
;__p+='<h2>';
 } 
;__p+='\n      '+
( bill.title )+
'\n      <a class="permalink" title="Permanent link to bill" href="#/bill/'+
( encodeURI(bill.bill) )+
'"></a>\n    ';
 if (expandable) { 
;__p+='</h3>';
 } else { 
;__p+='</h2>';
 } 
;__p+='\n    \n    <p class="description">'+
( bill.description )+
'</p>\n    \n    ';
 if (_.isArray(bill.links) && bill.links.length > 0) { 
;__p+='\n      <ul class="e-links">\n        ';
 for (var l in bill.links) { 
;__p+='\n          <li><a href="'+
( bill.links[l].url )+
'">'+
( bill.links[l].title )+
'</a></li>\n        ';
 } 
;__p+='\n      </ul>\n    ';
 } 
;__p+='\n    \n    ';
 if (expandable) { 
;__p+='\n      <a href="#" class="bill-expand">Expand</a>\n    ';
 } 
;__p+='\n  </div>\n  \n  <div class="bill-bottom">\n    <div class="clear-block">\n      ';
 if (_.isObject(bill.bill_primary)) { 
;__p+='\n        <div class="primary-bill">\n          '+
( templates.osbill({
            title: 'Primary Bill',
            bill: bill.bill_primary.toJSON(),
            templates: templates
          }) )+
'\n        </div>\n      ';
 } 
;__p+='\n      \n      ';
 if (_.isObject(bill.bill_companion)) { 
;__p+='\n        <div class="companion-bill">\n          '+
( templates.osbill({
            title: 'Companion Bill',
            bill: bill.bill_companion.toJSON(),
            templates: templates
          }) )+
'\n        </div>\n      ';
 } 
;__p+='\n    </div>\n  </div>\n</div>';
}
return __p;
};

this["LT"]["templates"]["js/app/templates/template-error.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<div class="error-container">\n  <div class="error"><span>There was an error.</span></div>\n</div>';
}
return __p;
};

this["LT"]["templates"]["js/app/templates/template-legislator.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='\n<div class="legislator">\n  <img src="'+
( photo_url )+
'" />\n\n  <div class="legislator-info">\n    '+
( full_name )+
'<br />\n    District '+
( district )+
' ('+
( LT.utils.translate('partyAbbr', party) )+
') <br />\n    '+
( LT.utils.translate('chamber', chamber) )+
'\n  </div>\n</div>';
}
return __p;
};

this["LT"]["templates"]["js/app/templates/template-loading.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<div class="loading-general-container">\n  <div class="loading-general"><span>Loading...</span></div>\n</div>';
}
return __p;
};

this["LT"]["templates"]["js/app/templates/template-osbill.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='';
 if (typeof detailed != 'undefined' && detailed)  { 
;__p+='\n  <div class="ls-header">\n    <a href="#/">All Categories</a>\n  </div>\n';
 } 
;__p+='\n\n<div class="osbill">\n  <h5>\n    ';
 if (typeof title != 'undefined') { 
;__p+='\n      '+
( title )+
' ('+
( bill.bill_id )+
')\n    ';
 } else { 
;__p+='\n      '+
( bill.bill_id )+
'\n    ';
 } 
;__p+='\n    <a class="permalink" title="Permanent link to bill" href="#/bill-detail/'+
( encodeURI(bill.bill_id) )+
'"></a>\n  </h5>\n  \n  ';
 if (typeof detailed != 'undefined' && detailed) { 
;__p+='\n    <p class="description">\n      '+
( bill.title )+
'\n    </p>\n  ';
 } 
;__p+='\n\n  <strong>Primary sponsors</strong>\n  <div class="sponsors primary-sponsors clear-block">\n    ';
 for (var a in bill.sponsors) { 
;__p+='\n      ';
 if (bill.sponsors[a].type === 'primary') { 
;__p+='\n        <div class="sponsor" data-leg-id="'+
( bill.sponsors[a].leg_id )+
'" data-sponsor-type="'+
( bill.sponsors[a].type )+
'">\n          '+
( bill.sponsors[a].name )+
' ('+
( bill.sponsors[a].type )+
')\n        </div>\n      ';
 } 
;__p+='\n    ';
 } 
;__p+='\n  </div>\n  \n  <strong>Actions</strong>\n  <div class="actions">\n    ';
 for (var a in bill.actions) { 
;__p+='\n      <div>\n        '+
( bill.actions[a].date.format('MMM DD, YYYY') )+
': '+
( bill.actions[a].action )+
'\n        ('+
( LT.utils.translate('chamber', bill.actions[a].actor) )+
')\n      </div>\n    ';
 } 
;__p+='\n  </div>\n\n  <strong>Co-Sponsors</strong>\n  <div class="sponsors co-sponsors clear-block">\n    ';
 for (var a in bill.sponsors) { 
;__p+='\n      ';
 if (bill.sponsors[a].type !== 'primary') { 
;__p+='\n        <div class="sponsor" data-leg-id="'+
( bill.sponsors[a].leg_id )+
'" data-sponsor-type="'+
( bill.sponsors[a].type )+
'">\n          '+
( bill.sponsors[a].name )+
' ('+
( bill.sponsors[a].type )+
')\n        </div>\n      ';
 } 
;__p+='\n    ';
 } 
;__p+='\n  </div>\n  \n  <strong>Full Text</strong>\n  <div class="sources">\n    ';
 for (var a in bill.sources) { 
;__p+='\n      <a href="'+
( bill.sources[a].url )+
'" target="_blank">Source</a> <br />\n    ';
 } 
;__p+='\n  </div>\n</div>';
}
return __p;
};
/**
 * Models for the Legislature Tracker app.
 */
 
(function($, w, undefined) {
  
  /**
   * Base Model for Open States items
   */
  LT.OSModel = Backbone.Model.extend({
    urlBase: function() {
      return 'http://openstates.org/api/v1/';
    },
    
    urlEnd: function() {
      return '/?apikey=' + encodeURI(LT.options.OSKey) + '&callback=?';
    },
    
    url: function() {
      return this.urlBase() + encodeURI(this.osType) + '/' + 
        encodeURI(this.id) + this.urlEnd();
    },
    
    initialize: function(attr, options) {
      this.options = options;
      
      this.on('sync', function(model, resp) {
        // Mark as fetched so we can use some caching
        model.set('fetched', true);
      });
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
   * Model for Open States Bill
   */
  LT.OSBillModel = LT.OSModel.extend({
    url: function() {
      if (!_.isUndefined(this.id)) {
        return this.urlBase() + 'bills/'  + this.id + this.urlEnd();
      }
      else {
        return this.urlBase() + 'bills/'  + encodeURI(this.options.state) + '/' +
          encodeURI(this.options.session) + '/' +
          encodeURI(this.get('bill_id')) + this.urlEnd();
      }
    },
    
    initialize: function(attr, options) {
      LT.OSBillModel.__super__.initialize.apply(this, arguments);
      
      this.on('sync', function(model, resp, options) {
        this.parseOSData();
      });
    },
    
    parseOSData: function() {
      // Get some aggregate data from the Open State data
      var swapper;
      
      // Parse some dates
      this.set('created_at', moment(this.get('created_at')));
      this.set('updated_at', moment(this.get('updated_at')));
      
      // Action dates
      swapper = this.get('action_dates');
      _.each(swapper, function(a, i) {
        swapper[i] = (a) ? moment(a) : a;
      });
      this.set('action_dates', swapper);
      
      // Actions
      swapper = this.get('actions');
      _.each(swapper, function(a, i) {
        swapper[i].date = (a.date) ? moment(a.date) : a.date;
      });
      this.set('actions', swapper);
      
      // Add custom events to actions
      swapper = this.get('custom_events');
      if (_.isArray(swapper) && swapper.length > 0) {
        this.set('actions', _.union(this.get('actions'), swapper));
      }
      
      // Sort action
      this.set('actions', _.sortBy(this.get('actions'), function(a, i) {
        return (a.date.unix() + i) * -1;
      }));
      
      // Figure out newest
      this.set('newest_action', this.get('actions')[0]);
    }
  });
  
  /**
   * Model for Open States Legislator
   */
  LT.OSLegislatorModel = LT.OSModel.extend({
    osType: 'legislators'
  });
  
  /**
   * Model for Open States Committee
   */
  LT.OSCommitteeModel = LT.OSModel.extend({
    osType: 'committees'
  });
  
  /**
   * Model Legislature Tracker for bill
   */
  LT.BillModel = Backbone.Model.extend({
  
    initialize: function(attr, options) {
      this.options = options;
    },
    
    loadOSBills: function(callback, error) {
      var thisModel = this;
      var defers = [];
      
      _.each(['bill_primary', 'bill_companion', 'bill_conference'], function(prop) {
        if (thisModel.get(prop)) {
          defers.push(LT.utils.fetchModel(thisModel.get(prop)));
        }
      });
      $.when.apply($, defers).done(callback).fail(error);
      return this;
    },
    
    loadCategories: function() {
      if (this.get('categories')) {
        this.set('categories', _.map(this.get('categories'), function(c) {
          if (!_.isObject(c)) {
            c = LT.utils.getModel('CategoryModel', 'id', { id: c });
          }
          return c;
        }));
      }
    }
  });
  
  /**
   * Model Legislature Tracker category
   */
  LT.CategoryModel = Backbone.Model.extend({
  
    initialize: function(attr, options) {
      this.options = options;
      this.set('bills', new LT.BillsCollection(null));
      this.getBills();
    },
    
    getBills: function() {
      // Gets reference to bills that are in the category
      var thisModel = this;
      var allBills = LT.app.bills;
      var cat = this.get('id');

      allBills.each(function(b) {
        if (_.indexOf(b.get('categories'), cat) !== -1) {
          thisModel.get('bills').push(LT.utils.getModel('BillModel', 'bill', b.attributes));
        }
      });
      return this;
    },
    
    loadBills: function(callback, error) {
      // Load up bill data from open states
      var defers = [];
      this.get('bills').each(function(bill) {     
        _.each(['bill_primary', 'bill_companion', 'bill_conference'], function(prop) {
          if (bill.get(prop)) {
            defers.push(LT.utils.fetchModel(bill.get(prop)));
          }
        });
      });
      $.when.apply($, defers).done(callback).fail(error);
      return this;
    }
  });

})(jQuery, window);
/**
 * Collections for Legislature Tracker
 */
 
(function($, w, undefined) {
 
  /**
   * Collection of categories.
   */
  LT.CategoriesCollection = Backbone.Collection.extend({
    model: LT.CategoryModel,
    
    comparator: function(cat) {
      return cat.get('title');
    }
  });
 
  /**
   * Collection of editorial (meta) bills.
   */
  LT.BillsCollection = Backbone.Collection.extend({
    model: LT.BillModel,
    
    comparator: function(cat) {
      return cat.get('title');
    }
  });
  
  /**
   * Collection of Open States bills.
   */
  LT.OSBillsCollection = Backbone.Collection.extend({
    model: LT.OSBillModel,
    
    comparator: function(bill) {
      var last_action = bill.get('newest_action');
      
      if (last_action) {
        last_action = last_action.date.unix() * -1;
      }
      return last_action;
    }
  });

})(jQuery, window);
/**
 * Views for the Legislator Tracker app
 */
 
(function($, w, undefined) {

  /**
   * Main View for application.
   */
  LT.MainApplicationView = Backbone.View.extend({
    initialize: function(options) {
      // Add class to ensure our styling does
      // not mess with other stuff
      this.$el.addClass('ls');
      
      // Get templates
      this.templates = this.templates || {};
      LT.utils.getTemplate('template-loading', this.templates, 'loading');
      LT.utils.getTemplate('template-error', this.templates, 'error');
      LT.utils.getTemplate('template-ebill', this.templates, 'ebill');
      LT.utils.getTemplate('template-osbill', this.templates, 'osbill');
      LT.utils.getTemplate('template-category', this.templates, 'category');
      LT.utils.getTemplate('template-categories', this.templates, 'categories');
      
      // Bind all
      _.bindAll(this);
    },
    
    events: {
      'click .bill-expand': 'expandBill'
    },
  
    loading: function() {
      this.$el.html(this.templates.loading({}));
    },
    
    error: function(e) {
      this.$el.html(this.templates.error({ error: e }));
    },
    
    renderCategories: function() {
      this.$el.html(this.templates.categories({
        categories: LT.app.categories.toJSON(),
        options: LT.options
      }));
    },
    
    renderCategory: function(category) {
      var thisView = this;
      var data;
      
      if (!_.isObject(category)) {
        category = LT.app.categories.get(category);
      }
      
      this.$el.html(this.templates.category({
        category: category.toJSON(),
        templates: this.templates
      }));
      this.getLegislators();
    },
    
    renderEBill: function(bill) {
      if (!_.isObject(bill)) {
        bill = this.router.bills.get(bill);
      }
      
      this.$el.html(this.templates.ebill({
        bill: bill.toJSON(),
        expandable: false,
        templates: this.templates
      }));
      this.getLegislators();
      this.addTooltips();
    },
    
    renderOSBill: function(bill) {
      this.$el.html(this.templates.osbill({
        bill: bill.toJSON(),
        detailed: true,
        templates: this.templates
      }));
      this.getLegislators();
      this.addTooltips();
    },
    
    expandBill: function(e) {
      e.preventDefault();
      var $this = $(e.target);
      
      $this.parent().parent().toggleClass('expanded').find('.bill-bottom').slideToggle();
    },
    
    getLegislators: function() {
      this.$el.find('.sponsor:not(.found)').each(function() {
        var $this = $(this);
        var data = $this.data();
        data.id = data.legId;
        
        if (data.id) {
          var leg = LT.utils.getModel('OSLegislatorModel', 'id', data);
          $.when(LT.utils.fetchModel(leg)).then(function() {
            var view = new LT.LegislatorView({
              el: $this,
              model: leg
            }).render();
          });
        }
      });
    },
    
    addTooltips: function() {
      this.$el.find('.bill-progress .bill-progress-section.completed').qtip({
        style: {
          classes: 'qtip-shadow qtip-light'
        },
        position: {
          my: 'bottom center',
          at: 'top center'
        }
      });
    }
  });

  /**
   * Legislator view.
   */
  LT.LegislatorView = Backbone.View.extend({
    model: LT.OSLegislatorModel,
    
    initialize: function(options) {
      // Get templates
      this.templates = this.templates || {};
      LT.utils.getTemplate('template-legislator', this.templates, 'legislator');
      
      // Bind all
      _.bindAll(this);
    },
    
    render: function() {
      this.$el.addClass('found')
        .html(this.templates.legislator(this.model.toJSON()));
      return this;
    }
  });
  
})(jQuery, window);
/**
 * Main application container for the Legislature Tracker
 *
 * An 'e' prefix is referring to editorialized content.
 */
(function($, w, undefined) {

  LT.Application = Backbone.Router.extend({
    routes: {
      'categories': 'routeCategories',
      'category/:category': 'routeCategory',
      'bill/:bill': 'routeEBill',
      'bill-detail/:bill': 'routeOSBill',
      '*defaultR': 'routeDefault'
    },
  
    initialize: function(options) {
      LT.options = _.extend(LT.defaultOptions, options);
      LT.app = this;
      
      // Bind to help with some event callbacks
      _.bindAll(this);
      
      // Main view for application
      this.mainView = new LT.MainApplicationView(LT.options);
      this.mainView.router = this;
      this.mainView.loading();
      
      // Get data from spreadsheets
      this.tabletop = Tabletop.init({
        key: LT.options.eKey,
        callback: this.loadEBills,
        callbackContext: this,
        wanted: LT.options.sheetsWanted
      });
    },
    
    // Function to call when bill data is loaded
    loadEBills: function(data, tabletop) {
      var thisRouter = this;
      
      // Parse out data from sheets
      var parsed = LT.parse.eData(tabletop);

      // Set up collections
      this.categories = new LT.CategoriesCollection(null);
      this.bills = new LT.BillsCollection(null);

      // Add bills and categories models
      _.each(parsed.bills, function(b) {
        thisRouter.bills.add(LT.utils.getModel('BillModel', 'bill', b));
      });
      _.each(parsed.categories, function(c) {
        thisRouter.categories.add(LT.utils.getModel('CategoryModel', 'id', c));
      });
      this.bills.each(function(b) {
        b.loadCategories();
      });
      
      // Load up bill count
      if (LT.options.billCountDataSource) {
        $.jsonp({
          url: this.options.billCountDataSource,
          success: this.loadBillCounts
        });
      }
      else {
        // Start application/routing
        this.start();
      }
    },
    
    // Function to call when bill data is loaded
    loadBillCounts: function(billCountData) {
      this.categories.each(function(c) {
        var cats = c.get('legislator_subjects');
        var billCount = 0;
        
        if (_.isArray(cats) && cats.length > 0) {
          _.each(cats, function(cat) {
            var catData = _.find(billCountData, function(b) { return b.topic === cat; });
            billCount += catData.bill_count;
          });
          
          c.set('total_bill_count', billCount);
        }
      });
      
      // Start application/routing
      this.start();
    },
    
    // Start application (after data has been loaded)
    start: function() {
      // Start handling routing and history
      Backbone.history.start();
    },
  
    // Default route
    routeDefault: function() {
      this.navigate('/categories', { trigger: true, replace: true });
      this.mainView.render();
    },
  
    // Categories view
    routeCategories: function() {
      // If we are viewing the categories, we want to get
      // some basic data about the bills from Open States
      // but not ALL the data.  We can use the bill search
      // to do this.
      this.mainView.loading();
      this.getOSBasicBills(this.mainView.renderCategories, this.error);
    },
  
    // Single Category view
    routeCategory: function(category) {
      var thisRouter = this;
      
      category = decodeURI(category);
      category = this.categories.get(category);
      
      // Load up bill data from open states
      this.mainView.loading();
      category.loadBills(function() {
        thisRouter.mainView.renderCategory(category);
      }, thisRouter.error);
    },
    
    // eBill route
    routeEBill: function(bill) {
      var thisRouter = this;
      
      bill = decodeURI(bill);
      bill = this.bills.where({ bill: bill })[0];
      
      this.mainView.loading();
      bill.loadOSBills(function() {
        thisRouter.mainView.renderEBill(bill);
      }, thisRouter.error);
    },
    
    // osBill route
    routeOSBill: function(bill) {
      var thisRouter = this;
      
      bill = decodeURI(bill);
      bill = LT.utils.getModel('OSBillModel', 'bill_id', { bill_id: bill });

      this.mainView.loading();
      $.when.apply($, [ LT.utils.fetchModel(bill) ]).done(function() {
        thisRouter.mainView.renderOSBill(bill);
      })
      .fail(thisRouter.error);
    },
    
    getOSBasicBills: function(callback, error) {
      var thisRouter = this;
      var billIDs = [];
      
      // Check if we have one this already
      if (!this.fetchedCategories) {
      
        // First collect all the bill id's we need
        this.bills.each(function(bill) {
          _.each(['bill_primary', 'bill_companion', 'bill_conference'], function(prop) {
            if (bill.get(prop)) {
              billIDs.push(bill.get(prop).get('bill_id'));
            }
          });
        });
        
        var url = 'http://openstates.org/api/v1/bills/?state=' + LT.options.state +
          '&search_window=session:' + LT.options.session +
          '&bill_id__in=' + encodeURI(billIDs.join('|')) +
          '&apikey=' + LT.options.OSKey + '&callback=?';
        
        $.jsonp({
          url: url,
          success: function(data) {
            thisRouter.fetchedCategories = true;
          
            _.each(data, function(d) {
              d.created_at = moment(d.created_at);
              d.updated_at = moment(d.updated_at);
              LT.utils.getModel('OSBillModel', 'bill_id', d).set(d);
            });
            callback.call(thisRouter);
          },
          error: this.error
        });
      }
      else {
        callback.call(thisRouter);
      }
    },
    
    error: function(e) {
      this.mainView.error(e);
    }
  });
  
})(jQuery, window);