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
      LT.utils.getTemplate('template-bill-progress', this.templates, 'bill-progress');
      
      // Bind all
      _.bindAll(this);
    },
    
    events: {
      'click .bill-expand': 'expandBill'
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
      var thisView = this;
      var data;
      
      if (!_.isObject(category)) {
        category = this.router.categories.get(category);
      }
      
      // Render each bill
      data = category.toJSON();
      data.bills = data.bills.map(function(b) {
        return thisView.templates.bill({
          bill: b.toJSON(),
          expandable: true
        });
      });
      
      this.$el.html(this.templates.category(data));
    },
    
    renderBill: function(bill) {
      if (!_.isObject(bill)) {
        bill = this.router.bills.get(bill);
      }
      this.$el.html(this.templates.bill({
        bill: bill.toJSON(),
        expandable: false
      }));
    },
    
    expandBill: function(e) {
      e.preventDefault();
      var $this = $(e.target);
      
      $this.parent().parent().find('.bill-bottom').slideToggle();
    }
  });
  
})(jQuery, window);