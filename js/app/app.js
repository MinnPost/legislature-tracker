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
    
    // Parse out sheets
    data = this.parseEBills(tabletop.sheets('Bills').all());
    
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
  
  // Function to parse out any data from the spreadsheet
  // for the bills
  parseEBills: function(bills) {
    var thisRouter = this;
    
    return _.map(bills, function(row) {
      // Handle translation
      _.each(thisRouter.options.translations.eBills, function(input, output) {
        row[output] = row[input];
      });
      
      // Break up categories into an array
      row.ecategories = row.ecategories.split(',');
      row.ecategories = _.map(row.ecategories, _.trim);
      return row;
    });
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