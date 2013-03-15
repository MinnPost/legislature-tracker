/**
 * Utility functions for Legislature Tracker application.
 */

(function($, w, undefined) {

  /**
   * These will just extend underscore since that is the
   * utility library already being used.
   */
  _.mixin({
    trim: function(str) {
      if (!String.prototype.trim) {
        str = str.replace(/^\s+|\s+$/g, '');
      }
      else {
        str = str.trim();
      }
      
      return str;
    },
    cssClass: function(str) {
      return str.replace(/[^a-z0-9]/g, '-');
    },
    numberFormatCommas: function(number) {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
  });
  

  /**
   * Override Backbone's ajax function to use $.jsonp
   */
  if (_.isFunction(Backbone.$.jsonp)) {
    Backbone.ajax = function() {
      return Backbone.$.jsonp.apply(Backbone.$, arguments);
    };
  }
  
  /**
   * Basic jQuery plugin to see if element
   * has a scroll bar.
   */
  $.fn.hasScrollBar = function() {
    return (this.get(0) && this.get(0).scrollHeight) ?
      (this.get(0).scrollHeight > this.height()) : false;
  };
})(jQuery, window);
/**
 * Core file for Legislature tracker.
 *
 * Namespaces LT and allows for no conflict function.
 */
var LT;
var originalLT;
var exports = exports || undefined;

if (!_.isUndefined(exports)) {
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

(function($, w, undefined) {
  // Cache for models, as Backbone will create new model objects
  // with the same id.
  LT.cache = {};
  LT.cache.models = {};
  
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
    
    if (!_.isUndefined(LT.templates[templatePath])) {
      assignment[property] = LT.templates[templatePath];
    }
    else {
      $.ajax({
        url: templatePath,
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
  
  /**
   * Parsing out data from spreadsheet.
   *
   * Collection of functions for parsing
   */
  LT.parse = LT.parse || {};
  LT.parse.eData = function(tabletop) {
    var parsed = {};
    
    parsed.categories = LT.parse.eCategories(tabletop.sheets('Categories').all());
    parsed.bills = LT.parse.eBills(tabletop.sheets('Bills').all());
    parsed.events = LT.parse.eEvents(tabletop.sheets('Events').all());
    
    // Add events into bills
    _.each(_.groupBy(parsed.events, 'bill_id'), function(e, b) {
      _.each(parsed.bills, function(bill, i) {
        if (bill.bill_id === b) {
          parsed.bills[i].custom_events = e;
        }
      });
    });
    
    return parsed;
  };
  
  LT.parse.eBills = function(bills) {
    return _.map(bills, function(row) {
      LT.parse.translateFields(LT.options.fieldTranslations.eBills, row);
      row.links = LT.parse.eLinks(row.links);
      
      // Break up categories into an array
      row.categories = (row.categories) ? row.categories.split(',') : [];
      row.categories = _.map(row.categories, _.trim);
      
      // Create open states bill objects
      row.bill_primary = (row.bill) ?
        LT.utils.getModel('OSBillModel', 'bill_id', { bill_id: row.bill }) : undefined;
      row.bill_companion = (row.bill_companion) ?
        LT.utils.getModel('OSBillModel', 'bill_id', { bill_id: row.bill_companion }) : undefined;
      row.bill_conference = (row.bill_conference) ?
        LT.utils.getModel('OSBillModel', 'bill_id', { bill_id: row.bill_conference }) : undefined;
      return row;
    });
  };
  
  LT.parse.eCategories = function(categories) {
    return _.map(categories, function(row) {
      LT.parse.translateFields(LT.options.fieldTranslations.eCategories, row);
      row.links = LT.parse.eLinks(row.links);
      row.open_states_subjects = LT.parse.csvCategories(row.open_states_subjects);
      row.legislator_subjects = LT.parse.csvCategories(row.legislator_subjects);
      return row;
    });
  };
  
  LT.parse.eEvents = function(events) {
    return _.map(events, function(row) {
      LT.parse.translateFields(LT.options.fieldTranslations.eEvents, row);
      row.links = LT.parse.eLinks(row.links);
      row.date = moment(row.date);
      
      // Add some things to fit format of Open States actions
      row.type = [ 'custom' ];
      
      return row;
    });
  };
  
  // "Title to link|http://minnpost.com", "Another link|http://minnpost.com"
  LT.parse.eLinks = function(link) {
    var links = [];
    link = _.trim(link);
    
    if (link.length === 0) {
      return links;
    }
    
    // Remove first and last quotes
    link = (link.substring(0, 1) === '"') ? link.substring(1) : link;
    link = (link.substring(link.length - 1, link.length) === '"') ? link.slice(0, -1) : link;
    
    // Separate out the parts
    links = link.split('", "');
    links = _.map(links, function(l) {
      return {
        title: l.split('|')[0],
        url: l.split('|')[1]
      };
    });
    
    return links;
  };
  
  // "Environmental", "Energy"
  LT.parse.csvCategories = function(category) {
    category = _.trim(category);
    if (category.length === 0) {
      return [];
    }
    
    // Remove first and last quotes
    category = (category.substring(0, 1) === '"') ? category.substring(1) : category;
    category = (category.substring(category.length - 1, category.length) === '"') ? 
      category.slice(0, -1) : category;
    
    // Separate out the parts
    return category.split('", "');
  };
  
  // Handle changing field names
  LT.parse.translateFields = function(translation, row) {
    _.each(translation, function(input, output) {
      row[output] = row[input];
      
      if (output !== input) {
        delete row[input];
      }
    });
  };
  
  // Default options
  LT.defaultOptions = {
    sheetsWanted: ['Categories', 'Bills', 'Events'],
    fieldTranslations: {
      eCategories: {
        'id': 'categoryid',
        'open_states_subjects': 'openstatessubjects',
        'legislator_subjects': 'legislatorsubjects'
      },
      eBills: {
        'bill': 'bill',
        'bill_companion': 'companionbill',
        'bill_conference': 'conferencebill',
        'categories': 'categories',
        'title': 'title',
        'description': 'description'
      },
      eEvents: {
        'bill_id': 'bill',
        'actor': 'chamber',
        'action': 'title'
      }
    },
    wordTranslations: {
      chamber: {
        'upper': 'Senate',
        'lower': 'House'
      },
      partyAbbr: {
        'Democratic-Farmer-Labor': 'DFL',
        'Democratic': 'D',
        'Republican': 'R'
      }
    },
    regex: {
      substituteMatch: /substituted/i
    },
    imagePath: './css/images/',
    recentChangeThreshold: 7
  };
  
})(jQuery, window);
this["LT"] = this["LT"] || {};
this["LT"]["templates"] = this["LT"]["templates"] || {};

this["LT"]["templates"]["js/app/templates/template-categories.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='\n<div class="categories-container">\n  ';
 if (LT.options.title) { 
;__p+='\n    <h2>'+
( LT.options.title )+
'</h2>\n  ';
 } 
;__p+='\n  \n  ';
 if (typeof LT.app.totalBills != 'undefined') { 
;__p+='\n    <div class="aggregate-counts">\n      <span class="aggregate-stat">\n        <span class="aggregate-count-label">Bills introduced:</span>\n        <span class="aggregate-count-value">'+
( _.numberFormatCommas(LT.app.totalBills) )+
'</span>\n      </span>\n      \n      <span class="aggregate-stat">\n        <span class="aggregate-count-label">Recently introduced:</span>\n        <span class="aggregate-count-value">~'+
( _.numberFormatCommas(LT.app.recentCreated) )+
'</span>\n      </span>\n      \n      <span class="aggregate-stat">\n        <span class="aggregate-count-label">Recently updated:</span>\n        <span class="aggregate-count-value">~'+
( _.numberFormatCommas(LT.app.recentUpdated) )+
'</span>\n      </span>\n    </div>\n  ';
 } 
;__p+='\n\n  <ul class="category-list clear-block">\n    ';
 for (var c in categories) { 
;__p+='\n      <li class="category-item category-item-'+
( c )+
'">\n        <div class="category-inner category-'+
( _.cssClass(categories[c].id) )+
'">\n          ';
 if (categories[c].image) { 
;__p+='\n            <a href="#/category/'+
( encodeURI(categories[c].id) )+
'">\n              <img class="category-image" src="'+
( LT.options.imagePath )+
''+
( categories[c].image )+
'" />\n            </a>\n          ';
 } 
;__p+='\n           \n          <h3>\n            <a href="#/category/'+
( encodeURI(categories[c].id) )+
'">\n              '+
( categories[c].title )+
'\n            </a>\n          </h3>\n          \n          <div>\n            Watching \n            <strong>'+
( categories[c].bills.length )+
'</strong>\n            ';
 if (categories[c].total_bill_count) { 
;__p+='\n              of '+
( categories[c].total_bill_count )+
'\n            ';
 } 
;__p+='\n            bills.\n          </div>\n        </div>\n      </li>\n    ';
 } 
;__p+='\n  </ul>\n</div>';
}
return __p;
};

this["LT"]["templates"]["js/app/templates/template-category.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='\n<div class="ls-header">\n  <a href="#/">All Categories</a>\n</div>\n\n<div class="category-container">\n  <h2>\n    '+
( category.title )+
'\n    \n    ';
 if (category.image) { 
;__p+='\n      <img class="category-image" src="'+
( LT.options.imagePath )+
''+
( category.image )+
'" />\n    ';
 } 
;__p+='\n  </h2>\n  \n  <p>'+
( category.description )+
'</p>\n  \n  ';
 if (_.isArray(category.links) && category.links.length > 0) { 
;__p+='\n    <div class="e-links">\n      <h4>In the news</h4>\n      \n      <ul class="e-links-list">\n        ';
 for (var l in category.links) { 
;__p+='\n          <li><a href="'+
( category.links[l].url )+
'">'+
( category.links[l].title )+
'</a></li>\n        ';
 } 
;__p+='\n      </ul>\n    </div>\n  ';
 } 
;__p+='\n  \n  <div class="clear-block bills-list">\n    ';
 category.bills.each(function(b) { 
;__p+='\n      '+
( templates.ebill({
        bill: b.toJSON(),
        expandable: true,
        templates: templates
      }) )+
'\n    ';
 }); 
;__p+='\n  </div>\n  \n  <div class="clear-block total-bill">\n    Watching \n    <strong>'+
( category.bills.length )+
'</strong>\n    ';
 if (typeof category.total_bill_count != 'undefined') { 
;__p+='\n      of '+
( category.total_bill_count )+
'\n    ';
 } 
;__p+='\n    bills in the '+
( category.title )+
' category.\n  </div>\n</div>';
}
return __p;
};

this["LT"]["templates"]["js/app/templates/template-ebill.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='';
 if (!expandable) { 
;__p+='\n  <div class="ls-header">\n    ';
 _.each(bill.categories, function(c, i) { 
;__p+='\n      <a href="#/category/'+
( c.get('id') )+
'">\n        '+
( c.get('title') )+
'';
 if (c.get('image')) { 
;__p+='<img class="category-image" src="'+
( LT.options.imagePath )+
''+
( c.get('image') )+
'" />';
 } 
;__p+='</a>';
 if (i < bill.categories.length - 1) { 
;__p+=',';
 } 
;__p+='\n    ';
 }) 
;__p+='\n  </div>\n';
 } 
;__p+='\n\n<div class="bill ebill ';
 if (expandable) { 
;__p+='is-expandable';
 } 
;__p+='">\n  <div class="bill-top">\n    <div class="bill-status">\n      <img class="lower ';
 if (bill.newest_action && Math.abs(parseInt(bill.newest_action.date.diff(moment(), 'days'))) < LT.options.recentChangeThreshold) { 
;__p+='passed';
 } 
;__p+='" src="'+
( LT.options.imagePath )+
'RecentChanges.png" title="';
 if (bill.newest_action && Math.abs(parseInt(bill.newest_action.date.diff(moment(), 'days'))) < LT.options.recentChangeThreshold) { 
;__p+='Recently changed';
 } 
;__p+='" />\n      \n      <img class="lower ';
 if (bill.actions.lower) { 
;__p+='passed';
 } 
;__p+='" src="'+
( LT.options.imagePath )+
'PassedHouse.png" title="';
 if (bill.actions.lower) { 
;__p+='Passed House';
 } 
;__p+='" />\n      \n      <img class="upper ';
 if (bill.actions.upper) { 
;__p+='passed';
 } 
;__p+='" src="'+
( LT.options.imagePath )+
'PassedSenate.png" title="';
 if (bill.actions.upper) { 
;__p+='Passed Senate';
 } 
;__p+='" />\n      \n      <img class="conference ';
 if (bill.bill_type.conference) { 
;__p+='passed';
 } 
;__p+='" src="'+
( LT.options.imagePath )+
'InConferenceCommittee.png" title="';
 if (bill.bill_type.conference) { 
;__p+='In conference committee';
 } 
;__p+='" />\n      \n      <img class="signed ';
 if (bill.actions.signed) { 
;__p+='passed';
 } 
;__p+='" src="'+
( LT.options.imagePath )+
'SignedIntoLaw.png" title="';
 if (bill.actions.signed) { 
;__p+='Signed into law by the Governor';
 } 
;__p+='" />\n    </div>\n    \n    ';
 if (expandable) { 
;__p+='<h3>';
 } else { 
;__p+='<h2>';
 } 
;__p+='\n      '+
( bill.title )+
'\n      <a class="permalink" title="Permanent link to bill" href="#/bill/'+
( encodeURI(bill.bill) )+
'"></a>\n    ';
 if (expandable) { 
;__p+='</h3>';
 } else { 
;__p+='</h2>';
 } 
;__p+='\n    \n    ';
 if (bill.newest_action) { 
;__p+='\n      <div class="latest-action">\n        Last action '+
( bill.newest_action.date.fromNow() )+
'.\n      </div>\n    ';
 } 
;__p+='\n    \n    <p class="description">'+
( bill.description )+
'</p>\n    \n    ';
 if (expandable) { 
;__p+='\n      <a href="#" class="bill-expand">More details</a>\n    ';
 } 
;__p+='\n  </div>\n  \n  <div class="bill-bottom">\n    ';
 if (_.isArray(bill.links) && bill.links.length > 0) { 
;__p+='\n      <div class="e-links">\n        <h4>In the news</h4>\n        <ul class="e-links-list">\n          ';
 for (var l in bill.links) { 
;__p+='\n            <li><a href="'+
( bill.links[l].url )+
'">'+
( bill.links[l].title )+
'</a></li>\n          ';
 } 
;__p+='\n        </ul>\n      </div>\n    ';
 } 
;__p+='\n\n    ';
 if (_.isObject(bill.bill_conference)) { 
;__p+='\n      <div class="conference-bill">\n        <div class="conference-bill-inner clear-block">\n          '+
( templates.osbill({
            title: 'Conference Bill',
            bill: bill.bill_conference.toJSON(),
            templates: templates
          }) )+
'\n        </div>\n      </div>\n      \n      <a class="expand-other-bills" href="#">Show other bills</a>\n    ';
 } 
;__p+='\n    \n    <div class="clear-block ';
 if (_.isObject(bill.bill_conference)) { 
;__p+='has-conference-bill';
 } 
;__p+='">\n      ';
 if (_.isObject(bill.bill_primary)) { 
;__p+='\n        <div class="primary-bill ';
 if (_.isObject(bill.bill_companion)) { 
;__p+='with-companion';
 } 
;__p+='">\n          <div class="primary-bill-inner clear-block">\n            '+
( templates.osbill({
              title: 'Primary Bill',
              bill: bill.bill_primary.toJSON(),
              templates: templates
            }) )+
'\n          </div>\n        </div>\n      ';
 } 
;__p+='\n      \n      ';
 if (_.isObject(bill.bill_companion)) { 
;__p+='\n        <div class="companion-bill">\n          <div class="companion-bill-inner clear-block">\n            '+
( templates.osbill({
              title: 'Companion Bill',
              bill: bill.bill_companion.toJSON(),
              templates: templates
            }) )+
'\n          </div>\n        </div>\n      ';
 } 
;__p+='\n    </div>\n  </div>\n</div>';
}
return __p;
};

this["LT"]["templates"]["js/app/templates/template-error.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<div class="error-container">\n  <div class="error"><span>There was an error.</span></div>\n</div>';
}
return __p;
};

this["LT"]["templates"]["js/app/templates/template-legislator.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='\n<div class="legislator">\n  ';
 if (LT.options.legImageProxy) { 
;__p+='\n    <img src="'+
( LT.options.legImageProxy )+
''+
( encodeURI(photo_url) )+
'" />\n  ';
 } else { 
;__p+='\n    <img src="'+
( photo_url )+
'" />\n  ';
 } 
;__p+='\n  \n  <div class="legislator-info">\n    '+
( full_name )+
'<br />\n    ';
 if (typeof district != 'undefined') { 
;__p+='\n      District '+
( district )+
'\n    ';
 } 
;__p+='\n    ';
 if (typeof party != 'undefined') { 
;__p+='\n      ('+
( LT.utils.translate('partyAbbr', party) )+
') \n    ';
 } 
;__p+=' <br />\n    ';
 if (typeof chamber != 'undefined') { 
;__p+='\n      '+
( LT.utils.translate('chamber', chamber) )+
'\n    ';
 } 
;__p+='\n  </div>\n</div>';
}
return __p;
};

