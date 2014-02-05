/**
 * Collections for Legislature Tracker
 */

(function(global, factory) {
  // Common JS (i.e. browserify) environment
  if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
    factory(require('underscore'), require('jquery'), require('backbone'), require('moment'), require('LT'), require('LTModels'));
  }
  // AMD?
  else if (typeof define === 'function' && define.amd) {
    define('LTCollections', ['underscore', 'jquery', 'backbone', 'moment', 'LT', 'LTModels'], factory);
  }
  // Browser global
  else if (global._ && global.jQuery && global.Backbone && global.moment && global.LT) {
    factory(global._, global.jQuery, global.Backbone, global.moment, global.LT);
  }
  else {
    throw new Error('Could not find dependencies for LT Collections.');
  }
})(typeof window !== 'undefined' ? window : this, function(_, $, Backbone, moment, LT) {

  /**
   * Collection of categories.
   */
  LT.CategoriesCollection = Backbone.Collection.extend({
    model: LT.CategoryModel,

    comparator: function(cat) {
      return (cat.get('title').toLowerCase().indexOf('recent') !== -1) ?
        'zzzzz' : cat.get('title');
    }
  });

  /**
   * Collection of editorial (meta) bills.
   */
  LT.BillsCollection = Backbone.Collection.extend({
    model: LT.BillModel,

    comparator: function(b) {
      var compare = (b.newestAction()) ? b.newestAction().date.unix() * -1 :
        b.get('title');
      return compare;
    }
  });

  /**
   * Collection of Open States bills.
   */
  LT.OSBillsCollection = Backbone.Collection.extend({
    model: LT.OSBillModel,

    comparator: function(bill) {
      var last_action = bill.get('newest_action');

      if (last_action) {
        last_action = last_action.date.unix() * -1;
      }
      return last_action;
    }
  });

});