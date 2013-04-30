# Legislature Tracker

An application to keep track of what is going on in a state legislature.  Using editorial expertise and the Sunlight Lab's Open States API, this application aims to create a curated view of what is going on in a state's legislature session.

It combines data from [Open States](http://openstates.org/) and editorial data collected in with [Google Docs](https://docs.google.com/).

Currently in action at [MinnPost](http://www.minnpost.com/data/2013/04/minnesota-legislative-bill-tracker).

## Install

This is a frontend application.  Include the corresponding JS and CSS in your HTML page, then call the following in your JS (see options below);

```
var app = new LT.Application(options);
```

See ```index.html``` for a basic example using the 2013-2014 MN Legislature.

### Options

When creating a new Legislature Tracker object, you can set the following options.  All default options are in ```js/app/core.js```.

* ```el```: The element selector that will hold the application.
* ```state```: The two character state code as used by Open States.
* ```session```: The session key as used on Open States, like ```2013-2014```.
* ```OSKey```: Your Open States API Key.
* ```eKey```: Your Google Spreadsheet identifier. Be sure to publish your spreadsheet (File -> Publish to the web) to make it available via the Google Spreadsheet API.
* ```conferenceBill```: This should be ```true``` or ```false``` to enable the handling of conference bills.  A conference bill is a third bill (other than the primary or companion) that is used often when the two bills are diverging significantly.
* ```scrollOffset```: This turns on auto scrolling which will scroll the view window to the top of the application after the first click.  This is helpful if it is embedded in larger content or if there are long categories.  This will be an integer of pixels to offset where the top; for instance ```15``` equals 15 pixels above the application.
* ```imagePath```:  'https://s3.amazonaws.com/data.minnpost/projects/legislature-tracker/images/',
* ```legImageProxy```: If you want to proxy images from Open States, but in the URL prefix, like ```http://proxy.com/?url=```.  For instance we [this custom proxy](https://github.com/MinnPost/i-mage-proxerific).
* ```aggregateURL```: An API JSON feed to get some aggregate bill counts.  This is specific to MinnPost (MN).
* ```tabletopOptions```: An object to override any of the [Tabletop.js](https://github.com/jsoma/tabletop) options.

### Google spreadsheets setup

See [this spreadsheet for an example](https://docs.google.com/a/minnpost.com/spreadsheet/ccc?key=0AtX8MXQ89fOKdFNaY1Nzc3p6MjJQdll1VEZwSDkzWEE#gid=1).  There are options to change the column name mapping, but this is not well supported yet.

First make sure you have 3 sheets with the following columns:

* ```Categories```
    * ```category_id```: the identifier that will be used in URL linking.  Should be something like ```social_issues```.
    * ```title```: The text title.
    * ```short_title```: Used for the top menu list.  If none is given, the first word from the category title will be used.
    * ```description```: The full description.
    * ```links```: Links field, see below.
    * ```image```: Name of image for the category.  By default, these pull from the images directory, which is configurable in the ```imagePath``` option.
* ```Bills```
    * ```bill```: The primary bill name, like ```SF 789```.  This should be formatted like ```A 1234``` with a space between the letter/chamber-appreviation and the number which should have no leading zeros.
    * ```companion_bill```
    * ```conference_bill```
    * ```categories```: Category IDs separated by commas.
    * ```title```
    * ```description```: Descriptions get split up when in the category list view and have a "more details" link.  By default, this is based on the number of words.  To handle longer texts with HTML, you can use ```<!-- break -->``` to define that break point.  Also note that is no description is given, then the application will use the primary bill summary which may or may not be useful and significant.
    * ```links```: Links field, see below.
* ```Events``` (this is not fully supported yet)

#### Link field formatting

There are a few fields that are a list of links.  You should use this format so that they are parsed correctly.  Do note that the parser is pretty rudimentary so don't expect much.

```
"Link text title|http://www.example.com/123", "Another link text title|http://www.example.com/154"
``` 

### How does your legislature work?

The Open States data is very good structured data about bills, but it is basic data that does not account for the subtleties of how legislatures work.

Currently, this application is based on how the Minnesota State Legislature works.  This means there are certain assumptions, such as the following:

* Companion bills are manually designated.
* When both primary and companion bills pass, but there are difference to reconcile, there is often a conference bill.
* Sometimes a companion bill will get substituted, meaning it gets dropped and the primary bill is only used.
* The legislature may actually re-use a bill number for difference bills.  In the MN Leg, this is marked as an action with "substitued" in it.


## Building

Built versions will only be done for tagged releases.

1. Uses [grunt](http://gruntjs.com/).  To install: ```npm install```
1. Update version in: ```package.json```
1. Run: ```grunt```
1. Tag release: ```git tag 0.1.1```

## Deploying

This is specific to MinnPost, but could easily be changed if needed.

1. Uploads dist to S3: ```grunt mp-deploy```

## Architecture

The basic idea of the application is pulling together editorial knowledge about bills and combining it with Open States data about the bills to create a focused and useful interface to keep track of the important activities of a legislature session.

```OS``` prefixes refer to Open States data, while ```E``` or ```e``` prefixes refer to editorial data and objects.

Each editorial (or meta) bill refers to one or more Open States (or actual) bill.

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

* Icons provided by <a href="http://thenounproject.com/" target="_blank">The Noun Project</a>.  Congress by Martha Ormiston; Energy by NDSTR; GayMarriage by MaurizioFusillo; Education by Thibault Geffroy; Time by Richard de Vos; Capital by Jonathan Keating; Paper by Tom Schott; Bank by Ilaria Baggio; Group by Alexandra Coscovelnita; Check mark by Spencer Cohen; Back by John Chapman.