this["LT"]["templates"]["js/app/templates/template-loading.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<div class="loading-general-container">\n  <div class="loading-general"><span>Loading...</span></div>\n</div>';
}
return __p;
};

this["LT"]["templates"]["js/app/templates/template-osbill.html"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='';
 if (typeof detailed != 'undefined' && detailed)  { 
;__p+='\n  <div class="ls-header">\n    <a href="#/">All Categories</a>\n  </div>\n';
 } 
;__p+='\n\n<div class="osbill">\n  <h4>\n    ';
 if (typeof title != 'undefined') { 
;__p+='\n      '+
( title )+
' ('+
( bill.bill_id )+
')\n    ';
 } else { 
;__p+='\n      '+
( bill.bill_id )+
'\n    ';
 } 
;__p+='\n    <a class="permalink" title="Permanent link to bill" href="#/bill-detail/'+
( encodeURI(bill.bill_id) )+
'"></a>\n  </h4>\n  \n  ';
 if (typeof detailed != 'undefined' && detailed) { 
;__p+='\n    <p class="description">\n      '+
( bill.title )+
'\n    </p>\n  ';
 } 
;__p+='\n\n  <div class="sponsors primary-sponsors">\n    <h5>Primary sponsors</h5>\n    \n    <div class="clear-block">\n      ';
 for (var a in bill.sponsors) { 
;__p+='\n        ';
 if (bill.sponsors[a].type === 'primary') { 
;__p+='\n          <div class="sponsor" data-leg-id="'+
( bill.sponsors[a].leg_id )+
'" data-sponsor-type="'+
( bill.sponsors[a].type )+
'">\n            '+
( bill.sponsors[a].name )+
' ('+
( bill.sponsors[a].type )+
')\n          </div>\n        ';
 } 
;__p+='\n      ';
 } 
;__p+='\n    </div>\n  </div>\n  \n  <div class="actions">\n    <h5>Actions</h5>\n    \n    <div class="actions-inner">\n      ';
 for (var a in bill.actions) { 
;__p+='\n        <div>\n          '+
( bill.actions[a].date.format('MMM DD, YYYY') )+
': '+
( bill.actions[a].action )+
'\n          ('+
( LT.utils.translate('chamber', bill.actions[a].actor) )+
')\n        </div>\n      ';
 } 
;__p+='\n    </div>\n  </div>\n\n  ';
 if (bill.sponsors.length > 1) { 
;__p+='\n    <div class="sponsors co-sponsors clear-block">\n      <h5>Co-Sponsors</h5>\n      \n      <div class="co-sponsors-inner clear-block">\n        ';
 for (var a in bill.sponsors) { 
;__p+='\n          ';
 if (bill.sponsors[a].type !== 'primary') { 
;__p+='\n            <div class="sponsor" data-leg-id="'+
( bill.sponsors[a].leg_id )+
'" data-sponsor-type="'+
( bill.sponsors[a].type )+
'">\n              '+
( bill.sponsors[a].name )+
' ('+
( bill.sponsors[a].type )+
')\n            </div>\n          ';
 } 
;__p+='\n        ';
 } 
;__p+='\n      </div>\n    </div>\n  ';
 } 
;__p+='\n  \n  <div class="sources">\n    <h5>Full Text</h5>\n    ';
 for (var a in bill.sources) { 
;__p+='\n      <a href="'+
( bill.sources[a].url )+
'" target="_blank">Link to '+
( bill.bill_id )+
' on the Minnesota State Legislature site.</a> <br />\n    ';
 } 
;__p+='\n  </div>\n</div>';
}
return __p;
};
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
    },
    
    getActionDate: function(type) {
      return (this.get('action_dates')[type]) ? this.get('action_dates')[type] : false;
    },
    
    isSubstituted: function() {
      var sub = false;
    
      if (_.isBoolean(this.get('substitued'))) {
        sub = this.get('substitued');
      }
      else {
        sub = _.find(this.get('actions'), function(a) {
          return a.action.match(LT.options.regex.substituteMatch);
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
        if (thisModel.get(prop)) {
          defers.push(LT.utils.fetchModel(thisModel.get(prop)));
        }
      });
      $.when.apply($, defers)
        .done(function() {
          thisModel.parseMeta();
          callback();
        })
        .fail(error);
      return this;
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
    
    newestAction: function() {
      var newest_action;
      var p = this.get('bill_primary');
      var c = this.get('bill_companion');
      var co = this.get('bill_conference');
      
      if (_.isUndefined(this.get('newest_action')) && p.get('newest_action')) {
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
      
      this.set('actions', actions);
      this.set('bill_type', type);
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
        _.each(['bill_primary', 'bill_companion', 'bill_conference'], function(prop) {
          if (bill.get(prop)) {
            defers.push(LT.utils.fetchModel(bill.get(prop)));
          }
        });
      });
      
      $.when.apply($, defers)
        .done(function() {
          thisModel.get('bills').each(function(bill) {
            bill.parseMeta();
          });
          callback();
        })
        .fail(error);
      return this;
    }
  });

})(jQuery, window);
/**
 * Collections for Legislature Tracker
 */
 
