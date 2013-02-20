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
      defer.resolve(model);
      return defer;
    }
  };
  
  // Translate words, usually for presentation
  LT.utils.translate = function(section, input) {
    var output = input;
    
    if (_.isObject(LT.options.wordingTranslations[section]) && 
      _.isString(LT.options.wordingTranslations[section][input])) {
      output = LT.options.wordingTranslations[section][input];
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
      // Handle translation
      _.each(LT.options.fieldTranslations.eBills, function(input, output) {
        row[output] = row[input];
        delete row[input];
      });
      
      // Break up categories into an array
      row.ecategories = row.ecategories.split(',');
      row.ecategories = _.map(row.ecategories, _.trim);
      
      row.links = LT.parse.eLinks(row.links);
      return row;
    });
  };
  
  LT.parse.eCategories = function(categories) {
    return _.map(categories, function(row) {
      // Handle translation
      _.each(LT.options.fieldTranslations.eCategories, function(input, output) {
        row[output] = row[input];
        delete row[input];
      });
      
      row.links = LT.parse.eLinks(row.links);
      row.open_states_subjects = LT.parse.csvCategories(row.open_states_subjects);
      row.legislator_subjects = LT.parse.csvCategories(row.legislator_subjects);
      return row;
    });
  };
  
  LT.parse.eEvents = function(events) {
    return _.map(events, function(row) {
      // Handle translation
      _.each(LT.options.fieldTranslations.eEvents, function(input, output) {
        row[output] = row[input];
        delete row[input];
      });
      
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
  LT.parse.csvCategories = function(category, options) {
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
  
  // Default options
  LT.defaultOptions = {
    title: 'Legislature Tracker',
    eBillsWanted: ['Categories', 'Bills', 'Events'],
    fieldTranslations: {
      eCategories: {
        'id': 'categoryid',
        'open_states_subjects': 'openstatessubjects',
        'legislator_subjects': 'legislatorsubjects'
      },
      eBills: {
        'bill_id': 'bill',
        'ecategories': 'categories',
        'etitle': 'title',
        'edescription': 'description'
      },
      eEvents: {
        'bill_id': 'bill',
        'actor': 'chamber',
        'action': 'title'
      }
    },
    wordingTranslations: {
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

this["LT"]["templates"]["js/app/templates/template-bill-progress.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='\n<div class="bill-progress clear-block">\n  <div class="bill-progress-section bill-introduced ';
 if (action_dates.introduced) { 
;__p+='completed';
 } 
;__p+='"\n    title="Bill introduced';
 if (action_dates.introduced) { 
;__p+=' on '+
( action_dates.introduced.format('MMM DD') )+
'';
 } 
;__p+='">\n  </div>\n  \n  <div class="bill-progress-section bill-passed-lower ';
 if (action_dates.passed_lower) { 
;__p+='completed';
 } 
;__p+='"\n    title="Bill passed House';
 if (action_dates.passed_lower) { 
;__p+=' on '+
( action_dates.passed_lower.format('MMM DD') )+
'';
 } 
;__p+='">\n  </div>\n  \n  <div class="bill-progress-section bill-passed-upper ';
 if (action_dates.passed_upper) { 
;__p+='completed';
 } 
;__p+='"\n    title="Bill passed Senate';
 if (action_dates.passed_upper) { 
;__p+=' on '+
( action_dates.passed_upper.format('MMM DD') )+
'';
 } 
;__p+='">\n  </div>\n  \n  <div class="bill-progress-section bill-signed ';
 if (action_dates.signed) { 
;__p+='completed';
 } 
;__p+='"\n    title="Bill signed';
 if (action_dates.signed) { 
;__p+=' on '+
( action_dates.signed.format('MMM DD') )+
'';
 } 
;__p+='">\n  </div>\n</div>';
}
return __p;
};

this["LT"]["templates"]["js/app/templates/template-bill.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='';
 if (!expandable && _.isArray(bill.ecategories) && bill.ecategories.length > 0) { 
;__p+='\n  ';
 for (var c in bill.ecategories) { 
;__p+='\n    <a href="#/category/'+
( encodeURI(bill.ecategories[c]) )+
'">'+
( bill.ecategories[c] )+
'</a>\n  ';
 } 
;__p+='\n';
 } 
;__p+='\n\n<div class="bill ';
 if (expandable) { 
;__p+='is-expandable';
 } 
;__p+='">\n  <div class="bill-top">\n    ';
 if (expandable) { 
;__p+='<h3>';
 } else { 
;__p+='<h2>';
 } 
;__p+='\n      ';
 if (bill.etitle) { 
;__p+='\n        '+
( bill.etitle )+
'\n      ';
 } else { 
;__p+='\n        '+
( bill.title )+
'\n      ';
 } 
;__p+='\n        \n      ('+
( bill.bill_id )+
') \n      <a class="permalink" title="Permanent link to bill" href="#/bill/'+
( encodeURI(bill.bill_id) )+
'"></a>\n    ';
 if (expandable) { 
;__p+='</h3>';
 } else { 
;__p+='</h2>';
 } 
;__p+='\n    \n    '+
( progress )+
'\n    \n    <div class="bill-updated">\n      Last updated '+
( bill.newest_action.date.diff(moment(), 'days') * -1 )+
' day(s) ago\n    </div>\n    \n    <p class="description">'+
( bill.edescription )+
'</p>\n    \n    ';
 if (expandable) { 
;__p+='\n      <a href="#" class="bill-expand">Expand</a>\n    ';
 } 
;__p+='\n  </div>\n  \n  <div class="bill-bottom">\n    <strong>Sponsors</strong>\n    <div class="sponsors clear-block">\n      ';
 for (var a in bill.sponsors) { 
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
;__p+='\n    </div>\n    \n    <strong>Actions</strong>\n    <div class="actions">\n      ';
 for (var a in bill.actions) { 
;__p+='\n        <div>\n          '+
( bill.actions[a].date.format('MMM DD, YYYY') )+
': '+
( bill.actions[a].action )+
'\n          ('+
( LT.utils.translate('chamber', bill.actions[a].actor) )+
')\n        </div>\n      ';
 } 
;__p+='\n    </div>\n    \n    <strong>Sources</strong>\n    <div class="sources">\n      ';
 for (var a in bill.sources) { 
;__p+='\n        <a href="'+
( bill.sources[a].url )+
'">'+
( bill.sources[a].url )+
'</a> <br />\n      ';
 } 
;__p+='\n    </div>\n  </div>\n</div>';
}
return __p;
};

this["LT"]["templates"]["js/app/templates/template-categories.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='\n<div class="categories-container">\n  ';
 if (options.title) { 
;__p+='\n    <h2>'+
( options.title )+
'</h2>\n  ';
 } 
;__p+='\n\n  <ul class="clear-block">\n    ';
 for (var c in categories) { 
;__p+='\n      <li>\n        <div class="category-inner">\n          <h3>\n            <a href="#/category/'+
( encodeURI(categories[c].id) )+
'">\n              '+
( categories[c].title )+
'\n            </a>\n          </h3>\n          \n          <p>'+
( categories[c].description )+
'</p>\n           \n          <div>\n            Watching \n            <strong>'+
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
__p+='\n<a href="#/">All Categories</a>\n\n<div class="category-container">\n  <h2>'+
( title )+
'</h2>\n  \n  <p>'+
( description )+
'</p>\n  \n  ';
 if (_.isArray(links) && links.length > 0) { 
;__p+='\n    <ul class="e-links">\n      ';
 for (var l in links) { 
;__p+='\n        <li><a href="'+
( links[l].url )+
'">'+
( links[l].title )+
'</a></li>\n      ';
 } 
;__p+='\n    </ul>\n  ';
 } 
;__p+='\n  \n  <div class="clear-block bills-list">\n    ';
 for (var b in bills) { 
;__p+='\n      '+
( bills[b] )+
'\n    ';
 } 
;__p+='\n  </div>\n  \n  <div class="clear-block total-bill">\n    Watching \n    <strong>'+
( bills.length )+
'</strong>\n    ';
 if (typeof total_bill_count != 'undefined') { 
;__p+='\n      of '+
( total_bill_count )+
'\n    ';
 } 
;__p+='\n    bills in the '+
( title )+
' category.\n  </div>\n</div>';
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
' ('+
( sponsorType )+
')<br />\n    District '+
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
      return '/?apikey=' + encodeURI(this.options.apiKey) + '&callback=?';
    },
    
    url: function() {
      return this.urlBase() + encodeURI(this.osType) + '/' + 
        encodeURI(this.id) + this.urlEnd();
    },
    
    initialize: function(attr, options) {
      this.options = options;
      
      this.on('sync', function(model, resp, options) {
        // Mark as fetched so we can use some caching
        model.set('fetched', true);
      });
    },
    
    parseOSData: function() {
      // Get some aggregate data from the Open State data
      
      // Parse some dates
      this.set('created_at', moment(this.get('created_at')));
      this.set('updated_at', moment(this.get('updated_at')));
      
      // Figure out newest
      this.set('newest_action', this.get('actions')[0]);
    }
  });
  
  /**
   * Model for Open States Bill
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
      
      // Figure out newest
      this.set('newest_action', this.get('actions')[0]);
      
      // Mark as introduced.  Not sure if this can be assumed
      // to be true
      swapper = this.get('action_dates');
      _.each(this.get('actions'), function(a) {
        if (a.type.indexOf('bill:introduced') !== -1) {
          swapper.introduced = a.date;
        }
      });
      this.set('action_dates', swapper);
      
      // Add custom events to actions
      swapper = this.get('custom_events');
      if (_.isArray(swapper) && swapper.length > 0) {
        this.set('actions', _.union(this.get('actions'), swapper));
      }
      
      // Sort action
      this.set('actions', _.sortBy(this.get('actions'), function(a) {
        return a.date.unix();
      }));
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
   * Model Legislature Tracker category
   */
  LT.CategoryModel = Backbone.Model.extend({
    initialize: function(attr, options) {
      this.options = options;
      this.set('bills', new LT.BillsCollection(null, this.options));
      this.getBills();
    },
    
    getBills: function() {
      // Gets reference to bills that are in the category
      var thisModel = this;
      var allBills = this.options.app.bills;
      var cat = this.get('id');

      allBills.each(function(b) {
        if (_.indexOf(b.get('ecategories'), cat) !== -1) {
          thisModel.get('bills').push(LT.utils.getModel('OSBillModel', 'bill_id', b.attributes, thisModel.options));
        }
      });
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
    model: LT.CategoryModel
  });
  
  /**
   * Collection of bills.
   */
  LT.BillsCollection = Backbone.Collection.extend({
    model: LT.OSBillModel,
    
    comparator: 'updated_at'
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
      LT.utils.getTemplate('template-bill', this.templates, 'bill');
      LT.utils.getTemplate('template-category', this.templates, 'category');
      LT.utils.getTemplate('template-categories', this.templates, 'categories');
      LT.utils.getTemplate('template-bill-progress', this.templates, 'billProgress');
      
      // Bind all
      _.bindAll(this);
    },
    
    events: {
      'click .bill-expand': 'expandBill'
    },
  
    loading: function() {
      this.$el.html(this.templates.loading({}));
    },
    
    renderCategories: function() {
      this.$el.html(this.templates.categories({
        categories: this.router.categories.toJSON(),
        bills: this.router.bills.toJSON(),
        options: this.options
      }));
    },
    
    renderCategory: function(category) {
      var thisView = this;
      var data;
      
      if (!_.isObject(category)) {
        category = this.router.categories.get(category);
      }
      
      // Render each bill
      data = category.toJSON();
      data.bills = data.bills.map(function(b) {
        var json = b.toJSON();
        return thisView.templates.bill({
          bill: json,
          expandable: true,
          progress: thisView.templates.billProgress(json)
        });
      });
      
      this.$el.html(this.templates.category(data));
      this.getLegislators();
    },
    
    renderBill: function(bill) {
      if (!_.isObject(bill)) {
        bill = this.router.bills.get(bill);
      }
      var json = bill.toJSON();
      
      this.$el.html(this.templates.bill({
        bill: json,
        expandable: false,
        progress: this.templates.billProgress(json)
      }));
      this.getLegislators();
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
      'categories': 'categories',
      'category/:category': 'category',
      'bill/:bill': 'bill',
      '*defaultR': 'defaultR'
    },
  
    initialize: function(options) {
      options = LT.options = _.extend(LT.defaultOptions, options);
      this.options = options;
      this.options.app = this;
      
      // Bind to help with some event callbacks
      _.bindAll(this);
      
      // Main view for application
      this.mainView = new LT.MainApplicationView(options);
      this.mainView.router = this;
      this.mainView.loading();
      
      // Get data from spreadsheets
      this.tabletop = Tabletop.init({
        key: this.options.dataKey,
        callback: this.loadEBills,
        callbackContext: this,
        wanted: this.options.eBillsWanted
      });
    },
    
    // Function to call when bill data is loaded
    loadEBills: function(data, tabletop) {
      var thisRouter = this;
      
      // Parse out data from sheets
      var parsed = LT.parse.eData(tabletop, this.options);
      
      // Set up collections
      this.categories = new LT.CategoriesCollection(null, this.options);
      this.bills = new LT.BillsCollection(null, this.options);
      
      // Add bill models
      _.each(parsed.bills, function(d) {
        thisRouter.bills.push(LT.utils.getModel('OSBillModel', 'bill_id', d, thisRouter.options));
      });
      
      // Add category models
      _.each(parsed.categories, function(c) {
        thisRouter.categories.push(LT.utils.getModel('CategoryModel', 'id', c, thisRouter.options));
      });
      
      // Load up bill count
      if (this.options.billCountDataSource) {
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
    defaultR: function() {
      this.navigate('/categories', { trigger: true, replace: true });
      this.mainView.render();
    },
  
    // Categories view
    categories: function() {
      this.mainView.renderCategories();
    },
  
    // Single Category view
    category: function(category) {
      var thisRouter = this;
      
      category = decodeURI(category);
      category = this.categories.get(category);
      this.mainView.loading();
      
      // Load up bill data from open states
      var bills = category.get('bills');
      var defers = [];
      bills.each(function(b) {
        defers.push(LT.utils.fetchModel(b));
      });
      
      $.when.apply(null, defers).then(function() {
        thisRouter.mainView.renderCategory(category);
      }, this.error);
      
    },
    
    // Bill route
    bill: function(bill) {
      var thisRouter = this;
      
      bill = decodeURI(bill);
      bill = this.bills.where({ bill_id: bill })[0];
      this.mainView.loading();
      
      $.when(LT.utils.fetchModel(bill)).then(function() {
        thisRouter.mainView.renderBill(bill);
      }, this.error);
    },
    
    error: function(e) {
      // Handle error

    }
  });
  
})(jQuery, window);