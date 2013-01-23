/**
 * Core file for Legislature tracker.
 *
 * Namespaces LT and allows for no conflict function.
 */
var LT;
var originalLT;

if (typeof exports !== undefined + '') {
  LT = exports;
}
else {
  originalLT = window.LT;
  LT = {};

  LT.noConflict = function() {
    window.LT = originalLT;
    return this;
  };

  window.LT = LT;
}

// Cache for models, as Backbone will create new model objects
// with the same id.
LT.cache = {};
LT.cache.models = {};

/**
 * Utility functions for LT
 */
LT.utils = {};

// Make new model, and utilize cache
LT.utils.getModel = function(model, idAttr, id, options) {
  var hash = model + ':' + idAttr + ':' + id;
  var attr = {};
  attr[idAttr] = id;
  
  if (_.isUndefined(LT.cache.models[hash])) {
    LT.cache.models[hash] = new LT[model](attr, options);
  }
  
  return LT.cache.models[hash];
};

// Fetch model, unless has already been fetched.
// options should be the same options passed to
// fetch().
LT.utils.fetchModel = function(model, options) {
  if (model.get('fetched') !== true) {
    model.fetch(options);
  }
  else {
    options.success.apply(model, [ model, false, false ]);
  }
};