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
  
    if (_.isUndefined(LT.cache.models[hash])) {
      LT.cache.models[hash] = new LT[model](attr, options);
    }
    
    return LT.cache.models[hash];
  };
  
  // Fetch model, unless has already been fetched.
  // options should be the same options passed to
  // fetch().
  LT.utils.fetchModel = function(model, options) {
    if (model.get('fetched') !== true) {
      model.fetch(options);
    }
    else {
      options.success.apply(model, [ model, false, false ]);
    }
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
  LT.parse.eData = function(tabletop, options) {
    var parsed = {};
    parsed.categories = LT.parse.eCategories(tabletop.sheets('Categories').all(), options);
    parsed.bills = LT.parse.eBills(tabletop.sheets('Bills').all(), options);
    parsed.events = LT.parse.eEvents(tabletop.sheets('Events').all(), options);
    return parsed;
  };
  
  LT.parse.eBills = function(bills, options) {
    return _.map(bills, function(row) {
      // Handle translation
      _.each(options.translations.eBills, function(input, output) {
        row[output] = row[input];
      });
      
      // Break up categories into an array
      row.ecategories = row.ecategories.split(',');
      row.ecategories = _.map(row.ecategories, _.trim);
      
      row.links = LT.parse.eLinks(row.links);
      return row;
    });
  };
  
  LT.parse.eCategories = function(categories, options) {
    return _.map(categories, function(row) {
      // Handle translation
      _.each(options.translations.eCategories, function(input, output) {
        row[output] = row[input];
      });
      row.links = LT.parse.eLinks(row.links);
      row.open_states_subjects = LT.parse.osCategories(row.open_states_subjects);
      return row;
    });
  };
  
  LT.parse.eEvents = function(events, options) {
    return _.map(events, function(row) {
      // Handle translation
      _.each(options.translations.eEvents, function(input, output) {
        row[output] = row[input];
      });
      row.links = LT.parse.eLinks(row.links);
      row.date = moment(row.date);
      return row;
    });
  };
  
  // "Title to link|http://minnpost.com", "Another link|http://minnpost.com"
  LT.parse.eLinks = function(link, options) {
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
  LT.parse.osCategories = function(category, options) {
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
    translations: {
      eCategories: {
        'category_id': 'categoryid',
        'open_states_subjects': 'openstatessubjects'
      },
      eBills: {
        'bill_id': 'bill',
        'ecategories': 'categories',
        'etitle': 'title',
        'edescription': 'description'
      },
      eEvents: {
        'bill_id': 'bill'
      }
    }
  };
  
})(jQuery, window);
this["LT"] = this["LT"] || {};
this["LT"]["templates"] = this["LT"]["templates"] || {};

this["LT"]["templates"]["js/app/templates/template-bill.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='\n<div class="bill-container">\n  <h4>'+
( bill_id )+
'</h4>\n  <h5>'+
( etitle )+
'</h5>\n  <p>'+
( edescription )+
'</p>\n</div>';
}
return __p;
};

this["LT"]["templates"]["js/app/templates/template-categories.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='\n<div class="categories-container">\n  <h1>'+
( options.title )+
'</h1>\n\n  <ul>\n    ';
 for (var c in categories) { 
;__p+='\n      <li><a href="#/category/'+
( encodeURI(categories[c].name) )+
'">'+
( categories[c].name )+
'</li>\n    ';
 } 
;__p+='\n  </ul>\n</div>';
}
return __p;
};

this["LT"]["templates"]["js/app/templates/template-category.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='\n<div class="category-container">\n  <h4>'+
( name )+
'</h4>\n  <ul>\n    ';
 for (var b in bills) { 
;__p+='\n      <li><a href="#/bill/'+
( encodeURI(bills[b]) )+
'">'+
( bills[b] )+
'</li>\n    ';
 } 
;__p+='\n  </ul>\n</div>';
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
    },
    
    bills: function() {
      var thisModel = this;
      var bills = [];

      _.each(this.get('bills'), function(b) {
        bills.push(LT.utils.getModel('OSBillModel', 'bill_id', b, thisModel.options));
      });
      return bills;
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
    model: LT.OSBillModel
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
      if (!_.isObject(category)) {
        category = this.router.categories.get(category);
      }
      this.$el.html(this.templates.category(category.toJSON()));
    },
    
    renderBill: function(bill) {
      if (!_.isObject(bill)) {
        bill = this.router.bills.get(bill);
      }
      this.$el.html(this.templates.bill(bill.toJSON()));
    }
  });
  
})(jQuery, window);
/**
 * Main application container for the Legislature Tracker
 *
 * An 'e' prefix is referring to editorialized content.
 */
LT.Application = Backbone.Router.extend({
  routes: {
    'categories': 'categories',
    'category/:category': 'category',
    'bill/:bill': 'bill',
    '*defaultR': 'defaultR'
  },

  initialize: function(options) {
    options = _.extend(LT.defaultOptions, options);
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
    data = parsed.bills;
    
    // Set up collections
    this.categories = new LT.CategoriesCollection(null, this.options);
    this.bills = new LT.BillsCollection(null, this.options);
    
    // Get categories
    _.each(data, function(d) {
      _.each(d.ecategories, function(c) {
        var bills;
        
        // Make category
        var cat = LT.utils.getModel('CategoryModel', 'id', { id: c }, thisRouter.options);
        cat.set('name', c);
        
        // Add reference to bills
        bills = cat.get('bills');
        if (_.isUndefined(bills)) {
          cat.set('bills', [ d.bill_id ]);
        }
        else {
          bills.push(d.bill_id);
          cat.set('bills', bills);
        }
        
        thisRouter.categories.push(cat);
      });
    });
    
    // Load in bills
    _.each(data, function(d) {
      thisRouter.bills.push(LT.utils.getModel('OSBillModel', 'bill_id', d, thisRouter.options));
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
    category = decodeURI(category);
    this.mainView.renderCategory(category);
  },
  
  // Bill route
  bill: function(bill) {
    var thisRouter = this;
    bill = decodeURI(bill);
    
    var model = LT.utils.getModel('OSBillModel', 'bill_id', { bill_id: bill }, this.options);
    LT.utils.fetchModel(model, {
      success: function(bill, data, xhr) {
        thisRouter.mainView.renderBill(bill);
      },
      error: this.error
    });
  },
  
  error: function(e) {
    // Handle error
  }
});