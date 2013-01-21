/**
 * Models for the Legislature Tracker app.
 */

/**
 * Model for Open States Bill
 */
var OSStateModel = Backbone.Model.extend({
  url: function() {
    // This is slighlty faster than using +
    var url = [];
    url.push('http://openstates.org/api/v1/metadata/');
    url.push(encodeURI(this.options.state));
    url.push('/?apikey=');
    url.push(this.options.apiKey);
    url.push('&callback=?');
    return url.join('');
  },
  
  initialize: function(attr, options) {
    this.options = options;
  }
});

/**
 * Model for Open States Bill
 */
var OSBillModel = Backbone.Model.extend({
  url: function() {
    var url = [];
    
    // If id is given, then use that, otherwise use
    // bill ID and other options
    if (!_.isUndefined(this.id)) {
      url.push('http://openstates.org/api/v1/bills/');
      url.push(encodeURI(this.id));
      url.push('/?apikey=');
      url.push(this.options.apiKey);
      url.push('&callback=?');
    }
    else {
      url.push('http://openstates.org/api/v1/bills/');
      url.push(encodeURI(this.options.state));
      url.push('/');
      url.push(encodeURI(this.options.session));
      url.push('/');
      url.push(encodeURI(this.get('bill_id')));
      url.push('/?apikey=');
      url.push(this.options.apiKey);
      url.push('&callback=?');
    }
    return url.join('');
  },
  
  initialize: function(attr, options) {
    this.options = options;
  }
});

/**
 * Model for Open States Legislator
 */
var OSLegislatorModel = Backbone.Model.extend({
  url: function() {
    var url = [];
    url.push('http://openstates.org/api/v1/legislators/');
    url.push(encodeURI(this.id));
    url.push('/?apikey=');
    url.push(this.options.apiKey);
    url.push('&callback=?');
    return url.join('');
  },
  
  initialize: function(attr, options) {
    this.options = options;
  }
});

/**
 * Model for Open States Committee
 */
var OSLegislatorCommittee = Backbone.Model.extend({
  url: function() {
    var url = [];
    url.push('http://openstates.org/api/v1/committees/');
    url.push(encodeURI(this.id));
    url.push('/?apikey=');
    url.push(this.options.apiKey);
    url.push('&callback=?');
    return url.join('');
  },
  
  initialize: function(attr, options) {
    this.options = options;
  }
});