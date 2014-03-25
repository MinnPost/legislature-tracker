/**
 * Views for the Legislator Tracker app
 */

/**
 * Base view.
 */
LT.BaseView = Ractive.extend({
  baseInit: function(options) {
    this.options = options.options;
    this.app = options.app;
    this.router = options.router;
  },
  adaptors: ['Backbone']
});

/**
 * Main View for application.
 */
LT.ApplicationView = LT.BaseView.extend({
  init: function() {
    this.baseInit.apply(this, arguments);
  }
});

/**
 * Categories view.
 */
LT.CategoriesView = LT.BaseView.extend({
  init: function() {
    this.baseInit.apply(this, arguments);
  }
});

/**
 * Category view.
 */
LT.CategoryView = LT.BaseView.extend({
  init: function() {
    this.baseInit.apply(this, arguments);
  }
});

/**
 * EBill view.
 */
LT.EBillView = LT.BaseView.extend({
  init: function() {
    this.baseInit.apply(this, arguments);
  }
});

/**
 * OSBill view.
 */
LT.OSBillView = LT.BaseView.extend({
  init: function() {
    this.baseInit.apply(this, arguments);
  }
});

/**
 * OSSponsor view
 */
LT.OSSponsorView = LT.BaseView.extend({
  init: function() {
    this.baseInit.apply(this, arguments);
  }
});
