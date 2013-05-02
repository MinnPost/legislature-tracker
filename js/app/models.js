/**
 * Models for the Legislature Tracker app.
 */
 
(function($, w, undefined) {
  
  /**
   * Base Model for Open States items
   */
  LT.OSModel = Backbone.Model.extend({
    urlBase: function() {
      return 'http://openstates.org/api/v1/';
    },
    
    urlEnd: function() {
      return '/?apikey=' + encodeURI(LT.options.OSKey) + '&callback=?';
    },
    
    url: function() {
      return this.urlBase() + encodeURI(this.osType) + '/' + 
        encodeURI(this.id) + this.urlEnd();
    },
    
    initialize: function(attr, options) {
      this.options = options;
      
      this.on('sync', function(model, resp) {
        // Mark as fetched so we can use some caching
        model.set('fetched', true);
      });
    }
  });
  
  /**
   * Model for Open States State
   */
  LT.OSStateModel = LT.OSModel.extend({
    url: function() {
      return this.urlBase() + 'metadata/'  + encodeURI(this.options.state) + 
        this.urlEnd();
    }
  });
  
  /**
   * Model for Open States Bill
   */
  LT.OSBillModel = LT.OSModel.extend({
    url: function() {
      if (!_.isUndefined(this.id)) {
        return this.urlBase() + 'bills/'  + this.id + this.urlEnd();
      }
      else {
        return this.urlBase() + 'bills/'  + encodeURI(this.options.state) + '/' +
          encodeURI(this.options.session) + '/' +
          encodeURI(this.get('bill_id')) + this.urlEnd();
      }
    },
    
    initialize: function(attr, options) {
      LT.OSBillModel.__super__.initialize.apply(this, arguments);
      
      this.on('sync', function(model, resp, options) {
        this.parseOSData();
      });
    },
    
    parseOSData: function() {
      // Get some aggregate data from the Open State data
      var swapper;
      
      // Parse some dates
      this.set('created_at', moment(this.get('created_at')));
      this.set('updated_at', moment(this.get('updated_at')));
      
      // Action dates
      swapper = this.get('action_dates');
      _.each(swapper, function(a, i) {
        swapper[i] = (a) ? moment(a) : a;
      });
      this.set('action_dates', swapper);
      
      // Actions
      swapper = this.get('actions');
      _.each(swapper, function(a, i) {
        swapper[i].date = (a.date) ? moment(a.date) : a.date;
      });
      this.set('actions', swapper);
      
      // Votes
      swapper = this.get('votes');
      _.each(swapper, function(a, i) {
        swapper[i].date = (a.date) ? moment(a.date) : a.date;
      });
      this.set('votes', swapper);
      
      // Add custom events to actions
      swapper = this.get('custom_events');
      if (_.isArray(swapper) && swapper.length > 0) {
        this.set('actions', _.union(this.get('actions'), swapper));
      }
      
      // Sort action
      this.set('actions', _.sortBy(this.get('actions'), function(a, i) {
        return (a.date.unix() + i) * -1;
      }));
      
      // Figure out newest
      this.set('newest_action', this.get('actions')[0]);
      
      // All for hook
      if (LT.options.osBillParse && _.isFunction(LT.options.osBillParse)) {
        LT.options.osBillParse(this);
      }
    },
    
    getActionDate: function(type) {
      return (this.get('action_dates')[type]) ? this.get('action_dates')[type] : false;
    },
    
    isSubstituted: function() {
      var sub = false;
      
      if (_.isBoolean(this.get('substitued'))) {
        sub = this.get('substitued');
      }
      else if (LT.options.substituteMatch === false) {
        sub = false;
      }
      else {
        sub = _.find(this.get('actions'), function(a) {
          return a.action.match(LT.options.substituteMatch);
        });
        sub = (sub) ? true : false;
        this.set('substitued', sub);
      }
      
      return sub;
    }
  });
  
  /**
   * Model for Open States Legislator
   */
  LT.OSLegislatorModel = LT.OSModel.extend({
    osType: 'legislators'
  });
  
  /**
   * Model for Open States Committee
   */
  LT.OSCommitteeModel = LT.OSModel.extend({
    osType: 'committees'
  });
  
  /**
   * Model Legislature Tracker for bill
   */
  LT.BillModel = Backbone.Model.extend({
    initialize: function(attr, options) { 
      this.options = options;
    },
   
    loadOSBills: function(callback, error) {
      var thisModel = this;
      var defers = [];
      
      _.each(['bill_primary', 'bill_companion', 'bill_conference'], function(prop) {
        if (thisModel.get('hasBill') && thisModel.get(prop)) {
          defers.push(LT.utils.fetchModel(thisModel.get(prop)));
        }
      });
      
      return $.when.apply($, defers);
    },
    
    loadOSCompanion: function() {
      var thisModel = this;
      var match;
      var defers = [];
    
      if (this.get('hasBill') === true && !this.get('bill_companion') && 
        _.isObject(this.get('bill_primary')) && _.isArray(this.get('bill_primary').get('companions'))) {
        
        match = LT.parse.detectCompanionBill(this.get('bill_primary').get('companions')[0].bill_id);
        if (match) {
          this.set('bill_companion', LT.utils.getModel('OSBillModel', 'bill_id', { bill_id : match }));
          defers.push(LT.utils.fetchModel(this.get('bill_companion')));
        }
      }
      
      return $.when.apply($, defers);
    },
    
    loadCategories: function() {
      if (this.get('categories')) {
        this.set('categories', _.map(this.get('categories'), function(c) {
          if (!_.isObject(c)) {
            c = LT.utils.getModel('CategoryModel', 'id', { id: c });
          }
          return c;
        }));
      }
    },
    
    lastUpdatedAt: function() {
      var last_updated_at;
      var p = this.get('bill_primary');
      var c = this.get('bill_companion');
      var co = this.get('bill_conference');
      
      if (_.isUndefined(this.get('last_updated_at')) && p.get('updated_at')) {
        last_updated_at = p.get('updated_at');
        
        if (c && c.get('updated_at')) {
          last_updated_at = (c.get('updated_at').unix() >
            last_updated_at.unix()) ?
            c.get('updated_at') : last_updated_at;
        }
        if (co && co.get('updated_at')) {
          last_updated_at = (co.get('updated_at').unix() >
            last_updated_at.unix()) ?
            co.get('updated_at') : last_updated_at;
        }
        this.set('last_updated_at', last_updated_at);
      }
      // Check if this bill loaded correctly
      else if (_.isUndefined(this.get('last_updated_at')) && !p.get('updated_at')) {
        LT.log('Could not fetch primary bill data from OpenStates. Check that the id ' + 
          this.get('bill_primary').get('bill_id') + ' is formatted properly.');
      }
      
      return this.get('last_updated_at');
    },
    
    newestAction: function() {
      var newest_action;
      var p = this.get('bill_primary');
      var c = this.get('bill_companion');
      var co = this.get('bill_conference');
      
      if (this.get('hasBill') && _.isUndefined(this.get('newest_action')) && p.get('newest_action')) {
        newest_action = p.get('newest_action');
        
        if (c && c.get('newest_action')) {
          newest_action = (c.get('newest_action').date.unix() >
            newest_action.date.unix()) ?
            c.get('newest_action') : newest_action;
        }
        if (co && co.get('newest_action')) {
          newest_action = (co.get('newest_action').date.unix() >
            newest_action.date.unix()) ?
            co.get('newest_action') : newest_action;
        }
        this.set('newest_action', newest_action);
      }
      
      return this.get('newest_action');
    },
    
    parseMeta: function() {
    
      // We need to get actions and meta data from individual 
      // bills.  This could get a bit complicated...
      var actions = {
        upper: false,
        lower: false,
        conference: false,
        signed: false,
        last: false
      };
      
      // Let's determine types
      var type = {
        companion: (this.get('bill_companion')) ? true : false,
        conference: (this.get('bill_conference')) ? true : false
      };
      
      // Sort custom events
      if (this.get('custom_events')) {
        this.set('custom_events', _.sortBy(this.get('custom_events'), function(e, i) {
          return (e.date.unix() + i) * -1;
        }));
      }

      // If there are osBill data to go through
      if (this.get('hasBill')) {
        // The companion or primary bill can stop being relevant.  This is noted
        // by a SF Substituted or HF Substituted
        if (type.companion) {
          if (this.get('bill_companion').isSubstituted()) {
            type.substituted = true;
          }
          if (this.get('bill_primary').isSubstituted()) {
            type.substituted = true;
            // Swap primary for companion
          }
        }
        
        // If only primary, get the actions from there, or
        // if substituted, then just get from primary bill
        if (!type.companion || type.substituted) {
          actions.lower = this.get('bill_primary').getActionDate('passed_lower');
          actions.upper = this.get('bill_primary').getActionDate('passed_upper');
        }
        
        // If companion, get the actions from their respective bills
        if (type.companion && !type.substituted) {
          if (this.get('bill_primary').get('chamber') === 'upper') {
            actions.upper = this.get('bill_primary').getActionDate('passed_upper');
            actions.lower = this.get('bill_companion').getActionDate('passed_lower');
          }
          else {
            actions.lower = this.get('bill_primary').getActionDate('passed_lower');
            actions.upper = this.get('bill_companion').getActionDate('passed_upper');
          }
        }
        
        // If conference bill, get date if both chambers have passed
        if (type.conference) {
            var lower = this.get('bill_conference').getActionDate('passed_lower');
            var upper = this.get('bill_conference').getActionDate('passed_upper');
              
            if (lower && upper) {
              actions.conference = (lower.unix() >= upper.unix()) ? lower : upper;
            }
        }
        
        // Determine signed.  If conference, then use that, otherwise
        // use primary
        if (type.conference) {
          actions.signed = this.get('bill_conference').getActionDate('signed');
        }
        else {
          actions.signed = this.get('bill_primary').getActionDate('signed');
        }
        
        // Determine last updated date
        if (type.conference) {
          actions.last = this.get('bill_conference').getActionDate('last');
        }
        else if (type.companion) {
          actions.last = (this.get('bill_companion').getActionDate('last').unix() >=
            this.get('bill_primary').getActionDate('last').unix()) ?
            this.get('bill_companion').getActionDate('last') :
            this.get('bill_primary').getActionDate('last');
        }
        else  {
          actions.last = this.get('bill_primary').getActionDate('last');
        }
      
        // Description
        if (!this.get('description')) {
          this.set('description', this.get('bill_primary').get('summary'));
        }
      }
      
      this.set('actions', actions);
      this.set('bill_type', type);
      
      return this;
    }
  });
  
  /**
   * Model Legislature Tracker category
   */
  LT.CategoryModel = Backbone.Model.extend({
  
    initialize: function(attr, options) {
      this.options = options;
      this.set('bills', new LT.BillsCollection(null));
      this.getBills();
    },
    
    getBills: function() {
      // Gets reference to bills that are in the category
      var thisModel = this;
      var allBills = LT.app.bills;
      var cat = this.get('id');

      allBills.each(function(b) {
        if (_.indexOf(b.get('categories'), cat) !== -1) {
          thisModel.get('bills').push(LT.utils.getModel('BillModel', 'bill', b.attributes));
        }
      });
      return this;
    },
    
    loadBills: function(callback, error) {
      // Load up bill data from open states
      var defers = [];
      var thisModel = this;
      
      this.get('bills').each(function(bill) {     
        defers.push(bill.loadOSBills());
      });
      
      // Queue bills
      $.when.apply($, defers).done(function() {
        var companionDefers = [];
        
        // Queue any companions
        thisModel.get('bills').each(function(bill) {     
          companionDefers.push(bill.loadOSCompanion());
        });
        
        $.when.apply($, companionDefers).done(function() {
          thisModel.get('bills').each(function(bill) {  
            bill.parseMeta();
          });
          
          callback();
        }).fail(error);
      }).fail(error);
      
      return this;
    }
  });

})(jQuery, window);