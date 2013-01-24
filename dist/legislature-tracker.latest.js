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
   * Translations for the Google docs data.
   */
  LT.translations = {};
  LT.translations.eBills = {
    'bill_id': 'bill',
    'ecategories': 'categories',
    'etitle': 'title',
    'edescription': 'description'
  };
  
})(jQuery, window);
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
      return this.urlBase() + '/' + encodeURI(this.osType) + '/' + 
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
      return this.urlBase() + '/metadata/'  + encodeURI(this.options.state) + 
        this.urlEnd();
    }
  });
  
  /**
   * Model for Open States Bill
   */
  LT.OSBillModel = LT.OSModel.extend({
    url: function() {
      if (!_.isUndefined(this.id)) {
        return this.urlBase() + '/bills/'  + this.id + this.urlEnd();
      }
      else {
        return this.urlBase() + '/bills/'  + encodeURI(this.options.state) + '/' +
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
    templates: {
      loading: $('#template-loading').html(),
      categories: $('#template-categories').html(),
      category: $('#template-category').html(),
      bill: $('#template-bill').html()
    },
    
    initialize: function(options) {
      // Add class to ensure our styling does
      // not mess with other stuff
      this.$el.addClass('ls');
    },
  
    loading: function() {
      this.$el.html(_.template(this.templates.loading, {}));
    },
    
    renderCategories: function() {
      this.$el.html(_.template(this.templates.categories, {
        categories: this.router.categories.toJSON(),
        bills: this.router.bills.toJSON()
      }));
    },
    
    renderCategory: function(category) {
      if (!_.isObject(category)) {
        category = this.router.categories.get(category);
      }
      this.$el.html(_.template(this.templates.category, category.toJSON()));
    },
    
    renderBill: function(bill) {
      if (!_.isObject(bill)) {
        bill = this.router.bills.get(bill);
      }
      this.$el.html(_.template(this.templates.bill, bill.toJSON()));
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
    this.options = options;
    
    // Bind to help with some event callbacks
    _.bindAll(this);
    
    // Main view for application
    this.mainView = new LT.MainApplicationView(options);
    this.mainView.router = this;
    this.mainView.loading();
    
    // Get data from spreadsheets
    this.tabletop = Tabletop.init({
      key: this.options.billsSheet,
      simpleSheet: true,
      postProcess: this.parseEBills,
      callback: this.loadEBills,
      callbackContext: this
    });
  },
  
  // Function to call when bill data is loaded
  loadEBills: function(data, tabletop) {
    var thisRouter = this;
    this.categories = new LT.CategoriesCollection();
    this.bills = new LT.BillsCollection();
    
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
  
  // Function to parse out any data from the spreadsheet
  // for the bills
  parseEBills: function(row) {
    // Handle translation
    _.each(LT.translations.eBills, function(input, output) {
      row[output] = row[input];
    });
    
    // Break up categories into an array
    row.ecategories = row.ecategories.split(',');
    row.ecategories = _.map(row.ecategories, _.trim);
    return row; 
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