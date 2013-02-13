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