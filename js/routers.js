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

    // Main view for application
    this.app.views.application = new LT.ApplicationView({
      el: this.app.$el,
      template: this.app.templates.application,
      data: {
        options: this.options,
        categories: this.app.categories
      },
      options: this.options,
      partials: {
        loading: this.app.templates.loading
      }
    });

    // Make reference to content to change
    this.$content = this.app.$el.find('.ls-content-container');

    // Some helpful bound functions
    this.imagePath = _.bind(this.app.imagePath, this.app);
    this.translate = _.bind(this.app.translate, this.app);
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
  },

  // Single Category view
  routeCategory: function(category) {
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

    // Fetch bills in category
    this.app.fetchOSBillsFromCategory(category);

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
  },

  // Recent category is like any other except that
  // we need to load the basic data from each bill
  routeRecentCategory: function() {
    this.app.fetchBasicBillData();
    this.routeCategory('recent');
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

    // Ractive does not see the changes to the Subbills
    bill.on('all', function(e) {
      e = e.split(':');
      if (e[e.length - 1] === 'change') {
        thisRouter.app.views.bill.update();
      }
    });
  },

  // Handle error
  error: function(e) {

  }
});
