/**
 * Views for the Legislator Tracker app
 */
LT.MainApplicationView = Backbone.View.extend({
  templates: {
    loading: $('#template-loading').html(),
    categories: $('#template-categories').html()
  },
  
  initialize: function(options) {
    // Add class to ensure our styling does
    // not mess with other stuff
    this.$el.addClass('ls');
  },

  loading: function() {
    this.$el.html(_.template(this.templates.loading, {}));
  },
  
  render: function() {
    // Default view render
    this.$el.html(_.template(this.templates.categories, {
      categories: this.router.categories.toJSON(),
      bills: this.router.bills.toJSON()
    }));
  }
});