/**
 * Utility functions for Legislature tracker.
 */

// Cache for models, as Backbone will create new model objects
// with the same id.
LT.cache = {};
LT.cache.models = {};

/**
 * Wrapper around console.log so older browsers don't
 * complain.
 *
 * Shoud be used sparingly where throwing errors is not
 * appropriate.
 */
LT.log = function(text) {
  if (!_.isUndefined(window.console)) {
    window.console.log(text);
  }
};

/**
 * Utility functions for LT
 */
LT.utils = {};

// Make new model, and utilize cache
LT.utils.getModel = function(model, idAttr, attr, options) {
  var hash = model + ':' + idAttr + ':' + attr[idAttr];
  options = options || LT.options;

  if (_.isUndefined(LT.cache.models[hash])) {
    LT.cache.models[hash] = new LT[model](attr, options);
  }

  return LT.cache.models[hash];
};

// Fetch model, unless has already been fetched.
LT.utils.fetchModel = function(model) {
  var defer;

  if (model.get('fetched') !== true) {
    return model.fetch();
  }
  else {
    defer = $.Deferred();
    defer.resolveWith(model);
    return defer;
  }
};

// Translate words, usually for presentation
LT.utils.translate = function(section, input) {
  var output = input;

  if (_.isObject(LT.options.wordTranslations[section]) &&
    _.isString(LT.options.wordTranslations[section][input])) {
    output = LT.options.wordTranslations[section][input];
  }

  return output;
};

// Make image path.  If the image path is a full
// path with http, then don't prepend image path
LT.utils.imagePath = function(image) {
  return (image.indexOf('http') === 0) ? image : LT.options.imagePath + image;
};

/**
 * Template handling.  For development, we want to use
 * the template files directly, but for build, they should be
 * compiled into JS.
 *
 * Assigment is used to not worry about asyncronomonity
 */
LT.templates = LT.templates || {};
LT.utils.getTemplate = function(name, assignment, property, callback) {
  var templatePath = 'js/app/templates/' + name + '.html';
  var templateGETPath = LT.options.templatePath + name + '.html';

  if (!_.isUndefined(LT.templates[templatePath])) {
    assignment[property] = LT.templates[templatePath];
  }
  else {
    $.ajax({
      url: templateGETPath,
      method: 'GET',
      async: false,
      contentType: 'text',
      success: function(data) {
        LT.templates[templatePath] = _.template(data);
        assignment[property] = LT.templates[templatePath];

        if (_.isFunction(callback)) {
          callback.apply(this, [ data ]);
        }
      }
    });
  }
};