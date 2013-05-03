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
   * Wrapper around console.log so older browsers don't
   * complain.
   *
   * Shoud be used sparingly where throwing errors is not
   * appropriate.
   */
  LT.log = function(text) {
    if (!_.isUndefined(window.console)) {
      window.console.log(text);
    }
  };
  
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
  
  // Make image path.  If the image path is a full
  // path with http, then don't prepend image path
  LT.utils.imagePath = function(image) {
    return (image.indexOf('http') === 0) ? image : LT.options.imagePath + image;
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
    var templateGETPath = LT.options.templatePath + name + '.html';
    
    if (!_.isUndefined(LT.templates[templatePath])) {
      assignment[property] = LT.templates[templatePath];
    }
    else {
      $.ajax({
        url: templateGETPath,
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
    var eBills = tabletop.sheets('Bills').all();
    
    // Handle max bills
    if (eBills.length > LT.options.maxBills) {
      LT.log('The number of bills in your spreadsheet exceeds maxBills. Set the maxBills option to display them, but be aware that this may significantly slow down the Legislature Tracker.');
    }
    
    parsed.bills = LT.parse.eBills(eBills.slice(0, LT.options.maxBills));
    parsed.events = LT.parse.eEvents(tabletop.sheets('Events').all());

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
  
  LT.parse.validateBillNumber = function(bill_num){
    return LT.options.billNumberFormat.test(bill_num);
  };

  LT.parse.eBills = function(bills) {
    return _.map(bills, function(row) {
      LT.parse.translateFields(LT.options.fieldTranslations.eBills, row);
      row.links = LT.parse.eLinks(row.links);
      
      // Break up categories into an array
      row.categories = (row.categories) ? row.categories.split(',') : [];
      row.categories = _.map(row.categories, _.trim);

      // Create open states bill objects and check that they are in the correct
      // format, otherwise we will get a bad response from the API
      // call which will cause a bunch of failures.
      row.bill_primary = undefined;
      if (row.bill && LT.parse.validateBillNumber(row.bill)) {
        row.bill_primary = LT.utils.getModel('OSBillModel', 'bill_id', { bill_id: _.trim(row.bill) });
      }
      else if (row.bill && !LT.parse.validateBillNumber(row.bill)) {
        LT.log('Invalid primary bill number "' + row.bill + '" for row ' + row.rowNumber + ', see documentation.');
      }
      
      if (row.bill_companion && LT.parse.validateBillNumber(row.bill_companion)) {
        row.bill_companion = LT.utils.getModel('OSBillModel', 'bill_id', { bill_id: _.trim(row.bill_companion) });
      }
      else if (row.bill_companion && !LT.parse.validateBillNumber(row.bill_companion)) {
        LT.log('Invalid companion bill number "' + row.bill_companion + '" for row ' + row.rowNumber + ', see documentation.');
      }
      
      if (row.bill_conference && LT.parse.validateBillNumber(row.bill_conference)) {
        row.bill_conference = LT.utils.getModel('OSBillModel', 'bill_id', { bill_id: _.trim(row.bill_conference) });
      }
      else if (row.bill_conference && !LT.parse.validateBillNumber(row.bill_conference)) {
        LT.log('Invalid conference bill number "' + row.bill_conference + '" for row ' + row.rowNumber + ', see documentation.');
      }
      
      // Check if there is a bill provided.  It is alright if there is
      // no bill provided as some legislatures don't produce
      // bill IDs until late in the process
      row.hasBill = true;
      if (!row.bill || row.bill_primary === undefined) {
        row.hasBill = false;
        
        // We still want to make a bill ID for linking purposes
        row.bill = _.cssClass(row.title.toLowerCase());
      }
      
      return row;
    });
  };
  
  LT.parse.eCategories = function(categories) {
    return _.map(categories, function(row) {
      LT.parse.translateFields(LT.options.fieldTranslations.eCategories, row);
      row.links = LT.parse.eLinks(row.links);
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
  
  // Looks at text and tries to find a bill, used for
  // getting the companion bill automatically
  LT.parse.detectCompanionBill = function(companionText) {
    var parsed, bill;
    
    // Handle function or handle regex
    if (_.isFunction(LT.options.detectCompanionBill)) {
      parsed = LT.options.detectCompanionBill(companionText);
      bill = LT.parse.validateBillNumber(parsed) ? parsed : undefined;
    }
    else if (_.isRegExp(LT.options.detectCompanionBill)) {
      parsed = LT.options.detectCompanionBill.exec(companionText);
      bill = (parsed && LT.parse.validateBillNumber(parsed[1])) ? parsed[1] : undefined;
    }
    
    return _.trim(bill);
  };

  // Handle changing field names
  LT.parse.translateFields = function(translation, row) {
    _.each(translation, function(input, output) {
      row[output] = row[input];
      
      if (output !== input) {
        delete row[input];
      }
    });
    
    return row;
  };
  
  // Default options
  LT.defaultOptions = {
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
    imagePath: './css/images/',
    templatePath: './js/app/templates/',
    recentChangeThreshold: 7,
    tabletopOptions: {},
    scrollOffset: false,
    conferenceBill: true,
    recentImage: 'RecentUpdatedBill.png',
    chamberLabel: false,
    detectCompanionBill: (/([A-Z]+ [1-9][0-9]*)$/),
    billNumberFormat: (/[A-Z]+ [1-9][0-9]*/),
    osBillParse: false
  };
  
})(jQuery, window);