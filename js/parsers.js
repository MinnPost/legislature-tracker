/**
 * Parsing out data from spreadsheet.
 *
 * Collection of functions for parsing
 */
LT.parse = LT.parse || {};
LT.parse.eData = function(tabletop) {
  var parsed = {};

  parsed.categories = LT.parse.eCategories(tabletop.sheets('Categories').all());
  var eBills = tabletop.sheets('Bills').all();

  // Handle max bills
  if (eBills.length > LT.options.maxBills) {
    LT.log('The number of bills in your spreadsheet exceeds maxBills. Set the maxBills option to display them, but be aware that this may significantly slow down the Legislature Tracker.');
  }

  parsed.bills = LT.parse.eBills(eBills.slice(0, LT.options.maxBills));
  parsed.events = LT.parse.eEvents(tabletop.sheets('Events').all());

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

LT.parse.validateBillNumber = function(bill_num){
  return LT.options.billNumberFormat.test(bill_num);
};

LT.parse.eBills = function(bills) {
  return _.map(bills, function(row) {
    LT.parse.translateFields(LT.options.fieldTranslations.eBills, row);
    row.links = LT.parse.eLinks(row.links);

    // Break up categories into an array
    row.categories = (row.categories) ? row.categories.split(',') : [];
    row.categories = _.map(row.categories, _.trim);

    // Create open states bill objects and check that they are in the correct
    // format, otherwise we will get a bad response from the API
    // call which will cause a bunch of failures.
    row.bill_primary = undefined;
    if (row.bill && LT.parse.validateBillNumber(row.bill)) {
      row.bill_primary = LT.utils.getModel('OSBillModel', 'bill_id', { bill_id: _.trim(row.bill) });
    }
    else if (row.bill && !LT.parse.validateBillNumber(row.bill)) {
      LT.log('Invalid primary bill number "' + row.bill + '" for row ' + row.rowNumber + ', see documentation.');
    }

    if (row.bill_companion && LT.parse.validateBillNumber(row.bill_companion)) {
      row.bill_companion = LT.utils.getModel('OSBillModel', 'bill_id', { bill_id: _.trim(row.bill_companion) });
    }
    else if (row.bill_companion && !LT.parse.validateBillNumber(row.bill_companion)) {
      LT.log('Invalid companion bill number "' + row.bill_companion + '" for row ' + row.rowNumber + ', see documentation.');
    }

    if (row.bill_conference && LT.parse.validateBillNumber(row.bill_conference)) {
      row.bill_conference = LT.utils.getModel('OSBillModel', 'bill_id', { bill_id: _.trim(row.bill_conference) });
    }
    else if (row.bill_conference && !LT.parse.validateBillNumber(row.bill_conference)) {
      LT.log('Invalid conference bill number "' + row.bill_conference + '" for row ' + row.rowNumber + ', see documentation.');
    }

    // Check if there is a bill provided.  It is alright if there is
    // no bill provided as some legislatures don't produce
    // bill IDs until late in the process
    row.hasBill = true;
    if (!row.bill || row.bill_primary === undefined) {
      row.hasBill = false;

      // We still want to make a bill ID for linking purposes
      row.bill = _.cssClass(row.title.toLowerCase());
    }

    return row;
  });
};

LT.parse.eCategories = function(categories) {
  return _.map(categories, function(row) {
    LT.parse.translateFields(LT.options.fieldTranslations.eCategories, row);
    row.links = LT.parse.eLinks(row.links);
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

// Looks at text and tries to find a bill, used for
// getting the companion bill automatically
LT.parse.detectCompanionBill = function(companionText) {
  var parsed, bill;

  // Handle function or handle regex
  if (_.isFunction(LT.options.detectCompanionBill)) {
    parsed = LT.options.detectCompanionBill(companionText);
    bill = LT.parse.validateBillNumber(parsed) ? parsed : undefined;
  }
  else if (_.isRegExp(LT.options.detectCompanionBill)) {
    parsed = LT.options.detectCompanionBill.exec(companionText);
    bill = (parsed && LT.parse.validateBillNumber(parsed[1])) ? parsed[1] : undefined;
  }

  return _.trim(bill);
};

// Handle changing field names
LT.parse.translateFields = function(translation, row) {
  _.each(translation, function(input, output) {
    row[output] = row[input];

    if (output !== input) {
      delete row[input];
    }
  });

  return row;
};