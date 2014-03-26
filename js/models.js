/**
 * Models for the Legislature Tracker app.
 */


/**
 * Base Model for Open States items
 */
LT.BaseModel = Backbone.Model.extend({
  initialize: function(attr, options) {
    this.options = options;
    this.app = this.options.app;

    this.on('sync', function(model, resp) {
      model.set('fetched', true);
    });
  }
});

/**
 * Base Model for Open States items
 */
LT.OSModel = LT.BaseModel.extend({
  urlBase: function() {
    return 'http://openstates.org/api/v1/';
  },

  urlEnd: function() {
    return '/?apikey=' + encodeURI(this.app.options.OSKey) + '&callback=?';
  },

  url: function() {
    return this.urlBase() + encodeURI(this.osType) + '/' +
      encodeURI(this.id) + this.urlEnd();
  },

  initialize: function(attr, options) {
    LT.OSModel.__super__.initialize.apply(this, arguments);
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
 * Model for Open States Legislator
 */
LT.OSLegislatorModel = LT.OSModel.extend({
  osType: 'legislators',

  initialize: function(attr, options) {
    LT.OSBillModel.__super__.initialize.apply(this, arguments);

    // When we first get a leg_id, the we should fetch the data
    if (this.get('leg_id')) {
      this.app.fetchModel(this);
    }
  }
});

/**
 * Model for Open States Committee
 */
LT.OSCommitteeModel = LT.OSModel.extend({
  osType: 'committees'
});

/**
 * Model for Open States Bill
 */
LT.OSBillModel = LT.OSModel.extend({
  url: function() {
    // Determine API call if there is an ID or if bill_id
    if (!_.isUndefined(this.id)) {
      return this.urlBase() + 'bills/'  + this.id + this.urlEnd();
    }
    else if (!_.isUndefined(this.get('bill_id')) && this.get('bill_id') !== '') {
      return this.urlBase() + 'bills/'  + encodeURI(this.app.options.state) + '/' +
        encodeURI(this.app.options.session) + '/' +
        encodeURI(this.get('bill_id')) + this.urlEnd();
    }
  },

  initialize: function(attr, options) {
    var thisModel = this;
    LT.OSBillModel.__super__.initialize.apply(this, arguments);
  },

  // Get some aggregate data from the Open State data
  parse: function(data, options) {
    var thisModel = this;

    // Parse some dates
    data.created_at = data.created_at ? moment(data.created_at) : undefined;
    data.updated_at = data.updated_at ? moment(data.updated_at) : undefined;

    // Action dates.  Filter then make into a moment()
    data.action_dates = _.filterObject(data.action_dates, function(a, ai) {
      return a;
    });
    data.action_dates = _.mapObject(data.action_dates, function(a, ai) {
      return moment(a);
    });

    // Actions.  Make dates into moment()s
    data.actions = _.mapObject(data.actions, function(a, ai) {
      a.date = moment(a.date);
      return a;
    });

    // Votes.  Make dates into moment()s
    data.votes = _.mapObject(data.votes, function(v, vi) {
      v.date = moment(v.date);
      return v;
    });

    // Add custom events to actions
    if (this.get('custom_events')) {
      data.actions = _.union(data.actions, this.get('custom_events'));
    }

    // Sort action
    data.actions = _.sortBy(data.actions, function(a, ai) {
      return (a.date.unix() + ai) * -1;
    });

    // Figure out newest
    data.newest_action = data.actions[0];

    // Add a hook for any custom bill parsing
    if (this.app.options.osBillParse && _.isFunction(this.app.options.osBillParse)) {
      data = this.options.osBillParse(data, this);
    }

    // Add a legislator model to each sponsor
    if (data.sponsors) {
      data.sponsors = _.map(data.sponsors, function(s, si) {
        s.id = s.leg_id;
        s.leg = thisModel.app.getModel('OSLegislatorModel', 'leg_id', s);
        return s;
      });
    }

    return data;
  },

  getActionDate: function(type) {
    return (this.get('action_dates')[type]) ? this.get('action_dates')[type] : false;
  },

  isSubstituted: function() {
    var sub = false;
    var thisModel = this;

    if (_.isBoolean(this.get('substitued'))) {
      sub = this.get('substitued');
    }
    else if (this.app.options.substituteMatch === false) {
      sub = false;
    }
    else {
      sub = _.find(this.get('actions'), function(a) {
        return a.action.match(thisModel.app.options.substituteMatch);
      });
      sub = (sub) ? true : false;
      this.set('substitued', sub);
    }

    return sub;
  }
});

/**
 * eBill model.  This model holds the editorial data
 * and references to OS bill.
 */
LT.BillModel = LT.BaseModel.extend({

  subbills: ['bill_primary', 'bill_companion', 'bill_conference'],

  initialize: function() {
    LT.BillModel.__super__.initialize.apply(this, arguments);

    // Create models for sub-bills
    this.loadOSBills();
  },

  // Create sub-bills
  loadOSBills: function() {
    var thisModel = this;
    _.each(this.subbills, function(b, bi) {
      var model;

      if (thisModel.get(b)) {
        // Create and attache new model
        model = thisModel.app.getModel('OSBillModel', 'bill_id', {
          bill_id: thisModel.get(b)
        });
        thisModel.set(b, model);
      }
    });
  },

  // Gets bills in an array
  getOSBills: function() {
    var thisModel = this;
    return _.filterEmpty(_.map(this.subbills, function(b, bi) {
      return thisModel.get(b);
    }));
  },

  // Gets OS bills ids in a an array
  getOSBillIDs: function() {
    var bills = this.getOSBills();

    return _.filterEmpty(_.map(bills, function(b, bi) {
      return _.isObject(b) ? b.get('bill_id') : b;
    }));
  },

  // Get data from individual OS bills.
  fetchOSBills: function() {
    var thisModel = this;
    var defers = [];
    this.getCategories();

    _.each(this.subbills, function(p, pi) {
      if (thisModel.get('hasBill') && thisModel.get(p)) {
        defers.push(thisModel.app.fetchModel(thisModel.get(p)));
      }
    });

    // When done, make some meta data
    return $.when.apply($, defers).done(function() {
      thisModel.loadOSCompanion().done(function() {
        thisModel.parseMeta();
        thisModel.lastUpdatedAt();
        thisModel.newestAction();
        thisModel.trigger('fetched:osbills');
      });
    });
  },

  // Override the fetch method to use the osbills one
  fetch: function() {
    return this.fetchOSBills();
  },

  // Check to see if we don't have a companion but Open States
  // says there is one.
  loadOSCompanion: function() {
    var thisModel = this;
    var match;
    var defers = [];

    if (this.get('hasBill') === true && !this.get('bill_companion') &&
      _.isObject(this.get('bill_primary')) && _.isArray(this.get('bill_primary').get('companions')) &&
        _.isObject(this.get('bill_primary').get('companions')[0])) {

      match = LT.parse.detectCompanionBill(this.get('bill_primary').get('companions')[0].bill_id);
      if (match) {
        this.set('bill_companion', thisModel.app.getModel('OSBillModel', 'bill_id', { bill_id : match }));
        defers.push(thisModel.app.fetchModel(this.get('bill_companion')));
      }
    }

    return $.when.apply($, defers);
  },

  // Get the category objects associated with this bill
  getCategories: function() {
    var thisModel = this;

    if (this.get('categories')) {
      this.set('categories', _.map(this.get('categories'), function(c) {
        if (!_.isObject(c)) {
          c = thisModel.app.getModel('CategoryModel', 'id', { id: c });
        }
        return c;
      }));
    }
  },

  // Determine the last updated date from each osbill
  lastUpdatedAt: function() {
    var last_updated_at;
    var p = this.get('bill_primary');
    var c = this.get('bill_companion');
    var co = this.get('bill_conference');

    if (p.get('updated_at')) {
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

    return this.get('last_updated_at');
  },

  // Determine the last action from each osbill
  newestAction: function() {
    var newest_action;
    var p = this.get('bill_primary');
    var c = this.get('bill_companion');
    var co = this.get('bill_conference');

    if (this.get('hasBill') && p.get('newest_action')) {
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

  // Determines if is recent.  Check for actions and action_dates.
  isRecent: function() {
    var newest = this.newestAction();
    var pActions = (this.get('bill_primary')) ? this.get('bill_primary').get('action_dates') : null;

    if (_.isObject(newest) && newest.date && moment().diff(newest.date, 'days') <= this.app.options.recentChangeThreshold) {
      return true;
    }
    else if (_.isObject(pActions) && pActions.last && moment().diff(pActions.last, 'days') <= this.app.options.recentChangeThreshold) {
      return true;
    }
    return false;
  },

  // We need to get actions and meta data from individual
  // bills.  This could get a bit complicated...
  parseMeta: function() {
    var thisModel = this;
    var swap, swap2;
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

          // Swap primary for companion.  Yeah, sorry.
          swap = this.get('bill_primary').get('bill_id');
          swap2 = this.get('bill_companion').get('bill_id');
          this.unset('bill_primary');
          this.set('bill_primary', (function() {
            return thisModel.app.getModel('OSBillModel', 'bill_id', { bill_id: swap2 });
          })());
          this.unset('bill_companion');
          this.set('bill_companion', (function() {
            return thisModel.app.getModel('OSBillModel', 'bill_id', { bill_id: swap });
          })());
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

    // Determine if this bill has been updated recently
    type.recent = this.isRecent();

    // Attach new data
    this.set('actions', actions);
    this.set('bill_type', type);

    // Helps bumps the view a bit
    this.trigger('change');
    return this;
  }
});

/**
 * Model Legislature Tracker category
 */
LT.CategoryModel = LT.BaseModel.extend({

  initialize: function(attr, options) {
    var thisModel = this;
    LT.CategoryModel.__super__.initialize.apply(this, arguments);

    // Keep a reference to bills in this category
    this.set('bills', new LT.BillsCollection(null));
  },

  getBills: function(bills) {
    // Gets reference to bills that are in the category
    var thisModel = this;
    var cat = this.get('id');

    bills.each(function(b, bi) {
      if (_.indexOf(b.get('categories'), cat) !== -1) {
        thisModel.get('bills').push(thisModel.app.getModel('BillModel', 'bill', b.attributes));
      }
    });
    return this;
  }
});
