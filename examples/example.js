/**
 * JS for examples
 */
(function($, w, undefined) {
  function parseQueryString() {
    var assoc  = {};
    var decode = function(s) {
      return decodeURIComponent(s.replace(/\+/g, " "));
    };
    var queryString = location.search.substring(1);
    var keyValues = queryString.split('&');

    for(var i in keyValues) {
      var key = keyValues[i].split('=');
      if (key.length > 1) {
        assoc[decode(key[0])] = decode(key[1]);
      }
    }

    return assoc;
  }
  var queryParts = parseQueryString();
  var options, title, app;

  // Make some default, default options
  options = $.extend(true, {}, LT.defaultOptions, {
    el: '#legislature-tracker-container',
    tabletopOptions: {
      paramterize: 'http://gs-proxy.herokuapp.com/proxy?url='
    }
  });

  // Show example based on query string example=BLAH
  if (queryParts['example'] === 'NY') {
    title = '2013 NY Legislature Tracker';
    options = $.extend(true, {}, options, {
      state: 'NY',
      session: '2013-2014',
      OSKey: '49c5c72c157d4b37892ddb52c63d06be',
      eKey: '0AgIwhjKwGPrydGs3b0taR2JTeGkyZ01kbE9rRVVBM2c',
      imagePath: './images/',
      templatePath: '../js/app/templates/',
      chamberLabel: true,
      wordTranslations: {
        chamber: {
          lower: 'Assembly'
        }
      }
    });
  }
  else if (queryParts['example'] === 'MI') {
    title = '2014 MI Legislature Tracker';
    options = $.extend(true, {}, options, {
      state: 'MO',
      session: '2014',
      OSKey: '7b006c11c5dd40ba89efc4e67901a0ce',
      eKey: '0AirWnBDqOSL_dGZ6RVRtVTRuOGxLS05ZMXQwVlMxdGc',
      templatePath: '../js/app/templates/',
      imagePath: './images/',
      maxBills: 80
    });
  }
  else if (queryParts['example'] === 'FL') {
    title = '2013 FL Legislature Tracker';
    options = $.extend(true, {}, options, {
      state: 'FL',
      session: '2013',
      OSKey: '49c5c72c157d4b37892ddb52c63d06be',
      eKey: '0Arwg_542_duwdG9BVGhWZlBUbVhrbE9SYW9xTGpzX0E',
      imagePath: './images/',
      templatePath: '../js/app/templates/',
      wordTranslations: {
        chamber: {
          lower: 'Assembly'
        }
      }
    });
  }
  else if (queryParts['example'] === 'EDGE') {
    title = 'Some edge cases and option examples';
    options = $.extend(true, {}, options, {
      state: 'NY',
      session: '2013-2014',
      OSKey: '49c5c72c157d4b37892ddb52c63d06be',
      eKey: '0AjYft7IGrHzNdENILV9DU056SkxNQ2tIaHNGMnRlZUE',
      imagePath: '../css/images/',
      templatePath: '../js/app/templates/',
      chamberLabel: true,
      osBillParse: function(osBill) {
        osBill.set('sources', _.map(osBill.get('sources'), function(s, i) {
          s.text = 'SOURCE [' + i + ']';
          return s;
        }));
      },
      wordTranslations: {
        chamber: {
          lower: 'Assembly'
        }
      }
    });

    // Since Tabletop removes underscores on field names, we could update
    // the translation options for our custom field (and then update the template)
    //options['fieldTranslations']['eBills']['custom_field'] = 'customfield';

    // Override bill template for custom field
    LT.templates = LT.templates || {};
    LT.templates['js/app/templates/template-ebill.html'] = _.template($('#custom-ebill-template').html());

  }
  else {
    // Show MN
    title = '2013 MN Legislature Tracker';
    options = $.extend(true, {}, options, {
      state: 'MN',
      session: '2013-2014',
      OSKey: '49c5c72c157d4b37892ddb52c63d06be',
      eKey: '0AtX8MXQ89fOKdFNaY1Nzc3p6MjJQdll1VEZwSDkzWEE',
      legImageProxy: 'http://i-mage-proxerific.herokuapp.com/resize?size=100x100&url=',
      imagePath: '../css/images/',
      templatePath: '../js/app/templates/'
    });
  }

  // Make application
  app = new LT.Application(options);

  // Chang page title
  $('.page-title').html(title);

})(jQuery, window);