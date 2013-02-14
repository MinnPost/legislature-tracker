/**
 * Collections for Legislature Tracker
 */
 
(function($, w, undefined) {
 
  /**
   * Collection of categories.
   */
  LT.CategoriesCollection = Backbone.Collection.extend({
    model: LT.CategoryModel
  });
  
  /**
   * Collection of bills.
   */
  LT.BillsCollection = Backbone.Collection.extend({
    model: LT.OSBillModel,
    
    comparator: 'updated_at'
  });

})(jQuery, window);