# Legislature Tracker

An application to keep track of what is going on in a state legislature.  Using editorial expertise and the Sunlight Lab's Open States API, this application aims to create a curated view of what is going on in a state's legislature session.

## Data

* [Open States](http://openstates.org/)
* [Editorial curation data with Google Docs](https://docs.google.com/)

## Building

1. Uses [grunt](http://gruntjs.com/).  To install: ```npm install```
1. Update version in: ```package.json```
1. Run: ```grunt```

## Deploying

This is specific to MinnPost, but could easily be changed if needed.

1. Uploads dist to S3: ```grunt mp-deploy```