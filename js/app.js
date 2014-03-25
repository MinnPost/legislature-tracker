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
      return;
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
      '&search_window=session:' + this.options.session +
      '&bill_id__in=' + encodeURI(billIDs.join('|')) +
      '&apikey=' + this.options.OSKey + '&callback=?';

    // Make request and load data into models
    return $.getJSON(url)
      .done(function(data) {
        thisApp.fetched.basicBillData = true;
        thisApp.trigger('fetched:basic-bill-data');

        _.each(data, function(d) {
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
      if (Math.abs(parseInt(b.lastUpdatedAt().diff(moment(), 'days'), 10)) < thisApp.options.recentChangeThreshold) {
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
      defers.push(b.fetchOSBills());
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
          model.set('fetched', true);
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
  }
});
