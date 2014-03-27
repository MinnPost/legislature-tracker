/**
 * Collections for LT
 */

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
    return (b.newestAction()) ? b.newestAction().date.unix() * -1 : 9999;
  }
});

/**
 * Collection of Open States bills.
 */
LT.OSBillsCollection = Backbone.Collection.extend({
  model: LT.OSBillModel,

  comparator: function(bill) {
    var last_action = bill.get('newest_action');
    return (last_action) ? last_action.date.unix() * -1 : 9999;
  }
});

/**
 * Collection of Open States legistlators.
 */
LT.OSLegislatorsCollection = Backbone.Collection.extend({
  model: LT.OSLegislatorModel,

  comparator: function(sponsor) {
    return ((sponsor.get('type') === 'primary') ? 'aaa' : 'bbb') + sponsor.get('name');
  }
});
