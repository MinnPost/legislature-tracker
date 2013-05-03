# Legislature Tracker

An application to keep track of what is going on in a state legislature.  Using editorial expertise and the Sunlight Lab's Open States API, this application creates a curated view of what is going on in a state's legislature session.

It combines data from [Open States](http://openstates.org/) and editorial data collected with [Google Docs](https://docs.google.com/).  You can see some examples at [minnpost.github.io/legislature-tracker](http://minnpost.github.io/legislature-tracker/) and see it in production on [MinnPost](http://www.minnpost.com/data/2013/04/minnesota-legislative-bill-tracker).

## Installation and configuration

This is a frontend application.  Include the corresponding JS and CSS in your HTML page, then call the following in your JS (see options below);

```
var app = new LT.Application(options);
```

See ```examples/*``` for good examples of how to use the application.

### Options

When creating a new Legislature Tracker object, you can set the following options.  All default options are in ```js/app/core.js```.

#### Required options

The following are required for the application to work correctly

* ```el```: The element selector that will hold the application.
* ```state```: The two character state code as used by Open States.
* ```session```: The session key as used on Open States, like ```'2013-2014'```.
* ```OSKey```: Your Open States API Key.  You can get one at [services.sunlightlabs.com](http://services.sunlightlabs.com/).
* ```eKey```: Your Google Spreadsheet identifier. Be sure to publish your spreadsheet (File -> Publish to the web) to make it available via the Google Spreadsheet API.

#### Common options

The following are common options you may want to override.

* ```conferenceBill```: This should be ```true``` or ```false``` to enable the handling of conference bills.  A conference bill is a third bill (other than the primary or companion) that is used often when the two bills are diverging significantly.
* ```substituteMatch```: Some legislatures will substitute the companion bill, meaning it gets dropped and the primary bill is only used.  This option sets the regular expression to match actions to determine if it substituted.  Define as ```false``` to turn off completely.
* ```recentImage```: The name of the image file to use for the recent category.  Make blank to not have an image for the recent category.
* ```recentChangeThreshold```: The number of days to determine if a bill will be put in the recent category.  The default is ```7``` days.
* ```imagePath```:  The place to find images.  This path is simply prepended to images and should have a trailing slash.  For instance ```'https://example.com/images/'```, or ```'./images/'```.  To customize images, the ideal is to copy the images found in ```css/images/``` to your new directory and add or replace images as needed.
* ```templatePath```:  The place to find templates.  This is only really needed if you are not using the built version.
* ```detectCompanionBill```: A function or a regular expression to parse OpenStates' companion bill IDs into a bill number for automatically pairing bills with their companions in the other chamber. For regex, it will use the first match group.  The default regex, ```/([A-Z]+ [1-9][0-9]*)$/```, will find valid bills at the end of the string.  If false, Legislature Tracker will not attempt to find companion bills.

#### Hook options

These are functions that are called during processing to allow for you to override data and other functionality.  Do note that if you alter certain data, you may break things.

* ```osBillParse```: A function that is called when parsing open states bill.  The single argument is a OS Bill Model.

#### Translation options

To override the naming of certain things, you can update the the translations config object.  To do this without overwriting or completely redefining the translation object, you should get the default options first, like so:

    var options = _(LT.defaultOptions).extend({
      el: '#legislature-tracker-container',
      state: 'NY', 
      session: '2013-2014',
      OSKey: 'abc',
      eKey: 'abc'
    });
    options['wordTranslations']['chamber']['lower'] = 'Assembly';

The default options are similar to:

    chamber: {
      'upper': 'Senate',
      'lower': 'House'
    },
    partyAbbr: {
      'Democratic-Farmer-Labor': 'DFL',
      'Democratic': 'D',
      'Republican': 'R'
    }

#### Advanced options

These options are set the same as basic options, but their default setting will work fine for most users. 

* ```chamberLabel```: When ```false```, the default, the label for the primary and companion bills will be Primary and Companion, respectively.  When set to ```true``` the labels will be based on the bill's chambers.
* ```legImageProxy```: If you want to proxy images from Open States, use an URL prefix, like ```'http://proxy.com/?url='```.  For instance MinnPost made [this custom proxy](https://github.com/MinnPost/i-mage-proxerific).
* ```maxBills```: By default, ```30```; the maximum number of bills that will be loaded from your Google Spreadsheet. Since each bill requires a call to OpenStates, your app may become slow if you raise this (especially on slow connections and/or older browsers).
* ```scrollOffset```: This turns on auto scrolling which will scroll the view window to the top of the application after the first click.  This is helpful if it is embedded in larger content or if there are long categories.  This will be an integer of pixels to offset where the top; for instance ```15``` equals 15 pixels above the application.
* ```tabletopOptions```: An object to override any of the [Tabletop.js](https://github.com/jsoma/tabletop) options.
* ```aggregateURL```: An API JSON feed to get some aggregate bill counts.  This is specific to MinnPost (MN) and is NOT fully supported at the moment.
* ```billNumberFormat```: A regex for detecting if a bill number is valid for your state. The default, `/[A-Z]+ [1-9][0-9]*/` works well for most states, matching bill numbers like `H 1234`, `S 1234` or `SB 1234`.

### Google spreadsheets setup

See [this spreadsheet for an example](https://docs.google.com/a/minnpost.com/spreadsheet/ccc?key=0AtX8MXQ89fOKdFNaY1Nzc3p6MjJQdll1VEZwSDkzWEE#gid=1).  There are options to change the column name mapping, but this is not well supported yet.

First make sure you have 3 sheets with the following columns:

* ```Categories```
    * ```category_id```: the identifier that will be used in URL linking.  Should be something like ```social_issues```.
    * ```title```: The text title.
    * ```short_title```: Used for the top menu list.  If none is given, the first word from the category title will be used.
    * ```description```: The full description.
    * ```links```: Links field, see below.
    * ```image```: Name of image for the category.  By default, these pull from the images directory, which is configurable in the ```imagePath``` option.  Or if you use a full URL, starting with ```http``` it will use that directly.
* ```Bills```
    * ```bill```: The primary bill name, like ```SF 789```.  This should be formatted like ```A 1234``` with a space between the letter/chamber-appreviation and the number which should have no leading zeros.
    * ```companion_bill```
    * ```conference_bill```
    * ```categories```: Category IDs separated by commas.
    * ```title```
    * ```description```: Descriptions get split up when in the category list view and have a "more details" link.  By default, this is based on the number of words.  To handle longer texts with HTML, you can use ```<!-- break -->``` to define that break point.  Also note that is no description is given, then the application will use the primary bill summary which may or may not be useful and significant.
    * ```links```: Links field, see below.
* ```Events```: Events are custom events like the stalling of a bill or committee that would otherwise not show up in the data from Open States.  This shows up as part of the overall bill information below the description.
    * ```bill```: The primary bill ID.
    * ```date```: A date in a format like ```'YYYY-MM-DD'```
    * ```chamber```: This should be ```upper``` or ```lower```.
    * ```title```: A title for the event.
    * ```description```: A short description for the event.
    * ```links```: Any links associated with the event.

#### Link field formatting

There are a few fields that are a list of links.  You should use this format so that they are parsed correctly.  Do note that the parser is pretty rudimentary so don't expect much.

    "Link text title|http://www.example.com/123", "Another link text title|http://www.example.com/154"

### Overriding templates

You can override the HTML templates that are used in the application and thus change any of the wording or outputs.  Templates are using the [Backbone](http://backbonejs.org/) template system.  You can see the current templates in the ```js/app/templates/``` directory.  The compiled templates are stored in the ```LT.templates``` object.  You can override them with something like the following:

    LT.templates = LT.templates || {};
    LT.templates['js/app/templates/template-header.html'] = _.template($('#new-template').html());

## How does your legislature work?

The Open States data is very good structured data about bills, but it is basic data that does not account for the subtleties of how legislatures work.

The Legislature tracker tries to take these subtleties into account, but may not be good enough for your legislature.  Please open an issue in the queue to discuss how to address other use cases.  This is currently handling the following:

* Companion bills can be manually designated, or if not provided, the system will try to read the Open States companion bill that is designated.
* When both primary and companion bills pass, but there are difference to reconcile, there is often a conference bill.
* Sometimes a companion bill will get substituted, meaning it gets dropped and the primary bill is only used.
* Some legislatures will not assign a bill right away even though it is known that it is being discussed.  If there is no primary bill provided, a bill will be "stubbed" out in the interface.


## Building

Built versions will only be regularly committed for tagged releases.

1. Uses [grunt](http://gruntjs.com/) which depends on [Node](http://nodejs.org/).  To install: ```npm install -g grunt-cli && npm install```
1. (for specific version) Update version in: ```package.json```
1. Run: ```grunt```
1. (for specific version) Tag release with appropriate version: ```git tag 0.1.1```

## Deploying

There are a couple general deploy methods that will transfer the dist folder somewhere.  Run these after running ```grunt```.

### S3

For authentication, make sure to set environment variables ```AWS_ACCESS_KEY_ID``` and ```AWS_SECRET_ACCESS_KEY```.  You can set these ad-hoc with the following commands:

    export AWS_ACCESS_KEY_ID=<YOUR KEY ID>
    export AWS_SECRET_ACCESS_KEY=<YOUR KEY>

Then run the following with the appropriate values filled in to upload files to S3.  The trailing slash on the ```s3dir``` is needed.

    grunt deploy-s3 --s3bucket="our_bucket" --s3dir="path/to/dest/"

### FTP

For authentication, you need to create a JSON file named ```.ftppass``` that will have the username and password in it.  See [grunt-ftp-deploy](https://github.com/zonak/grunt-ftp-deploy) for reference.

    {
      "leg-tracker-key": {
        "username": "username1",
        "password": "password1"
      }
    }

Then run the following with the appropriate values filled in to upload files to the FTP server.  The port argument is optional and defaults to ```21```.

    grunt deploy-ftp --ftpserver="example.com" --ftpdir="projects/leg-tracker/" --ftpport=21
    
### SFTP

Same as FTP deploying.  Checkout the [grunt-sftp-deploy](https://github.com/thrashr888/grunt-sftp-deploy) for intricacies.  Example:

    grunt deploy-sftp --ftpserver="example.com" --ftpdir="/path/to/dest/" --ftpport=22

## Architecture

The basic idea of the application is pulling together editorial knowledge about bills and combining it with Open States data about the bills to create a focused and useful interface to keep track of the important activities of a legislature session.

```OS``` prefixes refer to Open States data, while ```E``` or ```e``` prefixes refer to editorial data and objects.

Each editorial (or meta) bill refers to one or more Open States (or actual) bill.

### Cross-browser compatibility

The goal of this project is to be compatible with all major modern browsers including IE8.  The application should work fine in IE7, but it may be a bit slow.

### Frameworks and libraries

This applications uses Tableop.js, jQuery, jQuery.jsonp, Underscore, Backbone, Moment.js, es5-shim.

### Caching

To ensure that both memory and network usage is minimized, there is some basic caching happening.

For model instances, we wrap the creation of models in the following method:

    LT.utils.getModel('ModelName', 'identifying_attribute', attributes)
    
For fetching models, specifically Open States data, we wrap fetching:

    $.when(LT.utils.fetchModel(model)).then(
      successFunction,
      errorFunction
    );

#### Google Spreadsheets

This application uses [Tabletop.js](https://github.com/jsoma/tabletop) to read in data from Google Spreadsheets.  Due to the fact that Google does not guarantee up time or ability to handle requests, it is good practice to cache the outputs for production.  Tabletop has some recent additions to handle proxy via saving the outputs to a place like S3, as well as more traditional proxy like [gs-proxy](https://github.com/MinnPost/gs-proxy).  Use the ```tabletopOptions``` option to set any of the [tabletop options](https://github.com/jsoma/tabletop#the-moving-parts).

### Data Models

There are currently models for each Open States object.  This aids in easily filling in the data when needed.

The editorial categories contain editorial bills (like meta bills), which refer to one or more actual, Open States bills.

### Hacks

Currently, Tabletop.js extends Array so that indexOf is available.  This has some implications in browsers, especially in the context of for..in loops.  Because of bad code may be in your site that is not easily updatable, we are using a [custom version of Tabletop.js](https://github.com/zzolo/tabletop).  See [pull request](https://github.com/jsoma/tabletop/pull/15).

## Attribution

* Some icons provided by [The Noun Project](http://thenounproject.com/).  Congress by Martha Ormiston; Energy by NDSTR; GayMarriage by MaurizioFusillo; Education by Thibault Geffroy; Time by Richard de Vos; Capital by Jonathan Keating; Paper by Tom Schott; Bank by Ilaria Baggio; Group by Alexandra Coscovelnita; Check mark by Spencer Cohen; Back by John Chapman.