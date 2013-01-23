/**
 * Models for the Legislature Tracker app.
 */

/**
 * Base Model for Open States items
 */
LT.OSModel = Backbone.Model.extend({
  urlBase: function() {
    return 'http://openstates.org/api/v1/';
  },
  
  urlEnd: function() {
    return '/?apikey=' + this.options.apiKey + '&callback=?';
  },
  
  url: function() {
    return this.urlBase() + '/' + this.osType + '/'  + this.id + this.urlEnd();
  },
  
  initialize: function(attr, options) {
    this.options = options;
    
    this.on('sync', function(model, resp, options) {
      // Mark as fetched so we can use some caching
      model.set('fetched', true);
    });
  }
});

/**
 * Model for Open States Bill
 */
LT.OSStateModel = LT.OSModel.extend({
  url: function() {
    return this.urlBase() + '/metadata/'  + this.options.state + this.urlEnd();
  }
});

/**
 * Model for Open States Bill
 */
LT.OSBillModel = LT.OSModel.extend({
  url: function() {
    if (!_.isUndefined(this.id)) {
      return this.urlBase() + '/bills/'  + this.id + this.urlEnd();
    }
    else {
      return this.urlBase() + '/bills/'  + this.options.state + '/' +
        this.options.session + '/' +
        this.get('bill_id') + this.urlEnd();
    }
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
 * Model Legislature Tracker category
 */
LT.CategoryModel = Backbone.Model.extend({
  initialize: function(attr, options) {
    this.options = options;
  }
});