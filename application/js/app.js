/**
 * Main application container for the Legislature Tracker
 */
var LTApplication = Backbone.Router.extend({
  routes: {
    'bill/:bill': 'bill',
    '*default': 'default'
  },

  initialize: function(options) {
    this.options = options;
    // Data cache is used to store loaded models
    // as this data does not change that often
    this.dataCache = {};
    
    Backbone.history.start();
  },

  default: function() {
    
  },
  
  // Bill page
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
      callback.apply(this, [ this.dataCache[type][id], false ]);
    }
  },
  
  error: function(e) {
    // Handle error
  }
});