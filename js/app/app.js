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