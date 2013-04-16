# Legislature Tracker

An application to keep track of what is going on in a state legislature.  Using editorial expertise and the Sunlight Lab's Open States API, this application aims to create a curated view of what is going on in a state's legislature session.

It combines data from [Open States](http://openstates.org/) and editorial data collected in with [Google Docs](https://docs.google.com/).

Currently in action at [MinnPost](http://www.minnpost.com/data/2013/04/minnesota-legislative-bill-tracker).

## Install

Currently, this application has specific parts to MinnPost, but the goal of the project is to make it easy for anyone else to use.  The best example right now is: ```example-minnpost.html```

### Options

When creating a new Legislature Tracker object, you can set the following options.  All available options and their defaults are in ```js/app/core.js```.

* ```el```: The element selector that will hold the application.
* ```state```: The two character state code as used by Open States.
* ```session```: The session key as used on Open States, like ```2013-2014```.
* ```OSKey```: Your Open States API Key.
* ```eKey```: Your Google Spreadsheet identifier.
* ```imagePath```:  'https://s3.amazonaws.com/data.minnpost/projects/legislature-tracker/images/',
* ```legImageProxy```: If you want to proxy images from Open States, but in the URL prefix, like ```http://proxy.com/?url=```.  For instance we [this custom proxy](https://github.com/MinnPost/i-mage-proxerific).
* ```aggregateURL```: An API JSON feed to get some aggregate bill counts.  This is specific to MinnPost (MN).
* ```tabletopOptions```: An object to override any of the [Tabletop.js](https://github.com/jsoma/tabletop) options.

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

This application uses [Tabletop.js](https://github.com/jsoma/tabletop) to read in data from Google Spreadsheets.  Due to the fact that Google does not guarantee up time or ability to handle requests, it is good practice to cache the outputs for production.  Tabletop has some recent additions to handle proxy via saving the outputs to a place like S3, as well as more traditional proxy like [gs-proxy](https://github.com/MinnPost/gs-proxy). 

### Data Models

There are currently models for each Open States object.  This aids in easily filling in the data when needed.

The editorial categories contain editorial bills (like meta bills), which refer to one or more actual, Open States bills.

### Hacks

Currently, Tabletop.js extends Array so that indexOf is available.  This has some implications in browsers, especially in the context of for..in loops.  Because of bad code in our site that is not easily updatable, we are using a [custom version of Tabletop.js](https://github.com/zzolo/tabletop).  See [pull request](https://github.com/jsoma/tabletop/pull/15).

## Attribution

* Icons provided by <a href="http://thenounproject.com/" target="_blank">The Noun Project</a>.  Congress by Martha Ormiston; Energy by NDSTR; GayMarriage by MaurizioFusillo; Education by Thibault Geffroy; Time by Richard de Vos; Capital by Jonathan Keating; Paper by Tom Schott; Bank by Ilaria Baggio; Group by Alexandra Coscovelnita; Check mark by Spencer Cohen; Back by John Chapman.