/**
 * Views for the Legislator Tracker app
 */
LT.MainApplicationView = Backbone.View.extend({
  templates: {
    loading: $('#template-loading').html(),
    categories: $('#template-categories').html(),
    category: $('#template-category').html(),
    bill: $('#template-bill').html()
  },
  
  initialize: function(options) {
    // Add class to ensure our styling does
    // not mess with other stuff
    this.$el.addClass('ls');
  },

  loading: function() {
    this.$el.html(_.template(this.templates.loading, {}));
  },
  
  renderCategories: function() {
    this.$el.html(_.template(this.templates.categories, {
      categories: this.router.categories.toJSON(),
      bills: this.router.bills.toJSON()
    }));
  },
  
  renderCategory: function(category) {
    if (!_.isObject(category)) {
      category = this.router.categories.get(category);
    }
    this.$el.html(_.template(this.templates.category, category.toJSON()));
  },
  
  renderBill: function(bill) {
    if (!_.isObject(bill)) {
      bill = this.router.bills.get(bill);
    }
    this.$el.html(_.template(this.templates.bill, bill.toJSON()));
  }
});