(function($, w, undefined) {
 
  /**
   * Collection of categories.
   */
  LT.CategoriesCollection = Backbone.Collection.extend({
    model: LT.CategoryModel,
    
    comparator: function(cat) {
      return cat.get('title');
    }
  });
 
  /**
   * Collection of editorial (meta) bills.
   */
  LT.BillsCollection = Backbone.Collection.extend({
    model: LT.BillModel,
    
    comparator: function(b) {
      var compare = (b.newestAction()) ? b.newestAction().date.unix() * -1 :
        b.get('title');
      return compare;
    }
  });
  
  /**
   * Collection of Open States bills.
   */
  LT.OSBillsCollection = Backbone.Collection.extend({
    model: LT.OSBillModel,
    
    comparator: function(bill) {
      var last_action = bill.get('newest_action');
      
      if (last_action) {
        last_action = last_action.date.unix() * -1;
      }
      return last_action;
    }
  });

})(jQuery, window);
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
      LT.utils.getTemplate('template-error', this.templates, 'error');
      LT.utils.getTemplate('template-ebill', this.templates, 'ebill');
      LT.utils.getTemplate('template-osbill', this.templates, 'osbill');
      LT.utils.getTemplate('template-category', this.templates, 'category');
      LT.utils.getTemplate('template-categories', this.templates, 'categories');
      
      // Bind all
      _.bindAll(this);
    },
    
    events: {
      'click .bill-expand': 'expandBill',
      'click .expand-other-bills': 'expandOtherBills'
    },
  
    loading: function() {
      // The first (and second) load, we don't actually 
      // want to force the scroll
      if (this.initialLoad === true) {
        this.resetScrollView();
      }
      else {
        this.initialLoad = (_.isUndefined(this.initialLoad)) ? false : true;
      }
      this.$el.html(this.templates.loading({}));
      return this;
    },
    
    error: function(e) {
      this.$el.html(this.templates.error({ error: e }));
      return this;
    },
    
    renderCategories: function() {
      this.$el.html(this.templates.categories({
        categories: LT.app.categories.toJSON(),
        options: LT.options
      }));
    },
    
    renderCategory: function(category) {
      var thisView = this;
      var data;
      
      if (!_.isObject(category)) {
        category = LT.app.categories.get(category);
      }
      category.get('bills').sort();
      
      this.$el.html(this.templates.category({
        category: category.toJSON(),
        templates: this.templates
      }));
      this.getLegislators();
    },
    
    renderEBill: function(bill) {
      if (!_.isObject(bill)) {
        bill = this.router.bills.get(bill);
      }
      bill.newestAction();
      
      this.$el.html(this.templates.ebill({
        bill: bill.toJSON(),
        expandable: false,
        templates: this.templates
      }));
      this.getLegislators().addTooltips().checkOverflows();
    },
    
    renderOSBill: function(bill) {
      this.$el.html(this.templates.osbill({
        bill: bill.toJSON(),
        detailed: true,
        templates: this.templates
      }));
      this.getLegislators().addTooltips().checkOverflows();
    },
    
    expandBill: function(e) {
      e.preventDefault();
      var $this = $(e.target);
      var text = [ 'More details', 'Less details' ];
      var current = $this.text();
      
      $this.text((current === text[0]) ? text[1] : text[0]);
      $this.parent().parent().toggleClass('expanded').find('.bill-bottom').slideToggle();
      
      this.checkOverflows();
      return this;
    },
    
    expandOtherBills: function(e) {
      e.preventDefault();
      var $this = $(e.target);
      var text = [ 'Show other bills', 'Hide other bills' ];
      var current = $this.text();
      
      $this.text((current === text[0]) ? text[1] : text[0]);
      $this.parent().find('.has-conference-bill').toggleClass('showing').slideToggle();
      
      this.checkOverflows();
      return this;
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
      return this;
    },
    
    addTooltips: function() {
      this.$el.find('.bill-progress .bill-progress-section.completed').qtip({
        style: {
          classes: 'qtip-shadow qtip-light'
        },
        position: {
          my: 'bottom center',
          at: 'top center'
        }
      });
      return this;
    },
    
    checkOverflows: function() {
      this.$el.find('.actions-inner, .co-sponsors-inner').each(function() {
        if ($(this).hasScrollBar()) {
          $(this).addClass('overflowed');
        }
      });
      return this;
    },
    
    resetScrollView: function() {
      $('html, body').animate({ scrollTop: this.$el.offset().top - 15 }, 1000);
      return this;
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
/**
 * Main application container for the Legislature Tracker
 *
 * An 'e' prefix is referring to editorialized content.
 */
(function($, w, undefined) {

  LT.Application = Backbone.Router.extend({
    routes: {
      'categories': 'routeCategories',
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
      this.tabletop = Tabletop.init({
        key: LT.options.eKey,
        callback: this.loadEBills,
        callbackContext: this,
        wanted: LT.options.sheetsWanted
      });
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
      var recentDate = moment().subtract('days', parseInt(LT.options.recentChangeThreshold, 10));
      var recentInt = parseInt(recentDate.format('YYYYMMDD'), 10);
      var recentUpdated = 0;
      var recentCreated = 0;
      
      _.each(billCountData, function(stat) {
        if (stat.stat === 'total-bills') {
          thisRouter.totalBills = parseInt(stat.value, 10);
        }
        if (stat.stat.indexOf('updated') !== -1) {
          recentUpdated += (stat.int >= recentInt) ? parseInt(stat.value, 10) : 0;
        }
        if (stat.stat.indexOf('created') !== -1) {
          recentCreated += (stat.int >= recentInt) ? parseInt(stat.value, 10) : 0;
        }
      });
      this.recentUpdated = recentUpdated;
      this.recentCreated = recentCreated;
      
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
      // If we are viewing the categories, we want to get
      // some basic data about the bills from Open States
      // but not ALL the data.  We can use the bill search
      // to do this.
      this.mainView.loading();
      this.getOSBasicBills(this.mainView.renderCategories, this.error);
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
    
    // eBill route
    routeEBill: function(bill) {
      var thisRouter = this;
      
      bill = decodeURI(bill);
      bill = this.bills.where({ bill: bill })[0];
      
      this.mainView.loading();
      bill.loadOSBills(function() {
        thisRouter.mainView.renderEBill(bill);
      }, thisRouter.error);
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