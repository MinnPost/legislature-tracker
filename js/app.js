/**
 * Main Leg Tracker application
 */

// Default options
_.extend(LT.prototype, {
  defaultOptions: {
    sheetsWanted: ['Categories', 'Bills', 'Events'],
    fieldTranslations: {
      eCategories: {
        'id': 'categoryid',
        'short_title': 'shorttitle'
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
    maxBills: 30,
    substituteMatch: (/substituted/i),
    imagePath: './css/images/',
    templatePath: './js/app/templates/',
    recentChangeThreshold: 7,
    tabletopOptions: {},
    scrollOffset: false,
    conferenceBill: true,
    recentImage: 'RecentUpdatedBill.png',
    chamberLabel: false,
    detectCompanionBill: (/([A-Z]+ [1-9][0-9]*)$/),
    billNumberFormat: (/[A-Z]+ [1-9][0-9]*/),
    osBillParse: false
  },

  // Initializer
  initialize: function() {
    this.options = _.extend({}, this.defaultOptions, this.options);
    this.router = new this.MainRouter(this.options);
  }
});
