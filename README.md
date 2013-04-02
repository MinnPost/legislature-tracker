# Legislature Tracker

An application to keep track of what is going on in a state legislature.  Using editorial expertise and the Sunlight Lab's Open States API, this application aims to create a curated view of what is going on in a state's legislature session.

## Data

* [Open States](http://openstates.org/)
* [Editorial curation data with Google Docs](https://docs.google.com/)

## Building

Built versions will only be done for tagged releases.

1. Uses [grunt](http://gruntjs.com/).  To install: ```npm install```
1. Update version in: ```package.json```
1. Run: ```grunt```
1. Tag release: ```git tag 0.1.1```

## Hacks

Currently, Tabletop.js extends Array so that indexOf is available.  This has some implications in browsers, especially in the context of for..in loops.  Because of bad code in our site that is not easily updatable, we are using a [custom version of Tabletop.js](https://github.com/zzolo/tabletop).  See [pull request](https://github.com/jsoma/tabletop/pull/15).

## Deploying

This is specific to MinnPost, but could easily be changed if needed.

1. Uploads dist to S3: ```grunt mp-deploy```

## Architecture

The basic idea of the application is pulling together editorial knowledge
about bills and combining it with Open States data about the bills
to create a focused and useful interface to keep track of the important
activities of a legislature session.

```OS``` prefixes refer to Open States data, while ```E``` or ```e``` prefixes
refer to editorial data and objects.

### Caching

To ensure that both memory and network usage is minimized, there is some basic
caching happening.

For model instances, we wrap the creation of models in the following method:

    LT.utils.getModel('ModelName', 'identifying_attribute', attributes)
    
For fetching models, specifically Open States data, we wrap fetching:

    $.when(LT.utils.fetchModel(model)).then(
      successFunction,
      errorFunction
    );

#### Google Spreadsheets

This application uses [Tabletop.js](https://github.com/jsoma/tabletop) to read in data from Google Spreadsheets.  Due to the fact that Google does not guarantee up time or ability to handle requests, it is good practice to cache the outputs for production.  Tabletop has some recent additions to handle proxy via saving the outputs to a place like S3, but not a traditional proxy server like [gs-proxy](https://github.com/MinnPost/gs-proxy).  So, at the moment, this project is using a [forked version of Tabletop](https://github.com/zzolo/tabletop) (see [pull request](https://github.com/jsoma/tabletop/pull/14)).

### Data Models

There are currently models for each Open States object.  This aids in easily
filling in the data when needed.

The editorial categories contain editorial bills (like meta bills), which refer
to one or more actual, Open States bills.

## Attribution

* <a href="http://thenounproject.com/noun/back/#icon-No8301" target="_blank">Back</a> designed by <a href="http://thenounproject.com/chapmanjw" target="_blank">John Chapman</a> from The Noun Project