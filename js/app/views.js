/**
 * Views for the Legislator Tracker app
 */
 
(function($, w, undefined) {

  /**
   * Main View for application.
   */
  LT.MainApplicationView = Backbone.View.extend({
    initialize: function(options) {
      // Add class to ensure our styling does
      // not mess with other stuff
      this.$el.addClass('ls');
      
      // Get templates
      this.templates = this.templates || {};
      LT.utils.getTemplate('template-loading', this.templates, 'loading');
      LT.utils.getTemplate('template-bill', this.templates, 'bill');
      LT.utils.getTemplate('template-category', this.templates, 'category');
      LT.utils.getTemplate('template-categories', this.templates, 'categories');
    },
  
    loading: function() {
      this.$el.html(this.templates.loading({}));
    },
    
    renderCategories: function() {
      this.$el.html(this.templates.categories({
        categories: this.router.categories.toJSON(),
        bills: this.router.bills.toJSON(),
        options: this.options
      }));
    },
    
    renderCategory: function(category) {
      if (!_.isObject(category)) {
        category = this.router.categories.get(category);
      }
      this.$el.html(this.templates.category(category.toJSON()));
    },
    
    renderBill: function(bill) {
      if (!_.isObject(bill)) {
        bill = this.router.bills.get(bill);
      }
      console.log(bill);
      this.$el.html(this.templates.bill(bill.toJSON()));
    }
  });
  
})(jQuery, window);