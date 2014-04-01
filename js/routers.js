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

    // Browser bits
    this.scrollFocus();
    this.pageTitle('Categories');
  },

  // Single Category view
  routeCategory: function(category, fetchData) {
    fetchData = (_.isUndefined(fetchData) || fetchData === null) ? true : fetchData;
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

    // Browser bits
    this.scrollFocus();
    this.pageTitle('Category | ' + category.get('title'));

    // Most of the data has been loaded at this point, and we just want to
    // poke the view to update things
    this.app.on('fetched:osbills:category:' + category.id, function() {
      category.get('bills').sort();
      thisRouter.app.views.category.update();
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

    // Browser bits
    this.scrollFocus();
    this.pageTitle('Bill | ' + bill.get('title'));
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

  // Update title
  pageTitle: function(title) {
    document.title = this.app.options.documentTitle + ' | ' + title;
  },

  // Handle error
  error: function(e) {

  }
});
