/**
 * Main application container for the Legislature Tracker
 *
 * An 'e' prefix is referring to editorialized content.
 */
(function($, w, undefined) {

  LT.Application = Backbone.Router.extend({
    routes: {
      'categories': 'routeCategories',
      'category/recent': 'routeRecentCategory',
      'category/:category': 'routeCategory',
      'bill/:bill': 'routeEBill',
      'bill-detail/:bill': 'routeOSBill',
      '*defaultR': 'routeDefault'
    },
  
    initialize: function(options) {
      LT.options = _.extend(LT.defaultOptions, options);
      LT.app = this;
      
      // Bind to help with some event callbacks
      _.bindAll(this);
      
      // Main view for application
      this.mainView = new LT.MainApplicationView(LT.options);
      this.mainView.router = this;
      this.mainView.loading();
      
      // Get data from spreadsheets
      this.tabletop = Tabletop.init(_.extend(LT.options.tabletopOptions, {
        key: LT.options.eKey,
        callback: this.loadEBills,
        callbackContext: this,
        wanted: LT.options.sheetsWanted
      }));
    },
    
    // Function to call when bill data is loaded
    loadEBills: function(data, tabletop) {
      var thisRouter = this;
      
      // Parse out data from sheets
      var parsed = LT.parse.eData(tabletop);

      // Set up collections
      this.categories = new LT.CategoriesCollection(null);
      this.bills = new LT.BillsCollection(null);

      // Add bills and categories models
      _.each(parsed.bills, function(b) {
        thisRouter.bills.add(LT.utils.getModel('BillModel', 'bill', b));
      });
      _.each(parsed.categories, function(c) {
        thisRouter.categories.add(LT.utils.getModel('CategoryModel', 'id', c));
      });
      this.bills.each(function(b) {
        b.loadCategories();
      });
      
      // Load up bill count
      if (LT.options.aggregateURL) {
        $.jsonp({
          url: LT.options.aggregateURL,
          success: this.loadAggregateCounts
        });
      }
      else {
        // Start application/routing
        this.start();
      }
    },
    
    // Get aggregate counts
    loadAggregateCounts: function(billCountData) {
      var thisRouter = this;
      
      _.each(billCountData, function(stat) {
        if (stat.stat === 'total-bills') {
          thisRouter.totalBills = parseInt(stat.value, 10);
        }
        if (stat.stat === 'total-bills-passed') {
          thisRouter.totalBillsPassed = parseInt(stat.value, 10);
        }
        if (stat.stat === 'total-bills-signed') {
          thisRouter.totalBillsSigned = parseInt(stat.value, 10);
        }
      });
      
      // Start application/routing
      this.start();
    },
    
    // Start application (after data has been loaded)
    start: function() {
      // Start handling routing and history
      Backbone.history.start();
    },
  
    // Default route
    routeDefault: function() {
      this.navigate('/categories', { trigger: true, replace: true });
      this.mainView.render();
    },
  
    // Categories view
    routeCategories: function() {
      var thisRouter = this;
    
      // If we are viewing the categories, we want to get
      // some basic data about the bills from Open States
      // but not ALL the data.  We can use the bill search
      // to do this.
      this.mainView.loading();
      this.getOSBasicBills(function() {
        thisRouter.makeRecentCategory();
        thisRouter.mainView.renderCategories();
      }, this.error);
    },
  
    // Single Category view
    routeCategory: function(category) {
      var thisRouter = this;
      
      category = decodeURI(category);
      category = this.categories.get(category);
      
      // Load up bill data from open states
      this.mainView.loading();
      category.loadBills(function() {
        thisRouter.mainView.renderCategory(category);
      }, thisRouter.error);
    },
    
    // Hack for recent category.  We have to build recent
    // category only after getting the short meta data
    // from open states
    routeRecentCategory: function() {
      var thisRouter = this;
      this.mainView.loading();
      
      this.getOSBasicBills(function() {
        thisRouter.makeRecentCategory();
        var category = thisRouter.categories.get('recent');
        
        category.loadBills(function() {
          thisRouter.mainView.renderCategory(category);
        }, thisRouter.error);
      }, this.error);
      
    },
    
    // eBill route
    routeEBill: function(bill) {
      var thisRouter = this;
      var bill_id = decodeURI(bill);
      
      bill = this.bills.where({ bill: bill_id })[0];
      
      if (!bill) {
        this.navigate('/bill-detail/' + encodeURI(bill_id), { trigger: true, replace: true });
        return;
      }
      
      this.mainView.loading();
      bill.loadOSBills().done(function() {
        bill.loadOSCompanion().done(function() {
          bill.parseMeta();
          thisRouter.mainView.renderEBill(bill);
        });
      }).fail(thisRouter.error);
    },
    
    // osBill route
    routeOSBill: function(bill) {
      var thisRouter = this;
      
      bill = decodeURI(bill);
      bill = LT.utils.getModel('OSBillModel', 'bill_id', { bill_id: bill });

      this.mainView.loading();
      $.when.apply($, [ LT.utils.fetchModel(bill) ]).done(function() {
        thisRouter.mainView.renderOSBill(bill);
      })
      .fail(thisRouter.error);
    },
    
    makeRecentCategory: function() {
      if (!this.madeRecentCategory) {
        var category = {
          id: 'recent',
          title: 'Recent Actions',
          description: 'The following bills have been updated in the past ' +
            LT.options.recentChangeThreshold + ' days.',
          image: LT.options.recentImage
        };
        
        this.bills.each(function(b) {
          var c = b.get('categories');
          var hasBill = b.get('hasBill') ;
          if(hasBill === true)
            if (Math.abs(parseInt(b.lastUpdatedAt().diff(moment(), 'days'), 10)) < LT.options.recentChangeThreshold) {
              c.push(category.id);
              b.set('categories', c);
            }
        });
        
        this.categories.add(LT.utils.getModel('CategoryModel', 'id', category));
        this.bills.each(function(b) {
          b.loadCategories();
        });
        
        this.madeRecentCategory = true;
      }
    },
    
    getOSBasicBills: function(callback, error) {
      var thisRouter = this;
      var billIDs = [];
      
      // Check if we have one this already
      if (!this.fetchedCategories) {
      
        // First collect all the bill id's we need
        this.bills.each(function(bill) {
            _.each(['bill_primary', 'bill_companion', 'bill_conference'], function(prop) {
            if (bill.get(prop)) {
              billIDs.push(bill.get(prop).get('bill_id'));
            }
          });
        });
  
        var url = 'http://openstates.org/api/v1/bills/?state=' + LT.options.state +
          '&search_window=session:' + LT.options.session +
          '&bill_id__in=' + encodeURI(billIDs.join('|')) +
          '&apikey=' + LT.options.OSKey + '&callback=?';
        
        $.jsonp({
          url: url,
          success: function(data) {
            thisRouter.fetchedCategories = true;
          
            _.each(data, function(d) {
              d.created_at = moment(d.created_at);
              d.updated_at = moment(d.updated_at);
              LT.utils.getModel('OSBillModel', 'bill_id', d).set(d);
            });
            callback.call(thisRouter);
          },
          error: this.error
        });
      }
      else {
        callback.call(thisRouter);
      }
    },
    
    error: function(e) {
      this.mainView.error(e);
    }
  });
  
})(jQuery, window);