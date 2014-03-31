/**
 * Basic parsing out from the spreadsheet data.
 */
LT.parsers = LT.parsers || {};

// Wrapper around console.log
LT.log = function(message) {
  if (_.isObject(console) && _.isFunction(console.log)) {
    console.log(message);
  }
};

// Main parser
LT.parsers.eData = function(tabletop, options) {
  var parsed = {};
  var eBills = tabletop.sheets('Bills').all();

  // Handle max bills
  if (eBills.length > options.maxBills) {
    LT.log('The number of bills in your spreadsheet exceeds maxBills. Set the maxBills option to display them, but be aware that this may significantly slow down the Legislature Tracker.');
  }

  // Parse bills, categories, and events
  parsed.categories = LT.parsers.eCategories(tabletop.sheets('Categories').all(), options);
  parsed.bills = LT.parsers.eBills(eBills.slice(0, options.maxBills), options);
  parsed.events = LT.parsers.eEvents(tabletop.sheets('Events').all(), options);

  // Add events into bills
  _.each(_.groupBy(parsed.events, 'bill_id'), function(e, b) {
    _.each(parsed.bills, function(bill, i) {
      if (bill.bill === b) {
        parsed.bills[i].custom_events = e;
      }
    });
  });

  return parsed;
};

// Validate a bill number
LT.parsers.validateBillNumber = function(billN, options) {
  return options.billNumberFormat.test(billN);
};

// Parse eBill data
LT.parsers.eBills = function(bills, options) {
  return _.map(bills, function(row) {
    LT.parsers.translateFields(options.fieldTranslations.eBills, row);
    row.links = LT.parsers.eLinks(row.links);

    // Back id
    row.id = row.id || _.cssClass(row.bill) + _.cssClass(row.title);

    // Break up categories into an array
    row.categories = (row.categories) ? row.categories.split(',') : [];
    row.categories = _.map(row.categories, _.trim);

    // Ensure bill id is in right form, otherwise we will get a
    // bad response from the API call which will cause a
    // bunch of failures.
    row.bill_primary = _.trim(row.bill);
    if (row.bill && !LT.parsers.validateBillNumber(row.bill, options)) {
      LT.log('Invalid primary bill number "' + row.bill + '" for row ' + row.rowNumber + ', see documentation.');
    }

    row.bill_companion = _.trim(row.bill_companion);
    if (row.bill_companion && !LT.parsers.validateBillNumber(row.bill_companion, options)) {
      LT.log('Invalid companion bill number "' + row.bill_companion + '" for row ' + row.rowNumber + ', see documentation.');
    }

    row.bill_conference = _.trim(row.bill_conference);
    if (row.bill_conference && !LT.parsers.validateBillNumber(row.bill_conference, options)) {
      LT.log('Invalid conference bill number "' + row.bill_conference + '" for row ' + row.rowNumber + ', see documentation.');
    }

    // Check if there is a bill provided.  It is alright if there is
    // no bill provided as some legislatures don't produce
    // bill IDs until late in the process
    row.hasBill = true;
    if (!row.bill || !row.bill_primary) {
      row.hasBill = false;

      // We still want to make a bill ID for linking purposes
      row.bill = _.cssClass(row.title.toLowerCase());
    }

    return row;
  });
};

LT.parsers.eCategories = function(categories, options) {
  return _.map(categories, function(row) {
    LT.parsers.translateFields(options.fieldTranslations.eCategories, row);
    row.links = LT.parsers.eLinks(row.links);
    return row;
  });
};

LT.parsers.eEvents = function(events, options) {
  return _.map(events, function(row) {
    LT.parsers.translateFields(options.fieldTranslations.eEvents, row);
    row.links = LT.parsers.eLinks(row.links);
    row.date = moment(row.date);

    // Add some things to fit format of Open States actions
    row.type = ['custom'];
    return row;
  });
};

// "Title to link|http://minnpost.com", "Another link|http://minnpost.com"
LT.parsers.eLinks = function(link) {
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
LT.parsers.csvCategories = function(category) {
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

// Looks at text and tries to find a bill, used for
// getting the companion bill automatically
LT.parsers.detectCompanionBill = function(companionText, options) {
  var parsed, bill;

  // Handle function or handle regex
  if (_.isFunction(options.detectCompanionBill)) {
    parsed = options.detectCompanionBill(companionText);
    bill = LT.parsers.validateBillNumber(parsed, options) ?
      parsed : undefined;
  }
  else if (_.isRegExp(options.detectCompanionBill)) {
    parsed = options.detectCompanionBill.exec(companionText);
    bill = (parsed && LT.parsers.validateBillNumber(parsed[1], options)) ?
      parsed[1] : undefined;
  }

  return _.trim(bill);
};

// Handle changing field names
LT.parsers.translateFields = function(translation, row) {
  _.each(translation, function(input, output) {
    row[output] = row[input];

    if (output !== input) {
      delete row[input];
    }
  });

  return row;
};
