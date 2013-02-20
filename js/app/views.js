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
      LT.utils.getTemplate('template-bill-progress', this.templates, 'billProgress');
      
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
        var json = b.toJSON();
        return thisView.templates.bill({
          bill: json,
          expandable: true,
          progress: thisView.templates.billProgress(json)
        });
      });
      
      this.$el.html(this.templates.category(data));
      this.getLegislators();
    },
    
    renderBill: function(bill) {
      if (!_.isObject(bill)) {
        bill = this.router.bills.get(bill);
      }
      var json = bill.toJSON();
      
      this.$el.html(this.templates.bill({
        bill: json,
        expandable: false,
        progress: this.templates.billProgress(json)
      }));
      this.getLegislators();
    },
    
    expandBill: function(e) {
      e.preventDefault();
      var $this = $(e.target);
      
      $this.parent().parent().toggleClass('expanded').find('.bill-bottom').slideToggle();
    },
    
    getLegislators: function() {
      this.$el.find('.sponsor:not(.found)').each(function() {
        var $this = $(this);
        var data = $this.data();
        data.id = data.legId;
        
        if (data.id) {
          var leg = LT.utils.getModel('OSLegislatorModel', 'id', data);
          $.when(LT.utils.fetchModel(leg)).then(function() {
            var view = new LT.LegislatorView({
              el: $this,
              model: leg
            }).render();
          });
        }
      });
    }
  });

  /**
   * Legislator view.
   */
  LT.LegislatorView = Backbone.View.extend({
    model: LT.OSLegislatorModel,
    
    initialize: function(options) {
      // Get templates
      this.templates = this.templates || {};
      LT.utils.getTemplate('template-legislator', this.templates, 'legislator');
      
      // Bind all
      _.bindAll(this);
    },
    
    render: function() {
      this.$el.addClass('found')
        .html(this.templates.legislator(this.model.toJSON()));
      return this;
    }
  });
  
})(jQuery, window);