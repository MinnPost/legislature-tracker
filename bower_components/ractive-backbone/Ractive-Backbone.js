/*

	Backbone adaptor plugin
	=======================

	Version 0.1.0. Copyright 2013 @rich_harris, MIT licensed.

	This plugin allows Ractive.js to work seamlessly with Backbone.Model and
	Backbone.Collection instances.

	For more information see ractivejs.org/examples/backbone and
	https://github.com/Rich-Harris/Ractive/wiki/Adaptors.

	==========================

	Troubleshooting: If you're using a module system in your app (AMD or
	something more nodey) then you may need to change the paths below,
	where it says `require( 'ractive' )` or `define([ 'Ractive' ]...)`.

	==========================

	Usage: Include this file on your page below Ractive, e.g:

	    <script src='lib/Ractive.js'></script>
	    <script src='lib/Ractive-Backbone.js'></script>

	Or, if you're using a module loader, require this module:

	    define( function ( require ) {
	      var Ractive = require( 'Ractive' );

	      // requiring the plugins will 'activate' them - no need to use
	      // the return value
	      require( 'Ractive.plugins' );
	    });

	Then tell Ractive to expect Backbone objects by adding an `adaptors` property:

	    var ractive = new Ractive({
	      el: myContainer,
	      template: myTemplate,
	      data: { foo: myBackboneModel, bar: myBackboneCollection },
	      adaptors: [ 'Backbone' ]
	    });

*/

(function ( global, factory ) {

	'use strict';

	// Common JS (i.e. browserify) environment
	if ( typeof module !== 'undefined' && module.exports && typeof require === 'function' ) {
		factory( require( 'ractive' ), require( 'backbone' ) );
	}

	// AMD?
	else if ( typeof define === 'function' && define.amd ) {
		define([ 'Ractive', 'Backbone' ], factory );
	}

	// browser global
	else if ( global.Ractive && global.Backbone ) {
		factory( global.Ractive, global.Backbone );
	}

	else {
		throw new Error( 'Could not find Ractive or Backbone! Both must be loaded before the Ractive-Backbone plugin' );
	}

}( typeof window !== 'undefined' ? window : this, function ( Ractive, Backbone ) {

	'use strict';

	var BackboneModelWrapper, BackboneCollectionWrapper;

	if ( !Ractive || !Backbone ) {
		throw new Error( 'Could not find Ractive or Backbone! Check your paths config' );
	}

	Ractive.adaptors.Backbone = {
		filter: function ( object ) {
			return object instanceof Backbone.Model || object instanceof Backbone.Collection;
		},
		wrap: function ( ractive, object, keypath, prefix ) {
			if ( object instanceof Backbone.Model ) {
				return new BackboneModelWrapper( ractive, object, keypath, prefix );
			}

			return new BackboneCollectionWrapper( ractive, object, keypath, prefix );
		}
	};

	BackboneModelWrapper = function ( ractive, model, keypath, prefix ) {
		var wrapper = this;

		this.value = model;

		model.on( 'change', this.modelChangeHandler = function () {
			wrapper.setting = true;
			ractive.set( prefix( model.changed ) );
			wrapper.setting = false;
		});
	};

	BackboneModelWrapper.prototype = {
		teardown: function () {
			this.value.off( 'change', this.changeHandler );
		},
		get: function () {
			return this.value.attributes;
		},
		set: function ( keypath, value ) {
			// Only set if the model didn't originate the change itself, and
			// only if it's an immediate child property
			if ( !this.setting && keypath.indexOf( '.' ) === -1 ) {
				this.value.set( keypath, value );	
			}
		},
		reset: function ( object ) {
			// If the new object is a Backbone model, assume this one is
			// being retired. Ditto if it's not a model at all
			if ( object instanceof Backbone.Model || typeof object !== 'object' ) {
				return false;
			}

			// Otherwise if this is a POJO, reset the model
			this.value.reset( object );
		}
	};

	BackboneCollectionWrapper = function ( ractive, collection, keypath ) {
		var wrapper = this;

		this.value = collection;

		collection.on( 'add remove reset sort', this.changeHandler = function () {
			// TODO smart merge. It should be possible, if awkward, to trigger smart
			// updates instead of a blunderbuss .set() approach
			wrapper.setting = true;
			ractive.set( keypath, collection.models );
			wrapper.setting = false;
		});
	};

	BackboneCollectionWrapper.prototype = {
		teardown: function () {
			this.value.off( 'add remove reset sort', this.changeHandler );
		},
		get: function () {
			return this.value.models;
		},
		reset: function ( models ) {
			if ( this.setting ) {
				return;
			}

			// If the new object is a Backbone collection, assume this one is
			// being retired. Ditto if it's not a collection at all
			if ( models instanceof Backbone.Collection || Object.prototype.toString.call( models ) !== '[object Array]' ) {
				return false;
			}

			// Otherwise if this is a plain array, reset the collection
			this.value.reset( models );
		}
	};

}));