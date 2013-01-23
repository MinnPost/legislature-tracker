/**
 * Collections for Legislature Tracker
 */
 
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
  model: LT.OSBillModel
});