/**
 * Main application container for the Legislature Tracker
 */
var LTApplication = Backbone.Router.extend({
  routes: {
    'bill/:bill': 'bill',
    '*defaultR': 'defaultR'
  },

  initialize: function(options) {
    this.options = options;
    
    // Bind to help with some event callbacks
    _.bindAll(this);
    
    // Data cache is used to store loaded models
    // as this data does not change that often
    this.dataCache = {};
    
    // Main view for application
    this.mainView = new LSApplicationView(options);
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
    this.dataCache.eBills = data;
    
    // Start handling routing and history
    Backbone.history.start();
  },
  
  // Function to parse out any data from the spreadsheet
  // for the bills
  parseEBills: function(row) {
    row.categories = row.categories.split(',');
    row.categories = _.map(row.categories, _.trim);
    return row; 
  },

  // Default route
  defaultR: function() {
    
  },
  
  // Bill route
  bill: function(bill) {
    this.loadModel('OSBillModel', 'bill_id', bill, function(bill, data, xhr) {
      
    });
  },
  
  // General load model method to use cache.
  loadModel: function(type, idAttr, id, callback) {
    var attrs = {};
    this.dataCache[type] = this.dataCache[type] || {};
    
    if (_.isUndefined(this.dataCache[type][id])) {
      attrs[idAttr] = id;
      this.dataCache[type][id] = new window[type](
        attrs, this.options);
      this.dataCache[type][id].fetch({
        success: callback,
        error: this.error
      });
    }
    else {
      callback.apply(this, [ this.dataCache[type][id], false, false ]);
    }
  },
  
  error: function(e) {
    // Handle error
  }
});