//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.6.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return obj;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
    return obj;
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    any(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    each(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, function(value, index, list) {
      return !predicate.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
    each(obj, function(value, index, list) {
      if (!(result = result && predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(value, index, list) {
      if (result || (result = predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    var result = -Infinity, lastComputed = -Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed > lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    var result = Infinity, lastComputed = Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed < lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return value;
    return _.property(value);
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    iterator = lookupIterator(iterator);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iterator, context) {
      var result = {};
      iterator = lookupIterator(iterator);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    _.has(result, key) ? result[key].push(value) : result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Split an array into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(array, predicate) {
    var pass = [], fail = [];
    each(array, function(elem) {
      (predicate(elem) ? pass : fail).push(elem);
    });
    return [pass, fail];
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.contains(other, item);
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, 'length').concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error('bindAll must be passed function names');
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;
      if (last < wait) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function () {
      return value;
    };
  };

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    return function(obj) {
      if (obj === attrs) return true; //avoid comparing an object to itself.
      for (var key in attrs) {
        if (attrs[key] !== obj[key])
          return false;
      }
      return true;
    }
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() { return new Date().getTime(); };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}).call(this);
;

/*! jQuery v1.11.0 | (c) 2005, 2014 jQuery Foundation, Inc. | jquery.org/license */
!function(a,b){"object"==typeof module&&"object"==typeof module.exports?module.exports=a.document?b(a,!0):function(a){if(!a.document)throw new Error("jQuery requires a window with a document");return b(a)}:b(a)}("undefined"!=typeof window?window:this,function(a,b){var c=[],d=c.slice,e=c.concat,f=c.push,g=c.indexOf,h={},i=h.toString,j=h.hasOwnProperty,k="".trim,l={},m="1.11.0",n=function(a,b){return new n.fn.init(a,b)},o=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,p=/^-ms-/,q=/-([\da-z])/gi,r=function(a,b){return b.toUpperCase()};n.fn=n.prototype={jquery:m,constructor:n,selector:"",length:0,toArray:function(){return d.call(this)},get:function(a){return null!=a?0>a?this[a+this.length]:this[a]:d.call(this)},pushStack:function(a){var b=n.merge(this.constructor(),a);return b.prevObject=this,b.context=this.context,b},each:function(a,b){return n.each(this,a,b)},map:function(a){return this.pushStack(n.map(this,function(b,c){return a.call(b,c,b)}))},slice:function(){return this.pushStack(d.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(a){var b=this.length,c=+a+(0>a?b:0);return this.pushStack(c>=0&&b>c?[this[c]]:[])},end:function(){return this.prevObject||this.constructor(null)},push:f,sort:c.sort,splice:c.splice},n.extend=n.fn.extend=function(){var a,b,c,d,e,f,g=arguments[0]||{},h=1,i=arguments.length,j=!1;for("boolean"==typeof g&&(j=g,g=arguments[h]||{},h++),"object"==typeof g||n.isFunction(g)||(g={}),h===i&&(g=this,h--);i>h;h++)if(null!=(e=arguments[h]))for(d in e)a=g[d],c=e[d],g!==c&&(j&&c&&(n.isPlainObject(c)||(b=n.isArray(c)))?(b?(b=!1,f=a&&n.isArray(a)?a:[]):f=a&&n.isPlainObject(a)?a:{},g[d]=n.extend(j,f,c)):void 0!==c&&(g[d]=c));return g},n.extend({expando:"jQuery"+(m+Math.random()).replace(/\D/g,""),isReady:!0,error:function(a){throw new Error(a)},noop:function(){},isFunction:function(a){return"function"===n.type(a)},isArray:Array.isArray||function(a){return"array"===n.type(a)},isWindow:function(a){return null!=a&&a==a.window},isNumeric:function(a){return a-parseFloat(a)>=0},isEmptyObject:function(a){var b;for(b in a)return!1;return!0},isPlainObject:function(a){var b;if(!a||"object"!==n.type(a)||a.nodeType||n.isWindow(a))return!1;try{if(a.constructor&&!j.call(a,"constructor")&&!j.call(a.constructor.prototype,"isPrototypeOf"))return!1}catch(c){return!1}if(l.ownLast)for(b in a)return j.call(a,b);for(b in a);return void 0===b||j.call(a,b)},type:function(a){return null==a?a+"":"object"==typeof a||"function"==typeof a?h[i.call(a)]||"object":typeof a},globalEval:function(b){b&&n.trim(b)&&(a.execScript||function(b){a.eval.call(a,b)})(b)},camelCase:function(a){return a.replace(p,"ms-").replace(q,r)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()},each:function(a,b,c){var d,e=0,f=a.length,g=s(a);if(c){if(g){for(;f>e;e++)if(d=b.apply(a[e],c),d===!1)break}else for(e in a)if(d=b.apply(a[e],c),d===!1)break}else if(g){for(;f>e;e++)if(d=b.call(a[e],e,a[e]),d===!1)break}else for(e in a)if(d=b.call(a[e],e,a[e]),d===!1)break;return a},trim:k&&!k.call("\ufeff\xa0")?function(a){return null==a?"":k.call(a)}:function(a){return null==a?"":(a+"").replace(o,"")},makeArray:function(a,b){var c=b||[];return null!=a&&(s(Object(a))?n.merge(c,"string"==typeof a?[a]:a):f.call(c,a)),c},inArray:function(a,b,c){var d;if(b){if(g)return g.call(b,a,c);for(d=b.length,c=c?0>c?Math.max(0,d+c):c:0;d>c;c++)if(c in b&&b[c]===a)return c}return-1},merge:function(a,b){var c=+b.length,d=0,e=a.length;while(c>d)a[e++]=b[d++];if(c!==c)while(void 0!==b[d])a[e++]=b[d++];return a.length=e,a},grep:function(a,b,c){for(var d,e=[],f=0,g=a.length,h=!c;g>f;f++)d=!b(a[f],f),d!==h&&e.push(a[f]);return e},map:function(a,b,c){var d,f=0,g=a.length,h=s(a),i=[];if(h)for(;g>f;f++)d=b(a[f],f,c),null!=d&&i.push(d);else for(f in a)d=b(a[f],f,c),null!=d&&i.push(d);return e.apply([],i)},guid:1,proxy:function(a,b){var c,e,f;return"string"==typeof b&&(f=a[b],b=a,a=f),n.isFunction(a)?(c=d.call(arguments,2),e=function(){return a.apply(b||this,c.concat(d.call(arguments)))},e.guid=a.guid=a.guid||n.guid++,e):void 0},now:function(){return+new Date},support:l}),n.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(a,b){h["[object "+b+"]"]=b.toLowerCase()});function s(a){var b=a.length,c=n.type(a);return"function"===c||n.isWindow(a)?!1:1===a.nodeType&&b?!0:"array"===c||0===b||"number"==typeof b&&b>0&&b-1 in a}var t=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s="sizzle"+-new Date,t=a.document,u=0,v=0,w=eb(),x=eb(),y=eb(),z=function(a,b){return a===b&&(j=!0),0},A="undefined",B=1<<31,C={}.hasOwnProperty,D=[],E=D.pop,F=D.push,G=D.push,H=D.slice,I=D.indexOf||function(a){for(var b=0,c=this.length;c>b;b++)if(this[b]===a)return b;return-1},J="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",K="[\\x20\\t\\r\\n\\f]",L="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",M=L.replace("w","w#"),N="\\["+K+"*("+L+")"+K+"*(?:([*^$|!~]?=)"+K+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+M+")|)|)"+K+"*\\]",O=":("+L+")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|"+N.replace(3,8)+")*)|.*)\\)|)",P=new RegExp("^"+K+"+|((?:^|[^\\\\])(?:\\\\.)*)"+K+"+$","g"),Q=new RegExp("^"+K+"*,"+K+"*"),R=new RegExp("^"+K+"*([>+~]|"+K+")"+K+"*"),S=new RegExp("="+K+"*([^\\]'\"]*?)"+K+"*\\]","g"),T=new RegExp(O),U=new RegExp("^"+M+"$"),V={ID:new RegExp("^#("+L+")"),CLASS:new RegExp("^\\.("+L+")"),TAG:new RegExp("^("+L.replace("w","w*")+")"),ATTR:new RegExp("^"+N),PSEUDO:new RegExp("^"+O),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+K+"*(even|odd|(([+-]|)(\\d*)n|)"+K+"*(?:([+-]|)"+K+"*(\\d+)|))"+K+"*\\)|)","i"),bool:new RegExp("^(?:"+J+")$","i"),needsContext:new RegExp("^"+K+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+K+"*((?:-\\d)?\\d*)"+K+"*\\)|)(?=[^-]|$)","i")},W=/^(?:input|select|textarea|button)$/i,X=/^h\d$/i,Y=/^[^{]+\{\s*\[native \w/,Z=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,$=/[+~]/,_=/'|\\/g,ab=new RegExp("\\\\([\\da-f]{1,6}"+K+"?|("+K+")|.)","ig"),bb=function(a,b,c){var d="0x"+b-65536;return d!==d||c?b:0>d?String.fromCharCode(d+65536):String.fromCharCode(d>>10|55296,1023&d|56320)};try{G.apply(D=H.call(t.childNodes),t.childNodes),D[t.childNodes.length].nodeType}catch(cb){G={apply:D.length?function(a,b){F.apply(a,H.call(b))}:function(a,b){var c=a.length,d=0;while(a[c++]=b[d++]);a.length=c-1}}}function db(a,b,d,e){var f,g,h,i,j,m,p,q,u,v;if((b?b.ownerDocument||b:t)!==l&&k(b),b=b||l,d=d||[],!a||"string"!=typeof a)return d;if(1!==(i=b.nodeType)&&9!==i)return[];if(n&&!e){if(f=Z.exec(a))if(h=f[1]){if(9===i){if(g=b.getElementById(h),!g||!g.parentNode)return d;if(g.id===h)return d.push(g),d}else if(b.ownerDocument&&(g=b.ownerDocument.getElementById(h))&&r(b,g)&&g.id===h)return d.push(g),d}else{if(f[2])return G.apply(d,b.getElementsByTagName(a)),d;if((h=f[3])&&c.getElementsByClassName&&b.getElementsByClassName)return G.apply(d,b.getElementsByClassName(h)),d}if(c.qsa&&(!o||!o.test(a))){if(q=p=s,u=b,v=9===i&&a,1===i&&"object"!==b.nodeName.toLowerCase()){m=ob(a),(p=b.getAttribute("id"))?q=p.replace(_,"\\$&"):b.setAttribute("id",q),q="[id='"+q+"'] ",j=m.length;while(j--)m[j]=q+pb(m[j]);u=$.test(a)&&mb(b.parentNode)||b,v=m.join(",")}if(v)try{return G.apply(d,u.querySelectorAll(v)),d}catch(w){}finally{p||b.removeAttribute("id")}}}return xb(a.replace(P,"$1"),b,d,e)}function eb(){var a=[];function b(c,e){return a.push(c+" ")>d.cacheLength&&delete b[a.shift()],b[c+" "]=e}return b}function fb(a){return a[s]=!0,a}function gb(a){var b=l.createElement("div");try{return!!a(b)}catch(c){return!1}finally{b.parentNode&&b.parentNode.removeChild(b),b=null}}function hb(a,b){var c=a.split("|"),e=a.length;while(e--)d.attrHandle[c[e]]=b}function ib(a,b){var c=b&&a,d=c&&1===a.nodeType&&1===b.nodeType&&(~b.sourceIndex||B)-(~a.sourceIndex||B);if(d)return d;if(c)while(c=c.nextSibling)if(c===b)return-1;return a?1:-1}function jb(a){return function(b){var c=b.nodeName.toLowerCase();return"input"===c&&b.type===a}}function kb(a){return function(b){var c=b.nodeName.toLowerCase();return("input"===c||"button"===c)&&b.type===a}}function lb(a){return fb(function(b){return b=+b,fb(function(c,d){var e,f=a([],c.length,b),g=f.length;while(g--)c[e=f[g]]&&(c[e]=!(d[e]=c[e]))})})}function mb(a){return a&&typeof a.getElementsByTagName!==A&&a}c=db.support={},f=db.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return b?"HTML"!==b.nodeName:!1},k=db.setDocument=function(a){var b,e=a?a.ownerDocument||a:t,g=e.defaultView;return e!==l&&9===e.nodeType&&e.documentElement?(l=e,m=e.documentElement,n=!f(e),g&&g!==g.top&&(g.addEventListener?g.addEventListener("unload",function(){k()},!1):g.attachEvent&&g.attachEvent("onunload",function(){k()})),c.attributes=gb(function(a){return a.className="i",!a.getAttribute("className")}),c.getElementsByTagName=gb(function(a){return a.appendChild(e.createComment("")),!a.getElementsByTagName("*").length}),c.getElementsByClassName=Y.test(e.getElementsByClassName)&&gb(function(a){return a.innerHTML="<div class='a'></div><div class='a i'></div>",a.firstChild.className="i",2===a.getElementsByClassName("i").length}),c.getById=gb(function(a){return m.appendChild(a).id=s,!e.getElementsByName||!e.getElementsByName(s).length}),c.getById?(d.find.ID=function(a,b){if(typeof b.getElementById!==A&&n){var c=b.getElementById(a);return c&&c.parentNode?[c]:[]}},d.filter.ID=function(a){var b=a.replace(ab,bb);return function(a){return a.getAttribute("id")===b}}):(delete d.find.ID,d.filter.ID=function(a){var b=a.replace(ab,bb);return function(a){var c=typeof a.getAttributeNode!==A&&a.getAttributeNode("id");return c&&c.value===b}}),d.find.TAG=c.getElementsByTagName?function(a,b){return typeof b.getElementsByTagName!==A?b.getElementsByTagName(a):void 0}:function(a,b){var c,d=[],e=0,f=b.getElementsByTagName(a);if("*"===a){while(c=f[e++])1===c.nodeType&&d.push(c);return d}return f},d.find.CLASS=c.getElementsByClassName&&function(a,b){return typeof b.getElementsByClassName!==A&&n?b.getElementsByClassName(a):void 0},p=[],o=[],(c.qsa=Y.test(e.querySelectorAll))&&(gb(function(a){a.innerHTML="<select t=''><option selected=''></option></select>",a.querySelectorAll("[t^='']").length&&o.push("[*^$]="+K+"*(?:''|\"\")"),a.querySelectorAll("[selected]").length||o.push("\\["+K+"*(?:value|"+J+")"),a.querySelectorAll(":checked").length||o.push(":checked")}),gb(function(a){var b=e.createElement("input");b.setAttribute("type","hidden"),a.appendChild(b).setAttribute("name","D"),a.querySelectorAll("[name=d]").length&&o.push("name"+K+"*[*^$|!~]?="),a.querySelectorAll(":enabled").length||o.push(":enabled",":disabled"),a.querySelectorAll("*,:x"),o.push(",.*:")})),(c.matchesSelector=Y.test(q=m.webkitMatchesSelector||m.mozMatchesSelector||m.oMatchesSelector||m.msMatchesSelector))&&gb(function(a){c.disconnectedMatch=q.call(a,"div"),q.call(a,"[s!='']:x"),p.push("!=",O)}),o=o.length&&new RegExp(o.join("|")),p=p.length&&new RegExp(p.join("|")),b=Y.test(m.compareDocumentPosition),r=b||Y.test(m.contains)?function(a,b){var c=9===a.nodeType?a.documentElement:a,d=b&&b.parentNode;return a===d||!(!d||1!==d.nodeType||!(c.contains?c.contains(d):a.compareDocumentPosition&&16&a.compareDocumentPosition(d)))}:function(a,b){if(b)while(b=b.parentNode)if(b===a)return!0;return!1},z=b?function(a,b){if(a===b)return j=!0,0;var d=!a.compareDocumentPosition-!b.compareDocumentPosition;return d?d:(d=(a.ownerDocument||a)===(b.ownerDocument||b)?a.compareDocumentPosition(b):1,1&d||!c.sortDetached&&b.compareDocumentPosition(a)===d?a===e||a.ownerDocument===t&&r(t,a)?-1:b===e||b.ownerDocument===t&&r(t,b)?1:i?I.call(i,a)-I.call(i,b):0:4&d?-1:1)}:function(a,b){if(a===b)return j=!0,0;var c,d=0,f=a.parentNode,g=b.parentNode,h=[a],k=[b];if(!f||!g)return a===e?-1:b===e?1:f?-1:g?1:i?I.call(i,a)-I.call(i,b):0;if(f===g)return ib(a,b);c=a;while(c=c.parentNode)h.unshift(c);c=b;while(c=c.parentNode)k.unshift(c);while(h[d]===k[d])d++;return d?ib(h[d],k[d]):h[d]===t?-1:k[d]===t?1:0},e):l},db.matches=function(a,b){return db(a,null,null,b)},db.matchesSelector=function(a,b){if((a.ownerDocument||a)!==l&&k(a),b=b.replace(S,"='$1']"),!(!c.matchesSelector||!n||p&&p.test(b)||o&&o.test(b)))try{var d=q.call(a,b);if(d||c.disconnectedMatch||a.document&&11!==a.document.nodeType)return d}catch(e){}return db(b,l,null,[a]).length>0},db.contains=function(a,b){return(a.ownerDocument||a)!==l&&k(a),r(a,b)},db.attr=function(a,b){(a.ownerDocument||a)!==l&&k(a);var e=d.attrHandle[b.toLowerCase()],f=e&&C.call(d.attrHandle,b.toLowerCase())?e(a,b,!n):void 0;return void 0!==f?f:c.attributes||!n?a.getAttribute(b):(f=a.getAttributeNode(b))&&f.specified?f.value:null},db.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},db.uniqueSort=function(a){var b,d=[],e=0,f=0;if(j=!c.detectDuplicates,i=!c.sortStable&&a.slice(0),a.sort(z),j){while(b=a[f++])b===a[f]&&(e=d.push(f));while(e--)a.splice(d[e],1)}return i=null,a},e=db.getText=function(a){var b,c="",d=0,f=a.nodeType;if(f){if(1===f||9===f||11===f){if("string"==typeof a.textContent)return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=e(a)}else if(3===f||4===f)return a.nodeValue}else while(b=a[d++])c+=e(b);return c},d=db.selectors={cacheLength:50,createPseudo:fb,match:V,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(ab,bb),a[3]=(a[4]||a[5]||"").replace(ab,bb),"~="===a[2]&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),"nth"===a[1].slice(0,3)?(a[3]||db.error(a[0]),a[4]=+(a[4]?a[5]+(a[6]||1):2*("even"===a[3]||"odd"===a[3])),a[5]=+(a[7]+a[8]||"odd"===a[3])):a[3]&&db.error(a[0]),a},PSEUDO:function(a){var b,c=!a[5]&&a[2];return V.CHILD.test(a[0])?null:(a[3]&&void 0!==a[4]?a[2]=a[4]:c&&T.test(c)&&(b=ob(c,!0))&&(b=c.indexOf(")",c.length-b)-c.length)&&(a[0]=a[0].slice(0,b),a[2]=c.slice(0,b)),a.slice(0,3))}},filter:{TAG:function(a){var b=a.replace(ab,bb).toLowerCase();return"*"===a?function(){return!0}:function(a){return a.nodeName&&a.nodeName.toLowerCase()===b}},CLASS:function(a){var b=w[a+" "];return b||(b=new RegExp("(^|"+K+")"+a+"("+K+"|$)"))&&w(a,function(a){return b.test("string"==typeof a.className&&a.className||typeof a.getAttribute!==A&&a.getAttribute("class")||"")})},ATTR:function(a,b,c){return function(d){var e=db.attr(d,a);return null==e?"!="===b:b?(e+="","="===b?e===c:"!="===b?e!==c:"^="===b?c&&0===e.indexOf(c):"*="===b?c&&e.indexOf(c)>-1:"$="===b?c&&e.slice(-c.length)===c:"~="===b?(" "+e+" ").indexOf(c)>-1:"|="===b?e===c||e.slice(0,c.length+1)===c+"-":!1):!0}},CHILD:function(a,b,c,d,e){var f="nth"!==a.slice(0,3),g="last"!==a.slice(-4),h="of-type"===b;return 1===d&&0===e?function(a){return!!a.parentNode}:function(b,c,i){var j,k,l,m,n,o,p=f!==g?"nextSibling":"previousSibling",q=b.parentNode,r=h&&b.nodeName.toLowerCase(),t=!i&&!h;if(q){if(f){while(p){l=b;while(l=l[p])if(h?l.nodeName.toLowerCase()===r:1===l.nodeType)return!1;o=p="only"===a&&!o&&"nextSibling"}return!0}if(o=[g?q.firstChild:q.lastChild],g&&t){k=q[s]||(q[s]={}),j=k[a]||[],n=j[0]===u&&j[1],m=j[0]===u&&j[2],l=n&&q.childNodes[n];while(l=++n&&l&&l[p]||(m=n=0)||o.pop())if(1===l.nodeType&&++m&&l===b){k[a]=[u,n,m];break}}else if(t&&(j=(b[s]||(b[s]={}))[a])&&j[0]===u)m=j[1];else while(l=++n&&l&&l[p]||(m=n=0)||o.pop())if((h?l.nodeName.toLowerCase()===r:1===l.nodeType)&&++m&&(t&&((l[s]||(l[s]={}))[a]=[u,m]),l===b))break;return m-=e,m===d||m%d===0&&m/d>=0}}},PSEUDO:function(a,b){var c,e=d.pseudos[a]||d.setFilters[a.toLowerCase()]||db.error("unsupported pseudo: "+a);return e[s]?e(b):e.length>1?(c=[a,a,"",b],d.setFilters.hasOwnProperty(a.toLowerCase())?fb(function(a,c){var d,f=e(a,b),g=f.length;while(g--)d=I.call(a,f[g]),a[d]=!(c[d]=f[g])}):function(a){return e(a,0,c)}):e}},pseudos:{not:fb(function(a){var b=[],c=[],d=g(a.replace(P,"$1"));return d[s]?fb(function(a,b,c,e){var f,g=d(a,null,e,[]),h=a.length;while(h--)(f=g[h])&&(a[h]=!(b[h]=f))}):function(a,e,f){return b[0]=a,d(b,null,f,c),!c.pop()}}),has:fb(function(a){return function(b){return db(a,b).length>0}}),contains:fb(function(a){return function(b){return(b.textContent||b.innerText||e(b)).indexOf(a)>-1}}),lang:fb(function(a){return U.test(a||"")||db.error("unsupported lang: "+a),a=a.replace(ab,bb).toLowerCase(),function(b){var c;do if(c=n?b.lang:b.getAttribute("xml:lang")||b.getAttribute("lang"))return c=c.toLowerCase(),c===a||0===c.indexOf(a+"-");while((b=b.parentNode)&&1===b.nodeType);return!1}}),target:function(b){var c=a.location&&a.location.hash;return c&&c.slice(1)===b.id},root:function(a){return a===m},focus:function(a){return a===l.activeElement&&(!l.hasFocus||l.hasFocus())&&!!(a.type||a.href||~a.tabIndex)},enabled:function(a){return a.disabled===!1},disabled:function(a){return a.disabled===!0},checked:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&!!a.checked||"option"===b&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0},empty:function(a){for(a=a.firstChild;a;a=a.nextSibling)if(a.nodeType<6)return!1;return!0},parent:function(a){return!d.pseudos.empty(a)},header:function(a){return X.test(a.nodeName)},input:function(a){return W.test(a.nodeName)},button:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&"button"===a.type||"button"===b},text:function(a){var b;return"input"===a.nodeName.toLowerCase()&&"text"===a.type&&(null==(b=a.getAttribute("type"))||"text"===b.toLowerCase())},first:lb(function(){return[0]}),last:lb(function(a,b){return[b-1]}),eq:lb(function(a,b,c){return[0>c?c+b:c]}),even:lb(function(a,b){for(var c=0;b>c;c+=2)a.push(c);return a}),odd:lb(function(a,b){for(var c=1;b>c;c+=2)a.push(c);return a}),lt:lb(function(a,b,c){for(var d=0>c?c+b:c;--d>=0;)a.push(d);return a}),gt:lb(function(a,b,c){for(var d=0>c?c+b:c;++d<b;)a.push(d);return a})}},d.pseudos.nth=d.pseudos.eq;for(b in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})d.pseudos[b]=jb(b);for(b in{submit:!0,reset:!0})d.pseudos[b]=kb(b);function nb(){}nb.prototype=d.filters=d.pseudos,d.setFilters=new nb;function ob(a,b){var c,e,f,g,h,i,j,k=x[a+" "];if(k)return b?0:k.slice(0);h=a,i=[],j=d.preFilter;while(h){(!c||(e=Q.exec(h)))&&(e&&(h=h.slice(e[0].length)||h),i.push(f=[])),c=!1,(e=R.exec(h))&&(c=e.shift(),f.push({value:c,type:e[0].replace(P," ")}),h=h.slice(c.length));for(g in d.filter)!(e=V[g].exec(h))||j[g]&&!(e=j[g](e))||(c=e.shift(),f.push({value:c,type:g,matches:e}),h=h.slice(c.length));if(!c)break}return b?h.length:h?db.error(a):x(a,i).slice(0)}function pb(a){for(var b=0,c=a.length,d="";c>b;b++)d+=a[b].value;return d}function qb(a,b,c){var d=b.dir,e=c&&"parentNode"===d,f=v++;return b.first?function(b,c,f){while(b=b[d])if(1===b.nodeType||e)return a(b,c,f)}:function(b,c,g){var h,i,j=[u,f];if(g){while(b=b[d])if((1===b.nodeType||e)&&a(b,c,g))return!0}else while(b=b[d])if(1===b.nodeType||e){if(i=b[s]||(b[s]={}),(h=i[d])&&h[0]===u&&h[1]===f)return j[2]=h[2];if(i[d]=j,j[2]=a(b,c,g))return!0}}}function rb(a){return a.length>1?function(b,c,d){var e=a.length;while(e--)if(!a[e](b,c,d))return!1;return!0}:a[0]}function sb(a,b,c,d,e){for(var f,g=[],h=0,i=a.length,j=null!=b;i>h;h++)(f=a[h])&&(!c||c(f,d,e))&&(g.push(f),j&&b.push(h));return g}function tb(a,b,c,d,e,f){return d&&!d[s]&&(d=tb(d)),e&&!e[s]&&(e=tb(e,f)),fb(function(f,g,h,i){var j,k,l,m=[],n=[],o=g.length,p=f||wb(b||"*",h.nodeType?[h]:h,[]),q=!a||!f&&b?p:sb(p,m,a,h,i),r=c?e||(f?a:o||d)?[]:g:q;if(c&&c(q,r,h,i),d){j=sb(r,n),d(j,[],h,i),k=j.length;while(k--)(l=j[k])&&(r[n[k]]=!(q[n[k]]=l))}if(f){if(e||a){if(e){j=[],k=r.length;while(k--)(l=r[k])&&j.push(q[k]=l);e(null,r=[],j,i)}k=r.length;while(k--)(l=r[k])&&(j=e?I.call(f,l):m[k])>-1&&(f[j]=!(g[j]=l))}}else r=sb(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):G.apply(g,r)})}function ub(a){for(var b,c,e,f=a.length,g=d.relative[a[0].type],i=g||d.relative[" "],j=g?1:0,k=qb(function(a){return a===b},i,!0),l=qb(function(a){return I.call(b,a)>-1},i,!0),m=[function(a,c,d){return!g&&(d||c!==h)||((b=c).nodeType?k(a,c,d):l(a,c,d))}];f>j;j++)if(c=d.relative[a[j].type])m=[qb(rb(m),c)];else{if(c=d.filter[a[j].type].apply(null,a[j].matches),c[s]){for(e=++j;f>e;e++)if(d.relative[a[e].type])break;return tb(j>1&&rb(m),j>1&&pb(a.slice(0,j-1).concat({value:" "===a[j-2].type?"*":""})).replace(P,"$1"),c,e>j&&ub(a.slice(j,e)),f>e&&ub(a=a.slice(e)),f>e&&pb(a))}m.push(c)}return rb(m)}function vb(a,b){var c=b.length>0,e=a.length>0,f=function(f,g,i,j,k){var m,n,o,p=0,q="0",r=f&&[],s=[],t=h,v=f||e&&d.find.TAG("*",k),w=u+=null==t?1:Math.random()||.1,x=v.length;for(k&&(h=g!==l&&g);q!==x&&null!=(m=v[q]);q++){if(e&&m){n=0;while(o=a[n++])if(o(m,g,i)){j.push(m);break}k&&(u=w)}c&&((m=!o&&m)&&p--,f&&r.push(m))}if(p+=q,c&&q!==p){n=0;while(o=b[n++])o(r,s,g,i);if(f){if(p>0)while(q--)r[q]||s[q]||(s[q]=E.call(j));s=sb(s)}G.apply(j,s),k&&!f&&s.length>0&&p+b.length>1&&db.uniqueSort(j)}return k&&(u=w,h=t),r};return c?fb(f):f}g=db.compile=function(a,b){var c,d=[],e=[],f=y[a+" "];if(!f){b||(b=ob(a)),c=b.length;while(c--)f=ub(b[c]),f[s]?d.push(f):e.push(f);f=y(a,vb(e,d))}return f};function wb(a,b,c){for(var d=0,e=b.length;e>d;d++)db(a,b[d],c);return c}function xb(a,b,e,f){var h,i,j,k,l,m=ob(a);if(!f&&1===m.length){if(i=m[0]=m[0].slice(0),i.length>2&&"ID"===(j=i[0]).type&&c.getById&&9===b.nodeType&&n&&d.relative[i[1].type]){if(b=(d.find.ID(j.matches[0].replace(ab,bb),b)||[])[0],!b)return e;a=a.slice(i.shift().value.length)}h=V.needsContext.test(a)?0:i.length;while(h--){if(j=i[h],d.relative[k=j.type])break;if((l=d.find[k])&&(f=l(j.matches[0].replace(ab,bb),$.test(i[0].type)&&mb(b.parentNode)||b))){if(i.splice(h,1),a=f.length&&pb(i),!a)return G.apply(e,f),e;break}}}return g(a,m)(f,b,!n,e,$.test(a)&&mb(b.parentNode)||b),e}return c.sortStable=s.split("").sort(z).join("")===s,c.detectDuplicates=!!j,k(),c.sortDetached=gb(function(a){return 1&a.compareDocumentPosition(l.createElement("div"))}),gb(function(a){return a.innerHTML="<a href='#'></a>","#"===a.firstChild.getAttribute("href")})||hb("type|href|height|width",function(a,b,c){return c?void 0:a.getAttribute(b,"type"===b.toLowerCase()?1:2)}),c.attributes&&gb(function(a){return a.innerHTML="<input/>",a.firstChild.setAttribute("value",""),""===a.firstChild.getAttribute("value")})||hb("value",function(a,b,c){return c||"input"!==a.nodeName.toLowerCase()?void 0:a.defaultValue}),gb(function(a){return null==a.getAttribute("disabled")})||hb(J,function(a,b,c){var d;return c?void 0:a[b]===!0?b.toLowerCase():(d=a.getAttributeNode(b))&&d.specified?d.value:null}),db}(a);n.find=t,n.expr=t.selectors,n.expr[":"]=n.expr.pseudos,n.unique=t.uniqueSort,n.text=t.getText,n.isXMLDoc=t.isXML,n.contains=t.contains;var u=n.expr.match.needsContext,v=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,w=/^.[^:#\[\.,]*$/;function x(a,b,c){if(n.isFunction(b))return n.grep(a,function(a,d){return!!b.call(a,d,a)!==c});if(b.nodeType)return n.grep(a,function(a){return a===b!==c});if("string"==typeof b){if(w.test(b))return n.filter(b,a,c);b=n.filter(b,a)}return n.grep(a,function(a){return n.inArray(a,b)>=0!==c})}n.filter=function(a,b,c){var d=b[0];return c&&(a=":not("+a+")"),1===b.length&&1===d.nodeType?n.find.matchesSelector(d,a)?[d]:[]:n.find.matches(a,n.grep(b,function(a){return 1===a.nodeType}))},n.fn.extend({find:function(a){var b,c=[],d=this,e=d.length;if("string"!=typeof a)return this.pushStack(n(a).filter(function(){for(b=0;e>b;b++)if(n.contains(d[b],this))return!0}));for(b=0;e>b;b++)n.find(a,d[b],c);return c=this.pushStack(e>1?n.unique(c):c),c.selector=this.selector?this.selector+" "+a:a,c},filter:function(a){return this.pushStack(x(this,a||[],!1))},not:function(a){return this.pushStack(x(this,a||[],!0))},is:function(a){return!!x(this,"string"==typeof a&&u.test(a)?n(a):a||[],!1).length}});var y,z=a.document,A=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,B=n.fn.init=function(a,b){var c,d;if(!a)return this;if("string"==typeof a){if(c="<"===a.charAt(0)&&">"===a.charAt(a.length-1)&&a.length>=3?[null,a,null]:A.exec(a),!c||!c[1]&&b)return!b||b.jquery?(b||y).find(a):this.constructor(b).find(a);if(c[1]){if(b=b instanceof n?b[0]:b,n.merge(this,n.parseHTML(c[1],b&&b.nodeType?b.ownerDocument||b:z,!0)),v.test(c[1])&&n.isPlainObject(b))for(c in b)n.isFunction(this[c])?this[c](b[c]):this.attr(c,b[c]);return this}if(d=z.getElementById(c[2]),d&&d.parentNode){if(d.id!==c[2])return y.find(a);this.length=1,this[0]=d}return this.context=z,this.selector=a,this}return a.nodeType?(this.context=this[0]=a,this.length=1,this):n.isFunction(a)?"undefined"!=typeof y.ready?y.ready(a):a(n):(void 0!==a.selector&&(this.selector=a.selector,this.context=a.context),n.makeArray(a,this))};B.prototype=n.fn,y=n(z);var C=/^(?:parents|prev(?:Until|All))/,D={children:!0,contents:!0,next:!0,prev:!0};n.extend({dir:function(a,b,c){var d=[],e=a[b];while(e&&9!==e.nodeType&&(void 0===c||1!==e.nodeType||!n(e).is(c)))1===e.nodeType&&d.push(e),e=e[b];return d},sibling:function(a,b){for(var c=[];a;a=a.nextSibling)1===a.nodeType&&a!==b&&c.push(a);return c}}),n.fn.extend({has:function(a){var b,c=n(a,this),d=c.length;return this.filter(function(){for(b=0;d>b;b++)if(n.contains(this,c[b]))return!0})},closest:function(a,b){for(var c,d=0,e=this.length,f=[],g=u.test(a)||"string"!=typeof a?n(a,b||this.context):0;e>d;d++)for(c=this[d];c&&c!==b;c=c.parentNode)if(c.nodeType<11&&(g?g.index(c)>-1:1===c.nodeType&&n.find.matchesSelector(c,a))){f.push(c);break}return this.pushStack(f.length>1?n.unique(f):f)},index:function(a){return a?"string"==typeof a?n.inArray(this[0],n(a)):n.inArray(a.jquery?a[0]:a,this):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(a,b){return this.pushStack(n.unique(n.merge(this.get(),n(a,b))))},addBack:function(a){return this.add(null==a?this.prevObject:this.prevObject.filter(a))}});function E(a,b){do a=a[b];while(a&&1!==a.nodeType);return a}n.each({parent:function(a){var b=a.parentNode;return b&&11!==b.nodeType?b:null},parents:function(a){return n.dir(a,"parentNode")},parentsUntil:function(a,b,c){return n.dir(a,"parentNode",c)},next:function(a){return E(a,"nextSibling")},prev:function(a){return E(a,"previousSibling")},nextAll:function(a){return n.dir(a,"nextSibling")},prevAll:function(a){return n.dir(a,"previousSibling")},nextUntil:function(a,b,c){return n.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return n.dir(a,"previousSibling",c)},siblings:function(a){return n.sibling((a.parentNode||{}).firstChild,a)},children:function(a){return n.sibling(a.firstChild)},contents:function(a){return n.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:n.merge([],a.childNodes)}},function(a,b){n.fn[a]=function(c,d){var e=n.map(this,b,c);return"Until"!==a.slice(-5)&&(d=c),d&&"string"==typeof d&&(e=n.filter(d,e)),this.length>1&&(D[a]||(e=n.unique(e)),C.test(a)&&(e=e.reverse())),this.pushStack(e)}});var F=/\S+/g,G={};function H(a){var b=G[a]={};return n.each(a.match(F)||[],function(a,c){b[c]=!0}),b}n.Callbacks=function(a){a="string"==typeof a?G[a]||H(a):n.extend({},a);var b,c,d,e,f,g,h=[],i=!a.once&&[],j=function(l){for(c=a.memory&&l,d=!0,f=g||0,g=0,e=h.length,b=!0;h&&e>f;f++)if(h[f].apply(l[0],l[1])===!1&&a.stopOnFalse){c=!1;break}b=!1,h&&(i?i.length&&j(i.shift()):c?h=[]:k.disable())},k={add:function(){if(h){var d=h.length;!function f(b){n.each(b,function(b,c){var d=n.type(c);"function"===d?a.unique&&k.has(c)||h.push(c):c&&c.length&&"string"!==d&&f(c)})}(arguments),b?e=h.length:c&&(g=d,j(c))}return this},remove:function(){return h&&n.each(arguments,function(a,c){var d;while((d=n.inArray(c,h,d))>-1)h.splice(d,1),b&&(e>=d&&e--,f>=d&&f--)}),this},has:function(a){return a?n.inArray(a,h)>-1:!(!h||!h.length)},empty:function(){return h=[],e=0,this},disable:function(){return h=i=c=void 0,this},disabled:function(){return!h},lock:function(){return i=void 0,c||k.disable(),this},locked:function(){return!i},fireWith:function(a,c){return!h||d&&!i||(c=c||[],c=[a,c.slice?c.slice():c],b?i.push(c):j(c)),this},fire:function(){return k.fireWith(this,arguments),this},fired:function(){return!!d}};return k},n.extend({Deferred:function(a){var b=[["resolve","done",n.Callbacks("once memory"),"resolved"],["reject","fail",n.Callbacks("once memory"),"rejected"],["notify","progress",n.Callbacks("memory")]],c="pending",d={state:function(){return c},always:function(){return e.done(arguments).fail(arguments),this},then:function(){var a=arguments;return n.Deferred(function(c){n.each(b,function(b,f){var g=n.isFunction(a[b])&&a[b];e[f[1]](function(){var a=g&&g.apply(this,arguments);a&&n.isFunction(a.promise)?a.promise().done(c.resolve).fail(c.reject).progress(c.notify):c[f[0]+"With"](this===d?c.promise():this,g?[a]:arguments)})}),a=null}).promise()},promise:function(a){return null!=a?n.extend(a,d):d}},e={};return d.pipe=d.then,n.each(b,function(a,f){var g=f[2],h=f[3];d[f[1]]=g.add,h&&g.add(function(){c=h},b[1^a][2].disable,b[2][2].lock),e[f[0]]=function(){return e[f[0]+"With"](this===e?d:this,arguments),this},e[f[0]+"With"]=g.fireWith}),d.promise(e),a&&a.call(e,e),e},when:function(a){var b=0,c=d.call(arguments),e=c.length,f=1!==e||a&&n.isFunction(a.promise)?e:0,g=1===f?a:n.Deferred(),h=function(a,b,c){return function(e){b[a]=this,c[a]=arguments.length>1?d.call(arguments):e,c===i?g.notifyWith(b,c):--f||g.resolveWith(b,c)}},i,j,k;if(e>1)for(i=new Array(e),j=new Array(e),k=new Array(e);e>b;b++)c[b]&&n.isFunction(c[b].promise)?c[b].promise().done(h(b,k,c)).fail(g.reject).progress(h(b,j,i)):--f;return f||g.resolveWith(k,c),g.promise()}});var I;n.fn.ready=function(a){return n.ready.promise().done(a),this},n.extend({isReady:!1,readyWait:1,holdReady:function(a){a?n.readyWait++:n.ready(!0)},ready:function(a){if(a===!0?!--n.readyWait:!n.isReady){if(!z.body)return setTimeout(n.ready);n.isReady=!0,a!==!0&&--n.readyWait>0||(I.resolveWith(z,[n]),n.fn.trigger&&n(z).trigger("ready").off("ready"))}}});function J(){z.addEventListener?(z.removeEventListener("DOMContentLoaded",K,!1),a.removeEventListener("load",K,!1)):(z.detachEvent("onreadystatechange",K),a.detachEvent("onload",K))}function K(){(z.addEventListener||"load"===event.type||"complete"===z.readyState)&&(J(),n.ready())}n.ready.promise=function(b){if(!I)if(I=n.Deferred(),"complete"===z.readyState)setTimeout(n.ready);else if(z.addEventListener)z.addEventListener("DOMContentLoaded",K,!1),a.addEventListener("load",K,!1);else{z.attachEvent("onreadystatechange",K),a.attachEvent("onload",K);var c=!1;try{c=null==a.frameElement&&z.documentElement}catch(d){}c&&c.doScroll&&!function e(){if(!n.isReady){try{c.doScroll("left")}catch(a){return setTimeout(e,50)}J(),n.ready()}}()}return I.promise(b)};var L="undefined",M;for(M in n(l))break;l.ownLast="0"!==M,l.inlineBlockNeedsLayout=!1,n(function(){var a,b,c=z.getElementsByTagName("body")[0];c&&(a=z.createElement("div"),a.style.cssText="border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px",b=z.createElement("div"),c.appendChild(a).appendChild(b),typeof b.style.zoom!==L&&(b.style.cssText="border:0;margin:0;width:1px;padding:1px;display:inline;zoom:1",(l.inlineBlockNeedsLayout=3===b.offsetWidth)&&(c.style.zoom=1)),c.removeChild(a),a=b=null)}),function(){var a=z.createElement("div");if(null==l.deleteExpando){l.deleteExpando=!0;try{delete a.test}catch(b){l.deleteExpando=!1}}a=null}(),n.acceptData=function(a){var b=n.noData[(a.nodeName+" ").toLowerCase()],c=+a.nodeType||1;return 1!==c&&9!==c?!1:!b||b!==!0&&a.getAttribute("classid")===b};var N=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,O=/([A-Z])/g;function P(a,b,c){if(void 0===c&&1===a.nodeType){var d="data-"+b.replace(O,"-$1").toLowerCase();if(c=a.getAttribute(d),"string"==typeof c){try{c="true"===c?!0:"false"===c?!1:"null"===c?null:+c+""===c?+c:N.test(c)?n.parseJSON(c):c}catch(e){}n.data(a,b,c)}else c=void 0}return c}function Q(a){var b;for(b in a)if(("data"!==b||!n.isEmptyObject(a[b]))&&"toJSON"!==b)return!1;return!0}function R(a,b,d,e){if(n.acceptData(a)){var f,g,h=n.expando,i=a.nodeType,j=i?n.cache:a,k=i?a[h]:a[h]&&h;if(k&&j[k]&&(e||j[k].data)||void 0!==d||"string"!=typeof b)return k||(k=i?a[h]=c.pop()||n.guid++:h),j[k]||(j[k]=i?{}:{toJSON:n.noop}),("object"==typeof b||"function"==typeof b)&&(e?j[k]=n.extend(j[k],b):j[k].data=n.extend(j[k].data,b)),g=j[k],e||(g.data||(g.data={}),g=g.data),void 0!==d&&(g[n.camelCase(b)]=d),"string"==typeof b?(f=g[b],null==f&&(f=g[n.camelCase(b)])):f=g,f
}}function S(a,b,c){if(n.acceptData(a)){var d,e,f=a.nodeType,g=f?n.cache:a,h=f?a[n.expando]:n.expando;if(g[h]){if(b&&(d=c?g[h]:g[h].data)){n.isArray(b)?b=b.concat(n.map(b,n.camelCase)):b in d?b=[b]:(b=n.camelCase(b),b=b in d?[b]:b.split(" ")),e=b.length;while(e--)delete d[b[e]];if(c?!Q(d):!n.isEmptyObject(d))return}(c||(delete g[h].data,Q(g[h])))&&(f?n.cleanData([a],!0):l.deleteExpando||g!=g.window?delete g[h]:g[h]=null)}}}n.extend({cache:{},noData:{"applet ":!0,"embed ":!0,"object ":"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"},hasData:function(a){return a=a.nodeType?n.cache[a[n.expando]]:a[n.expando],!!a&&!Q(a)},data:function(a,b,c){return R(a,b,c)},removeData:function(a,b){return S(a,b)},_data:function(a,b,c){return R(a,b,c,!0)},_removeData:function(a,b){return S(a,b,!0)}}),n.fn.extend({data:function(a,b){var c,d,e,f=this[0],g=f&&f.attributes;if(void 0===a){if(this.length&&(e=n.data(f),1===f.nodeType&&!n._data(f,"parsedAttrs"))){c=g.length;while(c--)d=g[c].name,0===d.indexOf("data-")&&(d=n.camelCase(d.slice(5)),P(f,d,e[d]));n._data(f,"parsedAttrs",!0)}return e}return"object"==typeof a?this.each(function(){n.data(this,a)}):arguments.length>1?this.each(function(){n.data(this,a,b)}):f?P(f,a,n.data(f,a)):void 0},removeData:function(a){return this.each(function(){n.removeData(this,a)})}}),n.extend({queue:function(a,b,c){var d;return a?(b=(b||"fx")+"queue",d=n._data(a,b),c&&(!d||n.isArray(c)?d=n._data(a,b,n.makeArray(c)):d.push(c)),d||[]):void 0},dequeue:function(a,b){b=b||"fx";var c=n.queue(a,b),d=c.length,e=c.shift(),f=n._queueHooks(a,b),g=function(){n.dequeue(a,b)};"inprogress"===e&&(e=c.shift(),d--),e&&("fx"===b&&c.unshift("inprogress"),delete f.stop,e.call(a,g,f)),!d&&f&&f.empty.fire()},_queueHooks:function(a,b){var c=b+"queueHooks";return n._data(a,c)||n._data(a,c,{empty:n.Callbacks("once memory").add(function(){n._removeData(a,b+"queue"),n._removeData(a,c)})})}}),n.fn.extend({queue:function(a,b){var c=2;return"string"!=typeof a&&(b=a,a="fx",c--),arguments.length<c?n.queue(this[0],a):void 0===b?this:this.each(function(){var c=n.queue(this,a,b);n._queueHooks(this,a),"fx"===a&&"inprogress"!==c[0]&&n.dequeue(this,a)})},dequeue:function(a){return this.each(function(){n.dequeue(this,a)})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,b){var c,d=1,e=n.Deferred(),f=this,g=this.length,h=function(){--d||e.resolveWith(f,[f])};"string"!=typeof a&&(b=a,a=void 0),a=a||"fx";while(g--)c=n._data(f[g],a+"queueHooks"),c&&c.empty&&(d++,c.empty.add(h));return h(),e.promise(b)}});var T=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,U=["Top","Right","Bottom","Left"],V=function(a,b){return a=b||a,"none"===n.css(a,"display")||!n.contains(a.ownerDocument,a)},W=n.access=function(a,b,c,d,e,f,g){var h=0,i=a.length,j=null==c;if("object"===n.type(c)){e=!0;for(h in c)n.access(a,b,h,c[h],!0,f,g)}else if(void 0!==d&&(e=!0,n.isFunction(d)||(g=!0),j&&(g?(b.call(a,d),b=null):(j=b,b=function(a,b,c){return j.call(n(a),c)})),b))for(;i>h;h++)b(a[h],c,g?d:d.call(a[h],h,b(a[h],c)));return e?a:j?b.call(a):i?b(a[0],c):f},X=/^(?:checkbox|radio)$/i;!function(){var a=z.createDocumentFragment(),b=z.createElement("div"),c=z.createElement("input");if(b.setAttribute("className","t"),b.innerHTML="  <link/><table></table><a href='/a'>a</a>",l.leadingWhitespace=3===b.firstChild.nodeType,l.tbody=!b.getElementsByTagName("tbody").length,l.htmlSerialize=!!b.getElementsByTagName("link").length,l.html5Clone="<:nav></:nav>"!==z.createElement("nav").cloneNode(!0).outerHTML,c.type="checkbox",c.checked=!0,a.appendChild(c),l.appendChecked=c.checked,b.innerHTML="<textarea>x</textarea>",l.noCloneChecked=!!b.cloneNode(!0).lastChild.defaultValue,a.appendChild(b),b.innerHTML="<input type='radio' checked='checked' name='t'/>",l.checkClone=b.cloneNode(!0).cloneNode(!0).lastChild.checked,l.noCloneEvent=!0,b.attachEvent&&(b.attachEvent("onclick",function(){l.noCloneEvent=!1}),b.cloneNode(!0).click()),null==l.deleteExpando){l.deleteExpando=!0;try{delete b.test}catch(d){l.deleteExpando=!1}}a=b=c=null}(),function(){var b,c,d=z.createElement("div");for(b in{submit:!0,change:!0,focusin:!0})c="on"+b,(l[b+"Bubbles"]=c in a)||(d.setAttribute(c,"t"),l[b+"Bubbles"]=d.attributes[c].expando===!1);d=null}();var Y=/^(?:input|select|textarea)$/i,Z=/^key/,$=/^(?:mouse|contextmenu)|click/,_=/^(?:focusinfocus|focusoutblur)$/,ab=/^([^.]*)(?:\.(.+)|)$/;function bb(){return!0}function cb(){return!1}function db(){try{return z.activeElement}catch(a){}}n.event={global:{},add:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,o,p,q,r=n._data(a);if(r){c.handler&&(i=c,c=i.handler,e=i.selector),c.guid||(c.guid=n.guid++),(g=r.events)||(g=r.events={}),(k=r.handle)||(k=r.handle=function(a){return typeof n===L||a&&n.event.triggered===a.type?void 0:n.event.dispatch.apply(k.elem,arguments)},k.elem=a),b=(b||"").match(F)||[""],h=b.length;while(h--)f=ab.exec(b[h])||[],o=q=f[1],p=(f[2]||"").split(".").sort(),o&&(j=n.event.special[o]||{},o=(e?j.delegateType:j.bindType)||o,j=n.event.special[o]||{},l=n.extend({type:o,origType:q,data:d,handler:c,guid:c.guid,selector:e,needsContext:e&&n.expr.match.needsContext.test(e),namespace:p.join(".")},i),(m=g[o])||(m=g[o]=[],m.delegateCount=0,j.setup&&j.setup.call(a,d,p,k)!==!1||(a.addEventListener?a.addEventListener(o,k,!1):a.attachEvent&&a.attachEvent("on"+o,k))),j.add&&(j.add.call(a,l),l.handler.guid||(l.handler.guid=c.guid)),e?m.splice(m.delegateCount++,0,l):m.push(l),n.event.global[o]=!0);a=null}},remove:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,o,p,q,r=n.hasData(a)&&n._data(a);if(r&&(k=r.events)){b=(b||"").match(F)||[""],j=b.length;while(j--)if(h=ab.exec(b[j])||[],o=q=h[1],p=(h[2]||"").split(".").sort(),o){l=n.event.special[o]||{},o=(d?l.delegateType:l.bindType)||o,m=k[o]||[],h=h[2]&&new RegExp("(^|\\.)"+p.join("\\.(?:.*\\.|)")+"(\\.|$)"),i=f=m.length;while(f--)g=m[f],!e&&q!==g.origType||c&&c.guid!==g.guid||h&&!h.test(g.namespace)||d&&d!==g.selector&&("**"!==d||!g.selector)||(m.splice(f,1),g.selector&&m.delegateCount--,l.remove&&l.remove.call(a,g));i&&!m.length&&(l.teardown&&l.teardown.call(a,p,r.handle)!==!1||n.removeEvent(a,o,r.handle),delete k[o])}else for(o in k)n.event.remove(a,o+b[j],c,d,!0);n.isEmptyObject(k)&&(delete r.handle,n._removeData(a,"events"))}},trigger:function(b,c,d,e){var f,g,h,i,k,l,m,o=[d||z],p=j.call(b,"type")?b.type:b,q=j.call(b,"namespace")?b.namespace.split("."):[];if(h=l=d=d||z,3!==d.nodeType&&8!==d.nodeType&&!_.test(p+n.event.triggered)&&(p.indexOf(".")>=0&&(q=p.split("."),p=q.shift(),q.sort()),g=p.indexOf(":")<0&&"on"+p,b=b[n.expando]?b:new n.Event(p,"object"==typeof b&&b),b.isTrigger=e?2:3,b.namespace=q.join("."),b.namespace_re=b.namespace?new RegExp("(^|\\.)"+q.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,b.result=void 0,b.target||(b.target=d),c=null==c?[b]:n.makeArray(c,[b]),k=n.event.special[p]||{},e||!k.trigger||k.trigger.apply(d,c)!==!1)){if(!e&&!k.noBubble&&!n.isWindow(d)){for(i=k.delegateType||p,_.test(i+p)||(h=h.parentNode);h;h=h.parentNode)o.push(h),l=h;l===(d.ownerDocument||z)&&o.push(l.defaultView||l.parentWindow||a)}m=0;while((h=o[m++])&&!b.isPropagationStopped())b.type=m>1?i:k.bindType||p,f=(n._data(h,"events")||{})[b.type]&&n._data(h,"handle"),f&&f.apply(h,c),f=g&&h[g],f&&f.apply&&n.acceptData(h)&&(b.result=f.apply(h,c),b.result===!1&&b.preventDefault());if(b.type=p,!e&&!b.isDefaultPrevented()&&(!k._default||k._default.apply(o.pop(),c)===!1)&&n.acceptData(d)&&g&&d[p]&&!n.isWindow(d)){l=d[g],l&&(d[g]=null),n.event.triggered=p;try{d[p]()}catch(r){}n.event.triggered=void 0,l&&(d[g]=l)}return b.result}},dispatch:function(a){a=n.event.fix(a);var b,c,e,f,g,h=[],i=d.call(arguments),j=(n._data(this,"events")||{})[a.type]||[],k=n.event.special[a.type]||{};if(i[0]=a,a.delegateTarget=this,!k.preDispatch||k.preDispatch.call(this,a)!==!1){h=n.event.handlers.call(this,a,j),b=0;while((f=h[b++])&&!a.isPropagationStopped()){a.currentTarget=f.elem,g=0;while((e=f.handlers[g++])&&!a.isImmediatePropagationStopped())(!a.namespace_re||a.namespace_re.test(e.namespace))&&(a.handleObj=e,a.data=e.data,c=((n.event.special[e.origType]||{}).handle||e.handler).apply(f.elem,i),void 0!==c&&(a.result=c)===!1&&(a.preventDefault(),a.stopPropagation()))}return k.postDispatch&&k.postDispatch.call(this,a),a.result}},handlers:function(a,b){var c,d,e,f,g=[],h=b.delegateCount,i=a.target;if(h&&i.nodeType&&(!a.button||"click"!==a.type))for(;i!=this;i=i.parentNode||this)if(1===i.nodeType&&(i.disabled!==!0||"click"!==a.type)){for(e=[],f=0;h>f;f++)d=b[f],c=d.selector+" ",void 0===e[c]&&(e[c]=d.needsContext?n(c,this).index(i)>=0:n.find(c,this,null,[i]).length),e[c]&&e.push(d);e.length&&g.push({elem:i,handlers:e})}return h<b.length&&g.push({elem:this,handlers:b.slice(h)}),g},fix:function(a){if(a[n.expando])return a;var b,c,d,e=a.type,f=a,g=this.fixHooks[e];g||(this.fixHooks[e]=g=$.test(e)?this.mouseHooks:Z.test(e)?this.keyHooks:{}),d=g.props?this.props.concat(g.props):this.props,a=new n.Event(f),b=d.length;while(b--)c=d[b],a[c]=f[c];return a.target||(a.target=f.srcElement||z),3===a.target.nodeType&&(a.target=a.target.parentNode),a.metaKey=!!a.metaKey,g.filter?g.filter(a,f):a},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){return null==a.which&&(a.which=null!=b.charCode?b.charCode:b.keyCode),a}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,b){var c,d,e,f=b.button,g=b.fromElement;return null==a.pageX&&null!=b.clientX&&(d=a.target.ownerDocument||z,e=d.documentElement,c=d.body,a.pageX=b.clientX+(e&&e.scrollLeft||c&&c.scrollLeft||0)-(e&&e.clientLeft||c&&c.clientLeft||0),a.pageY=b.clientY+(e&&e.scrollTop||c&&c.scrollTop||0)-(e&&e.clientTop||c&&c.clientTop||0)),!a.relatedTarget&&g&&(a.relatedTarget=g===a.target?b.toElement:g),a.which||void 0===f||(a.which=1&f?1:2&f?3:4&f?2:0),a}},special:{load:{noBubble:!0},focus:{trigger:function(){if(this!==db()&&this.focus)try{return this.focus(),!1}catch(a){}},delegateType:"focusin"},blur:{trigger:function(){return this===db()&&this.blur?(this.blur(),!1):void 0},delegateType:"focusout"},click:{trigger:function(){return n.nodeName(this,"input")&&"checkbox"===this.type&&this.click?(this.click(),!1):void 0},_default:function(a){return n.nodeName(a.target,"a")}},beforeunload:{postDispatch:function(a){void 0!==a.result&&(a.originalEvent.returnValue=a.result)}}},simulate:function(a,b,c,d){var e=n.extend(new n.Event,c,{type:a,isSimulated:!0,originalEvent:{}});d?n.event.trigger(e,null,b):n.event.dispatch.call(b,e),e.isDefaultPrevented()&&c.preventDefault()}},n.removeEvent=z.removeEventListener?function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1)}:function(a,b,c){var d="on"+b;a.detachEvent&&(typeof a[d]===L&&(a[d]=null),a.detachEvent(d,c))},n.Event=function(a,b){return this instanceof n.Event?(a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||void 0===a.defaultPrevented&&(a.returnValue===!1||a.getPreventDefault&&a.getPreventDefault())?bb:cb):this.type=a,b&&n.extend(this,b),this.timeStamp=a&&a.timeStamp||n.now(),void(this[n.expando]=!0)):new n.Event(a,b)},n.Event.prototype={isDefaultPrevented:cb,isPropagationStopped:cb,isImmediatePropagationStopped:cb,preventDefault:function(){var a=this.originalEvent;this.isDefaultPrevented=bb,a&&(a.preventDefault?a.preventDefault():a.returnValue=!1)},stopPropagation:function(){var a=this.originalEvent;this.isPropagationStopped=bb,a&&(a.stopPropagation&&a.stopPropagation(),a.cancelBubble=!0)},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=bb,this.stopPropagation()}},n.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(a,b){n.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c,d=this,e=a.relatedTarget,f=a.handleObj;return(!e||e!==d&&!n.contains(d,e))&&(a.type=f.origType,c=f.handler.apply(this,arguments),a.type=b),c}}}),l.submitBubbles||(n.event.special.submit={setup:function(){return n.nodeName(this,"form")?!1:void n.event.add(this,"click._submit keypress._submit",function(a){var b=a.target,c=n.nodeName(b,"input")||n.nodeName(b,"button")?b.form:void 0;c&&!n._data(c,"submitBubbles")&&(n.event.add(c,"submit._submit",function(a){a._submit_bubble=!0}),n._data(c,"submitBubbles",!0))})},postDispatch:function(a){a._submit_bubble&&(delete a._submit_bubble,this.parentNode&&!a.isTrigger&&n.event.simulate("submit",this.parentNode,a,!0))},teardown:function(){return n.nodeName(this,"form")?!1:void n.event.remove(this,"._submit")}}),l.changeBubbles||(n.event.special.change={setup:function(){return Y.test(this.nodeName)?(("checkbox"===this.type||"radio"===this.type)&&(n.event.add(this,"propertychange._change",function(a){"checked"===a.originalEvent.propertyName&&(this._just_changed=!0)}),n.event.add(this,"click._change",function(a){this._just_changed&&!a.isTrigger&&(this._just_changed=!1),n.event.simulate("change",this,a,!0)})),!1):void n.event.add(this,"beforeactivate._change",function(a){var b=a.target;Y.test(b.nodeName)&&!n._data(b,"changeBubbles")&&(n.event.add(b,"change._change",function(a){!this.parentNode||a.isSimulated||a.isTrigger||n.event.simulate("change",this.parentNode,a,!0)}),n._data(b,"changeBubbles",!0))})},handle:function(a){var b=a.target;return this!==b||a.isSimulated||a.isTrigger||"radio"!==b.type&&"checkbox"!==b.type?a.handleObj.handler.apply(this,arguments):void 0},teardown:function(){return n.event.remove(this,"._change"),!Y.test(this.nodeName)}}),l.focusinBubbles||n.each({focus:"focusin",blur:"focusout"},function(a,b){var c=function(a){n.event.simulate(b,a.target,n.event.fix(a),!0)};n.event.special[b]={setup:function(){var d=this.ownerDocument||this,e=n._data(d,b);e||d.addEventListener(a,c,!0),n._data(d,b,(e||0)+1)},teardown:function(){var d=this.ownerDocument||this,e=n._data(d,b)-1;e?n._data(d,b,e):(d.removeEventListener(a,c,!0),n._removeData(d,b))}}}),n.fn.extend({on:function(a,b,c,d,e){var f,g;if("object"==typeof a){"string"!=typeof b&&(c=c||b,b=void 0);for(f in a)this.on(f,b,c,a[f],e);return this}if(null==c&&null==d?(d=b,c=b=void 0):null==d&&("string"==typeof b?(d=c,c=void 0):(d=c,c=b,b=void 0)),d===!1)d=cb;else if(!d)return this;return 1===e&&(g=d,d=function(a){return n().off(a),g.apply(this,arguments)},d.guid=g.guid||(g.guid=n.guid++)),this.each(function(){n.event.add(this,a,d,c,b)})},one:function(a,b,c,d){return this.on(a,b,c,d,1)},off:function(a,b,c){var d,e;if(a&&a.preventDefault&&a.handleObj)return d=a.handleObj,n(a.delegateTarget).off(d.namespace?d.origType+"."+d.namespace:d.origType,d.selector,d.handler),this;if("object"==typeof a){for(e in a)this.off(e,b,a[e]);return this}return(b===!1||"function"==typeof b)&&(c=b,b=void 0),c===!1&&(c=cb),this.each(function(){n.event.remove(this,a,c,b)})},trigger:function(a,b){return this.each(function(){n.event.trigger(a,b,this)})},triggerHandler:function(a,b){var c=this[0];return c?n.event.trigger(a,b,c,!0):void 0}});function eb(a){var b=fb.split("|"),c=a.createDocumentFragment();if(c.createElement)while(b.length)c.createElement(b.pop());return c}var fb="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",gb=/ jQuery\d+="(?:null|\d+)"/g,hb=new RegExp("<(?:"+fb+")[\\s/>]","i"),ib=/^\s+/,jb=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,kb=/<([\w:]+)/,lb=/<tbody/i,mb=/<|&#?\w+;/,nb=/<(?:script|style|link)/i,ob=/checked\s*(?:[^=]|=\s*.checked.)/i,pb=/^$|\/(?:java|ecma)script/i,qb=/^true\/(.*)/,rb=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,sb={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],area:[1,"<map>","</map>"],param:[1,"<object>","</object>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:l.htmlSerialize?[0,"",""]:[1,"X<div>","</div>"]},tb=eb(z),ub=tb.appendChild(z.createElement("div"));sb.optgroup=sb.option,sb.tbody=sb.tfoot=sb.colgroup=sb.caption=sb.thead,sb.th=sb.td;function vb(a,b){var c,d,e=0,f=typeof a.getElementsByTagName!==L?a.getElementsByTagName(b||"*"):typeof a.querySelectorAll!==L?a.querySelectorAll(b||"*"):void 0;if(!f)for(f=[],c=a.childNodes||a;null!=(d=c[e]);e++)!b||n.nodeName(d,b)?f.push(d):n.merge(f,vb(d,b));return void 0===b||b&&n.nodeName(a,b)?n.merge([a],f):f}function wb(a){X.test(a.type)&&(a.defaultChecked=a.checked)}function xb(a,b){return n.nodeName(a,"table")&&n.nodeName(11!==b.nodeType?b:b.firstChild,"tr")?a.getElementsByTagName("tbody")[0]||a.appendChild(a.ownerDocument.createElement("tbody")):a}function yb(a){return a.type=(null!==n.find.attr(a,"type"))+"/"+a.type,a}function zb(a){var b=qb.exec(a.type);return b?a.type=b[1]:a.removeAttribute("type"),a}function Ab(a,b){for(var c,d=0;null!=(c=a[d]);d++)n._data(c,"globalEval",!b||n._data(b[d],"globalEval"))}function Bb(a,b){if(1===b.nodeType&&n.hasData(a)){var c,d,e,f=n._data(a),g=n._data(b,f),h=f.events;if(h){delete g.handle,g.events={};for(c in h)for(d=0,e=h[c].length;e>d;d++)n.event.add(b,c,h[c][d])}g.data&&(g.data=n.extend({},g.data))}}function Cb(a,b){var c,d,e;if(1===b.nodeType){if(c=b.nodeName.toLowerCase(),!l.noCloneEvent&&b[n.expando]){e=n._data(b);for(d in e.events)n.removeEvent(b,d,e.handle);b.removeAttribute(n.expando)}"script"===c&&b.text!==a.text?(yb(b).text=a.text,zb(b)):"object"===c?(b.parentNode&&(b.outerHTML=a.outerHTML),l.html5Clone&&a.innerHTML&&!n.trim(b.innerHTML)&&(b.innerHTML=a.innerHTML)):"input"===c&&X.test(a.type)?(b.defaultChecked=b.checked=a.checked,b.value!==a.value&&(b.value=a.value)):"option"===c?b.defaultSelected=b.selected=a.defaultSelected:("input"===c||"textarea"===c)&&(b.defaultValue=a.defaultValue)}}n.extend({clone:function(a,b,c){var d,e,f,g,h,i=n.contains(a.ownerDocument,a);if(l.html5Clone||n.isXMLDoc(a)||!hb.test("<"+a.nodeName+">")?f=a.cloneNode(!0):(ub.innerHTML=a.outerHTML,ub.removeChild(f=ub.firstChild)),!(l.noCloneEvent&&l.noCloneChecked||1!==a.nodeType&&11!==a.nodeType||n.isXMLDoc(a)))for(d=vb(f),h=vb(a),g=0;null!=(e=h[g]);++g)d[g]&&Cb(e,d[g]);if(b)if(c)for(h=h||vb(a),d=d||vb(f),g=0;null!=(e=h[g]);g++)Bb(e,d[g]);else Bb(a,f);return d=vb(f,"script"),d.length>0&&Ab(d,!i&&vb(a,"script")),d=h=e=null,f},buildFragment:function(a,b,c,d){for(var e,f,g,h,i,j,k,m=a.length,o=eb(b),p=[],q=0;m>q;q++)if(f=a[q],f||0===f)if("object"===n.type(f))n.merge(p,f.nodeType?[f]:f);else if(mb.test(f)){h=h||o.appendChild(b.createElement("div")),i=(kb.exec(f)||["",""])[1].toLowerCase(),k=sb[i]||sb._default,h.innerHTML=k[1]+f.replace(jb,"<$1></$2>")+k[2],e=k[0];while(e--)h=h.lastChild;if(!l.leadingWhitespace&&ib.test(f)&&p.push(b.createTextNode(ib.exec(f)[0])),!l.tbody){f="table"!==i||lb.test(f)?"<table>"!==k[1]||lb.test(f)?0:h:h.firstChild,e=f&&f.childNodes.length;while(e--)n.nodeName(j=f.childNodes[e],"tbody")&&!j.childNodes.length&&f.removeChild(j)}n.merge(p,h.childNodes),h.textContent="";while(h.firstChild)h.removeChild(h.firstChild);h=o.lastChild}else p.push(b.createTextNode(f));h&&o.removeChild(h),l.appendChecked||n.grep(vb(p,"input"),wb),q=0;while(f=p[q++])if((!d||-1===n.inArray(f,d))&&(g=n.contains(f.ownerDocument,f),h=vb(o.appendChild(f),"script"),g&&Ab(h),c)){e=0;while(f=h[e++])pb.test(f.type||"")&&c.push(f)}return h=null,o},cleanData:function(a,b){for(var d,e,f,g,h=0,i=n.expando,j=n.cache,k=l.deleteExpando,m=n.event.special;null!=(d=a[h]);h++)if((b||n.acceptData(d))&&(f=d[i],g=f&&j[f])){if(g.events)for(e in g.events)m[e]?n.event.remove(d,e):n.removeEvent(d,e,g.handle);j[f]&&(delete j[f],k?delete d[i]:typeof d.removeAttribute!==L?d.removeAttribute(i):d[i]=null,c.push(f))}}}),n.fn.extend({text:function(a){return W(this,function(a){return void 0===a?n.text(this):this.empty().append((this[0]&&this[0].ownerDocument||z).createTextNode(a))},null,a,arguments.length)},append:function(){return this.domManip(arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=xb(this,a);b.appendChild(a)}})},prepend:function(){return this.domManip(arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=xb(this,a);b.insertBefore(a,b.firstChild)}})},before:function(){return this.domManip(arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this)})},after:function(){return this.domManip(arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this.nextSibling)})},remove:function(a,b){for(var c,d=a?n.filter(a,this):this,e=0;null!=(c=d[e]);e++)b||1!==c.nodeType||n.cleanData(vb(c)),c.parentNode&&(b&&n.contains(c.ownerDocument,c)&&Ab(vb(c,"script")),c.parentNode.removeChild(c));return this},empty:function(){for(var a,b=0;null!=(a=this[b]);b++){1===a.nodeType&&n.cleanData(vb(a,!1));while(a.firstChild)a.removeChild(a.firstChild);a.options&&n.nodeName(a,"select")&&(a.options.length=0)}return this},clone:function(a,b){return a=null==a?!1:a,b=null==b?a:b,this.map(function(){return n.clone(this,a,b)})},html:function(a){return W(this,function(a){var b=this[0]||{},c=0,d=this.length;if(void 0===a)return 1===b.nodeType?b.innerHTML.replace(gb,""):void 0;if(!("string"!=typeof a||nb.test(a)||!l.htmlSerialize&&hb.test(a)||!l.leadingWhitespace&&ib.test(a)||sb[(kb.exec(a)||["",""])[1].toLowerCase()])){a=a.replace(jb,"<$1></$2>");try{for(;d>c;c++)b=this[c]||{},1===b.nodeType&&(n.cleanData(vb(b,!1)),b.innerHTML=a);b=0}catch(e){}}b&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(){var a=arguments[0];return this.domManip(arguments,function(b){a=this.parentNode,n.cleanData(vb(this)),a&&a.replaceChild(b,this)}),a&&(a.length||a.nodeType)?this:this.remove()},detach:function(a){return this.remove(a,!0)},domManip:function(a,b){a=e.apply([],a);var c,d,f,g,h,i,j=0,k=this.length,m=this,o=k-1,p=a[0],q=n.isFunction(p);if(q||k>1&&"string"==typeof p&&!l.checkClone&&ob.test(p))return this.each(function(c){var d=m.eq(c);q&&(a[0]=p.call(this,c,d.html())),d.domManip(a,b)});if(k&&(i=n.buildFragment(a,this[0].ownerDocument,!1,this),c=i.firstChild,1===i.childNodes.length&&(i=c),c)){for(g=n.map(vb(i,"script"),yb),f=g.length;k>j;j++)d=i,j!==o&&(d=n.clone(d,!0,!0),f&&n.merge(g,vb(d,"script"))),b.call(this[j],d,j);if(f)for(h=g[g.length-1].ownerDocument,n.map(g,zb),j=0;f>j;j++)d=g[j],pb.test(d.type||"")&&!n._data(d,"globalEval")&&n.contains(h,d)&&(d.src?n._evalUrl&&n._evalUrl(d.src):n.globalEval((d.text||d.textContent||d.innerHTML||"").replace(rb,"")));i=c=null}return this}}),n.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){n.fn[a]=function(a){for(var c,d=0,e=[],g=n(a),h=g.length-1;h>=d;d++)c=d===h?this:this.clone(!0),n(g[d])[b](c),f.apply(e,c.get());return this.pushStack(e)}});var Db,Eb={};function Fb(b,c){var d=n(c.createElement(b)).appendTo(c.body),e=a.getDefaultComputedStyle?a.getDefaultComputedStyle(d[0]).display:n.css(d[0],"display");return d.detach(),e}function Gb(a){var b=z,c=Eb[a];return c||(c=Fb(a,b),"none"!==c&&c||(Db=(Db||n("<iframe frameborder='0' width='0' height='0'/>")).appendTo(b.documentElement),b=(Db[0].contentWindow||Db[0].contentDocument).document,b.write(),b.close(),c=Fb(a,b),Db.detach()),Eb[a]=c),c}!function(){var a,b,c=z.createElement("div"),d="-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;padding:0;margin:0;border:0";c.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",a=c.getElementsByTagName("a")[0],a.style.cssText="float:left;opacity:.5",l.opacity=/^0.5/.test(a.style.opacity),l.cssFloat=!!a.style.cssFloat,c.style.backgroundClip="content-box",c.cloneNode(!0).style.backgroundClip="",l.clearCloneStyle="content-box"===c.style.backgroundClip,a=c=null,l.shrinkWrapBlocks=function(){var a,c,e,f;if(null==b){if(a=z.getElementsByTagName("body")[0],!a)return;f="border:0;width:0;height:0;position:absolute;top:0;left:-9999px",c=z.createElement("div"),e=z.createElement("div"),a.appendChild(c).appendChild(e),b=!1,typeof e.style.zoom!==L&&(e.style.cssText=d+";width:1px;padding:1px;zoom:1",e.innerHTML="<div></div>",e.firstChild.style.width="5px",b=3!==e.offsetWidth),a.removeChild(c),a=c=e=null}return b}}();var Hb=/^margin/,Ib=new RegExp("^("+T+")(?!px)[a-z%]+$","i"),Jb,Kb,Lb=/^(top|right|bottom|left)$/;a.getComputedStyle?(Jb=function(a){return a.ownerDocument.defaultView.getComputedStyle(a,null)},Kb=function(a,b,c){var d,e,f,g,h=a.style;return c=c||Jb(a),g=c?c.getPropertyValue(b)||c[b]:void 0,c&&(""!==g||n.contains(a.ownerDocument,a)||(g=n.style(a,b)),Ib.test(g)&&Hb.test(b)&&(d=h.width,e=h.minWidth,f=h.maxWidth,h.minWidth=h.maxWidth=h.width=g,g=c.width,h.width=d,h.minWidth=e,h.maxWidth=f)),void 0===g?g:g+""}):z.documentElement.currentStyle&&(Jb=function(a){return a.currentStyle},Kb=function(a,b,c){var d,e,f,g,h=a.style;return c=c||Jb(a),g=c?c[b]:void 0,null==g&&h&&h[b]&&(g=h[b]),Ib.test(g)&&!Lb.test(b)&&(d=h.left,e=a.runtimeStyle,f=e&&e.left,f&&(e.left=a.currentStyle.left),h.left="fontSize"===b?"1em":g,g=h.pixelLeft+"px",h.left=d,f&&(e.left=f)),void 0===g?g:g+""||"auto"});function Mb(a,b){return{get:function(){var c=a();if(null!=c)return c?void delete this.get:(this.get=b).apply(this,arguments)}}}!function(){var b,c,d,e,f,g,h=z.createElement("div"),i="border:0;width:0;height:0;position:absolute;top:0;left:-9999px",j="-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;padding:0;margin:0;border:0";h.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",b=h.getElementsByTagName("a")[0],b.style.cssText="float:left;opacity:.5",l.opacity=/^0.5/.test(b.style.opacity),l.cssFloat=!!b.style.cssFloat,h.style.backgroundClip="content-box",h.cloneNode(!0).style.backgroundClip="",l.clearCloneStyle="content-box"===h.style.backgroundClip,b=h=null,n.extend(l,{reliableHiddenOffsets:function(){if(null!=c)return c;var a,b,d,e=z.createElement("div"),f=z.getElementsByTagName("body")[0];if(f)return e.setAttribute("className","t"),e.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",a=z.createElement("div"),a.style.cssText=i,f.appendChild(a).appendChild(e),e.innerHTML="<table><tr><td></td><td>t</td></tr></table>",b=e.getElementsByTagName("td"),b[0].style.cssText="padding:0;margin:0;border:0;display:none",d=0===b[0].offsetHeight,b[0].style.display="",b[1].style.display="none",c=d&&0===b[0].offsetHeight,f.removeChild(a),e=f=null,c},boxSizing:function(){return null==d&&k(),d},boxSizingReliable:function(){return null==e&&k(),e},pixelPosition:function(){return null==f&&k(),f},reliableMarginRight:function(){var b,c,d,e;if(null==g&&a.getComputedStyle){if(b=z.getElementsByTagName("body")[0],!b)return;c=z.createElement("div"),d=z.createElement("div"),c.style.cssText=i,b.appendChild(c).appendChild(d),e=d.appendChild(z.createElement("div")),e.style.cssText=d.style.cssText=j,e.style.marginRight=e.style.width="0",d.style.width="1px",g=!parseFloat((a.getComputedStyle(e,null)||{}).marginRight),b.removeChild(c)}return g}});function k(){var b,c,h=z.getElementsByTagName("body")[0];h&&(b=z.createElement("div"),c=z.createElement("div"),b.style.cssText=i,h.appendChild(b).appendChild(c),c.style.cssText="-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;position:absolute;display:block;padding:1px;border:1px;width:4px;margin-top:1%;top:1%",n.swap(h,null!=h.style.zoom?{zoom:1}:{},function(){d=4===c.offsetWidth}),e=!0,f=!1,g=!0,a.getComputedStyle&&(f="1%"!==(a.getComputedStyle(c,null)||{}).top,e="4px"===(a.getComputedStyle(c,null)||{width:"4px"}).width),h.removeChild(b),c=h=null)}}(),n.swap=function(a,b,c,d){var e,f,g={};for(f in b)g[f]=a.style[f],a.style[f]=b[f];e=c.apply(a,d||[]);for(f in b)a.style[f]=g[f];return e};var Nb=/alpha\([^)]*\)/i,Ob=/opacity\s*=\s*([^)]*)/,Pb=/^(none|table(?!-c[ea]).+)/,Qb=new RegExp("^("+T+")(.*)$","i"),Rb=new RegExp("^([+-])=("+T+")","i"),Sb={position:"absolute",visibility:"hidden",display:"block"},Tb={letterSpacing:0,fontWeight:400},Ub=["Webkit","O","Moz","ms"];function Vb(a,b){if(b in a)return b;var c=b.charAt(0).toUpperCase()+b.slice(1),d=b,e=Ub.length;while(e--)if(b=Ub[e]+c,b in a)return b;return d}function Wb(a,b){for(var c,d,e,f=[],g=0,h=a.length;h>g;g++)d=a[g],d.style&&(f[g]=n._data(d,"olddisplay"),c=d.style.display,b?(f[g]||"none"!==c||(d.style.display=""),""===d.style.display&&V(d)&&(f[g]=n._data(d,"olddisplay",Gb(d.nodeName)))):f[g]||(e=V(d),(c&&"none"!==c||!e)&&n._data(d,"olddisplay",e?c:n.css(d,"display"))));for(g=0;h>g;g++)d=a[g],d.style&&(b&&"none"!==d.style.display&&""!==d.style.display||(d.style.display=b?f[g]||"":"none"));return a}function Xb(a,b,c){var d=Qb.exec(b);return d?Math.max(0,d[1]-(c||0))+(d[2]||"px"):b}function Yb(a,b,c,d,e){for(var f=c===(d?"border":"content")?4:"width"===b?1:0,g=0;4>f;f+=2)"margin"===c&&(g+=n.css(a,c+U[f],!0,e)),d?("content"===c&&(g-=n.css(a,"padding"+U[f],!0,e)),"margin"!==c&&(g-=n.css(a,"border"+U[f]+"Width",!0,e))):(g+=n.css(a,"padding"+U[f],!0,e),"padding"!==c&&(g+=n.css(a,"border"+U[f]+"Width",!0,e)));return g}function Zb(a,b,c){var d=!0,e="width"===b?a.offsetWidth:a.offsetHeight,f=Jb(a),g=l.boxSizing()&&"border-box"===n.css(a,"boxSizing",!1,f);if(0>=e||null==e){if(e=Kb(a,b,f),(0>e||null==e)&&(e=a.style[b]),Ib.test(e))return e;d=g&&(l.boxSizingReliable()||e===a.style[b]),e=parseFloat(e)||0}return e+Yb(a,b,c||(g?"border":"content"),d,f)+"px"}n.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=Kb(a,"opacity");return""===c?"1":c}}}},cssNumber:{columnCount:!0,fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":l.cssFloat?"cssFloat":"styleFloat"},style:function(a,b,c,d){if(a&&3!==a.nodeType&&8!==a.nodeType&&a.style){var e,f,g,h=n.camelCase(b),i=a.style;if(b=n.cssProps[h]||(n.cssProps[h]=Vb(i,h)),g=n.cssHooks[b]||n.cssHooks[h],void 0===c)return g&&"get"in g&&void 0!==(e=g.get(a,!1,d))?e:i[b];if(f=typeof c,"string"===f&&(e=Rb.exec(c))&&(c=(e[1]+1)*e[2]+parseFloat(n.css(a,b)),f="number"),null!=c&&c===c&&("number"!==f||n.cssNumber[h]||(c+="px"),l.clearCloneStyle||""!==c||0!==b.indexOf("background")||(i[b]="inherit"),!(g&&"set"in g&&void 0===(c=g.set(a,c,d)))))try{i[b]="",i[b]=c}catch(j){}}},css:function(a,b,c,d){var e,f,g,h=n.camelCase(b);return b=n.cssProps[h]||(n.cssProps[h]=Vb(a.style,h)),g=n.cssHooks[b]||n.cssHooks[h],g&&"get"in g&&(f=g.get(a,!0,c)),void 0===f&&(f=Kb(a,b,d)),"normal"===f&&b in Tb&&(f=Tb[b]),""===c||c?(e=parseFloat(f),c===!0||n.isNumeric(e)?e||0:f):f}}),n.each(["height","width"],function(a,b){n.cssHooks[b]={get:function(a,c,d){return c?0===a.offsetWidth&&Pb.test(n.css(a,"display"))?n.swap(a,Sb,function(){return Zb(a,b,d)}):Zb(a,b,d):void 0},set:function(a,c,d){var e=d&&Jb(a);return Xb(a,c,d?Yb(a,b,d,l.boxSizing()&&"border-box"===n.css(a,"boxSizing",!1,e),e):0)}}}),l.opacity||(n.cssHooks.opacity={get:function(a,b){return Ob.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?.01*parseFloat(RegExp.$1)+"":b?"1":""},set:function(a,b){var c=a.style,d=a.currentStyle,e=n.isNumeric(b)?"alpha(opacity="+100*b+")":"",f=d&&d.filter||c.filter||"";c.zoom=1,(b>=1||""===b)&&""===n.trim(f.replace(Nb,""))&&c.removeAttribute&&(c.removeAttribute("filter"),""===b||d&&!d.filter)||(c.filter=Nb.test(f)?f.replace(Nb,e):f+" "+e)}}),n.cssHooks.marginRight=Mb(l.reliableMarginRight,function(a,b){return b?n.swap(a,{display:"inline-block"},Kb,[a,"marginRight"]):void 0}),n.each({margin:"",padding:"",border:"Width"},function(a,b){n.cssHooks[a+b]={expand:function(c){for(var d=0,e={},f="string"==typeof c?c.split(" "):[c];4>d;d++)e[a+U[d]+b]=f[d]||f[d-2]||f[0];return e}},Hb.test(a)||(n.cssHooks[a+b].set=Xb)}),n.fn.extend({css:function(a,b){return W(this,function(a,b,c){var d,e,f={},g=0;if(n.isArray(b)){for(d=Jb(a),e=b.length;e>g;g++)f[b[g]]=n.css(a,b[g],!1,d);return f}return void 0!==c?n.style(a,b,c):n.css(a,b)
},a,b,arguments.length>1)},show:function(){return Wb(this,!0)},hide:function(){return Wb(this)},toggle:function(a){return"boolean"==typeof a?a?this.show():this.hide():this.each(function(){V(this)?n(this).show():n(this).hide()})}});function $b(a,b,c,d,e){return new $b.prototype.init(a,b,c,d,e)}n.Tween=$b,$b.prototype={constructor:$b,init:function(a,b,c,d,e,f){this.elem=a,this.prop=c,this.easing=e||"swing",this.options=b,this.start=this.now=this.cur(),this.end=d,this.unit=f||(n.cssNumber[c]?"":"px")},cur:function(){var a=$b.propHooks[this.prop];return a&&a.get?a.get(this):$b.propHooks._default.get(this)},run:function(a){var b,c=$b.propHooks[this.prop];return this.pos=b=this.options.duration?n.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):a,this.now=(this.end-this.start)*b+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),c&&c.set?c.set(this):$b.propHooks._default.set(this),this}},$b.prototype.init.prototype=$b.prototype,$b.propHooks={_default:{get:function(a){var b;return null==a.elem[a.prop]||a.elem.style&&null!=a.elem.style[a.prop]?(b=n.css(a.elem,a.prop,""),b&&"auto"!==b?b:0):a.elem[a.prop]},set:function(a){n.fx.step[a.prop]?n.fx.step[a.prop](a):a.elem.style&&(null!=a.elem.style[n.cssProps[a.prop]]||n.cssHooks[a.prop])?n.style(a.elem,a.prop,a.now+a.unit):a.elem[a.prop]=a.now}}},$b.propHooks.scrollTop=$b.propHooks.scrollLeft={set:function(a){a.elem.nodeType&&a.elem.parentNode&&(a.elem[a.prop]=a.now)}},n.easing={linear:function(a){return a},swing:function(a){return.5-Math.cos(a*Math.PI)/2}},n.fx=$b.prototype.init,n.fx.step={};var _b,ac,bc=/^(?:toggle|show|hide)$/,cc=new RegExp("^(?:([+-])=|)("+T+")([a-z%]*)$","i"),dc=/queueHooks$/,ec=[jc],fc={"*":[function(a,b){var c=this.createTween(a,b),d=c.cur(),e=cc.exec(b),f=e&&e[3]||(n.cssNumber[a]?"":"px"),g=(n.cssNumber[a]||"px"!==f&&+d)&&cc.exec(n.css(c.elem,a)),h=1,i=20;if(g&&g[3]!==f){f=f||g[3],e=e||[],g=+d||1;do h=h||".5",g/=h,n.style(c.elem,a,g+f);while(h!==(h=c.cur()/d)&&1!==h&&--i)}return e&&(g=c.start=+g||+d||0,c.unit=f,c.end=e[1]?g+(e[1]+1)*e[2]:+e[2]),c}]};function gc(){return setTimeout(function(){_b=void 0}),_b=n.now()}function hc(a,b){var c,d={height:a},e=0;for(b=b?1:0;4>e;e+=2-b)c=U[e],d["margin"+c]=d["padding"+c]=a;return b&&(d.opacity=d.width=a),d}function ic(a,b,c){for(var d,e=(fc[b]||[]).concat(fc["*"]),f=0,g=e.length;g>f;f++)if(d=e[f].call(c,b,a))return d}function jc(a,b,c){var d,e,f,g,h,i,j,k,m=this,o={},p=a.style,q=a.nodeType&&V(a),r=n._data(a,"fxshow");c.queue||(h=n._queueHooks(a,"fx"),null==h.unqueued&&(h.unqueued=0,i=h.empty.fire,h.empty.fire=function(){h.unqueued||i()}),h.unqueued++,m.always(function(){m.always(function(){h.unqueued--,n.queue(a,"fx").length||h.empty.fire()})})),1===a.nodeType&&("height"in b||"width"in b)&&(c.overflow=[p.overflow,p.overflowX,p.overflowY],j=n.css(a,"display"),k=Gb(a.nodeName),"none"===j&&(j=k),"inline"===j&&"none"===n.css(a,"float")&&(l.inlineBlockNeedsLayout&&"inline"!==k?p.zoom=1:p.display="inline-block")),c.overflow&&(p.overflow="hidden",l.shrinkWrapBlocks()||m.always(function(){p.overflow=c.overflow[0],p.overflowX=c.overflow[1],p.overflowY=c.overflow[2]}));for(d in b)if(e=b[d],bc.exec(e)){if(delete b[d],f=f||"toggle"===e,e===(q?"hide":"show")){if("show"!==e||!r||void 0===r[d])continue;q=!0}o[d]=r&&r[d]||n.style(a,d)}if(!n.isEmptyObject(o)){r?"hidden"in r&&(q=r.hidden):r=n._data(a,"fxshow",{}),f&&(r.hidden=!q),q?n(a).show():m.done(function(){n(a).hide()}),m.done(function(){var b;n._removeData(a,"fxshow");for(b in o)n.style(a,b,o[b])});for(d in o)g=ic(q?r[d]:0,d,m),d in r||(r[d]=g.start,q&&(g.end=g.start,g.start="width"===d||"height"===d?1:0))}}function kc(a,b){var c,d,e,f,g;for(c in a)if(d=n.camelCase(c),e=b[d],f=a[c],n.isArray(f)&&(e=f[1],f=a[c]=f[0]),c!==d&&(a[d]=f,delete a[c]),g=n.cssHooks[d],g&&"expand"in g){f=g.expand(f),delete a[d];for(c in f)c in a||(a[c]=f[c],b[c]=e)}else b[d]=e}function lc(a,b,c){var d,e,f=0,g=ec.length,h=n.Deferred().always(function(){delete i.elem}),i=function(){if(e)return!1;for(var b=_b||gc(),c=Math.max(0,j.startTime+j.duration-b),d=c/j.duration||0,f=1-d,g=0,i=j.tweens.length;i>g;g++)j.tweens[g].run(f);return h.notifyWith(a,[j,f,c]),1>f&&i?c:(h.resolveWith(a,[j]),!1)},j=h.promise({elem:a,props:n.extend({},b),opts:n.extend(!0,{specialEasing:{}},c),originalProperties:b,originalOptions:c,startTime:_b||gc(),duration:c.duration,tweens:[],createTween:function(b,c){var d=n.Tween(a,j.opts,b,c,j.opts.specialEasing[b]||j.opts.easing);return j.tweens.push(d),d},stop:function(b){var c=0,d=b?j.tweens.length:0;if(e)return this;for(e=!0;d>c;c++)j.tweens[c].run(1);return b?h.resolveWith(a,[j,b]):h.rejectWith(a,[j,b]),this}}),k=j.props;for(kc(k,j.opts.specialEasing);g>f;f++)if(d=ec[f].call(j,a,k,j.opts))return d;return n.map(k,ic,j),n.isFunction(j.opts.start)&&j.opts.start.call(a,j),n.fx.timer(n.extend(i,{elem:a,anim:j,queue:j.opts.queue})),j.progress(j.opts.progress).done(j.opts.done,j.opts.complete).fail(j.opts.fail).always(j.opts.always)}n.Animation=n.extend(lc,{tweener:function(a,b){n.isFunction(a)?(b=a,a=["*"]):a=a.split(" ");for(var c,d=0,e=a.length;e>d;d++)c=a[d],fc[c]=fc[c]||[],fc[c].unshift(b)},prefilter:function(a,b){b?ec.unshift(a):ec.push(a)}}),n.speed=function(a,b,c){var d=a&&"object"==typeof a?n.extend({},a):{complete:c||!c&&b||n.isFunction(a)&&a,duration:a,easing:c&&b||b&&!n.isFunction(b)&&b};return d.duration=n.fx.off?0:"number"==typeof d.duration?d.duration:d.duration in n.fx.speeds?n.fx.speeds[d.duration]:n.fx.speeds._default,(null==d.queue||d.queue===!0)&&(d.queue="fx"),d.old=d.complete,d.complete=function(){n.isFunction(d.old)&&d.old.call(this),d.queue&&n.dequeue(this,d.queue)},d},n.fn.extend({fadeTo:function(a,b,c,d){return this.filter(V).css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){var e=n.isEmptyObject(a),f=n.speed(b,c,d),g=function(){var b=lc(this,n.extend({},a),f);(e||n._data(this,"finish"))&&b.stop(!0)};return g.finish=g,e||f.queue===!1?this.each(g):this.queue(f.queue,g)},stop:function(a,b,c){var d=function(a){var b=a.stop;delete a.stop,b(c)};return"string"!=typeof a&&(c=b,b=a,a=void 0),b&&a!==!1&&this.queue(a||"fx",[]),this.each(function(){var b=!0,e=null!=a&&a+"queueHooks",f=n.timers,g=n._data(this);if(e)g[e]&&g[e].stop&&d(g[e]);else for(e in g)g[e]&&g[e].stop&&dc.test(e)&&d(g[e]);for(e=f.length;e--;)f[e].elem!==this||null!=a&&f[e].queue!==a||(f[e].anim.stop(c),b=!1,f.splice(e,1));(b||!c)&&n.dequeue(this,a)})},finish:function(a){return a!==!1&&(a=a||"fx"),this.each(function(){var b,c=n._data(this),d=c[a+"queue"],e=c[a+"queueHooks"],f=n.timers,g=d?d.length:0;for(c.finish=!0,n.queue(this,a,[]),e&&e.stop&&e.stop.call(this,!0),b=f.length;b--;)f[b].elem===this&&f[b].queue===a&&(f[b].anim.stop(!0),f.splice(b,1));for(b=0;g>b;b++)d[b]&&d[b].finish&&d[b].finish.call(this);delete c.finish})}}),n.each(["toggle","show","hide"],function(a,b){var c=n.fn[b];n.fn[b]=function(a,d,e){return null==a||"boolean"==typeof a?c.apply(this,arguments):this.animate(hc(b,!0),a,d,e)}}),n.each({slideDown:hc("show"),slideUp:hc("hide"),slideToggle:hc("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){n.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),n.timers=[],n.fx.tick=function(){var a,b=n.timers,c=0;for(_b=n.now();c<b.length;c++)a=b[c],a()||b[c]!==a||b.splice(c--,1);b.length||n.fx.stop(),_b=void 0},n.fx.timer=function(a){n.timers.push(a),a()?n.fx.start():n.timers.pop()},n.fx.interval=13,n.fx.start=function(){ac||(ac=setInterval(n.fx.tick,n.fx.interval))},n.fx.stop=function(){clearInterval(ac),ac=null},n.fx.speeds={slow:600,fast:200,_default:400},n.fn.delay=function(a,b){return a=n.fx?n.fx.speeds[a]||a:a,b=b||"fx",this.queue(b,function(b,c){var d=setTimeout(b,a);c.stop=function(){clearTimeout(d)}})},function(){var a,b,c,d,e=z.createElement("div");e.setAttribute("className","t"),e.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",a=e.getElementsByTagName("a")[0],c=z.createElement("select"),d=c.appendChild(z.createElement("option")),b=e.getElementsByTagName("input")[0],a.style.cssText="top:1px",l.getSetAttribute="t"!==e.className,l.style=/top/.test(a.getAttribute("style")),l.hrefNormalized="/a"===a.getAttribute("href"),l.checkOn=!!b.value,l.optSelected=d.selected,l.enctype=!!z.createElement("form").enctype,c.disabled=!0,l.optDisabled=!d.disabled,b=z.createElement("input"),b.setAttribute("value",""),l.input=""===b.getAttribute("value"),b.value="t",b.setAttribute("type","radio"),l.radioValue="t"===b.value,a=b=c=d=e=null}();var mc=/\r/g;n.fn.extend({val:function(a){var b,c,d,e=this[0];{if(arguments.length)return d=n.isFunction(a),this.each(function(c){var e;1===this.nodeType&&(e=d?a.call(this,c,n(this).val()):a,null==e?e="":"number"==typeof e?e+="":n.isArray(e)&&(e=n.map(e,function(a){return null==a?"":a+""})),b=n.valHooks[this.type]||n.valHooks[this.nodeName.toLowerCase()],b&&"set"in b&&void 0!==b.set(this,e,"value")||(this.value=e))});if(e)return b=n.valHooks[e.type]||n.valHooks[e.nodeName.toLowerCase()],b&&"get"in b&&void 0!==(c=b.get(e,"value"))?c:(c=e.value,"string"==typeof c?c.replace(mc,""):null==c?"":c)}}}),n.extend({valHooks:{option:{get:function(a){var b=n.find.attr(a,"value");return null!=b?b:n.text(a)}},select:{get:function(a){for(var b,c,d=a.options,e=a.selectedIndex,f="select-one"===a.type||0>e,g=f?null:[],h=f?e+1:d.length,i=0>e?h:f?e:0;h>i;i++)if(c=d[i],!(!c.selected&&i!==e||(l.optDisabled?c.disabled:null!==c.getAttribute("disabled"))||c.parentNode.disabled&&n.nodeName(c.parentNode,"optgroup"))){if(b=n(c).val(),f)return b;g.push(b)}return g},set:function(a,b){var c,d,e=a.options,f=n.makeArray(b),g=e.length;while(g--)if(d=e[g],n.inArray(n.valHooks.option.get(d),f)>=0)try{d.selected=c=!0}catch(h){d.scrollHeight}else d.selected=!1;return c||(a.selectedIndex=-1),e}}}}),n.each(["radio","checkbox"],function(){n.valHooks[this]={set:function(a,b){return n.isArray(b)?a.checked=n.inArray(n(a).val(),b)>=0:void 0}},l.checkOn||(n.valHooks[this].get=function(a){return null===a.getAttribute("value")?"on":a.value})});var nc,oc,pc=n.expr.attrHandle,qc=/^(?:checked|selected)$/i,rc=l.getSetAttribute,sc=l.input;n.fn.extend({attr:function(a,b){return W(this,n.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){n.removeAttr(this,a)})}}),n.extend({attr:function(a,b,c){var d,e,f=a.nodeType;if(a&&3!==f&&8!==f&&2!==f)return typeof a.getAttribute===L?n.prop(a,b,c):(1===f&&n.isXMLDoc(a)||(b=b.toLowerCase(),d=n.attrHooks[b]||(n.expr.match.bool.test(b)?oc:nc)),void 0===c?d&&"get"in d&&null!==(e=d.get(a,b))?e:(e=n.find.attr(a,b),null==e?void 0:e):null!==c?d&&"set"in d&&void 0!==(e=d.set(a,c,b))?e:(a.setAttribute(b,c+""),c):void n.removeAttr(a,b))},removeAttr:function(a,b){var c,d,e=0,f=b&&b.match(F);if(f&&1===a.nodeType)while(c=f[e++])d=n.propFix[c]||c,n.expr.match.bool.test(c)?sc&&rc||!qc.test(c)?a[d]=!1:a[n.camelCase("default-"+c)]=a[d]=!1:n.attr(a,c,""),a.removeAttribute(rc?c:d)},attrHooks:{type:{set:function(a,b){if(!l.radioValue&&"radio"===b&&n.nodeName(a,"input")){var c=a.value;return a.setAttribute("type",b),c&&(a.value=c),b}}}}}),oc={set:function(a,b,c){return b===!1?n.removeAttr(a,c):sc&&rc||!qc.test(c)?a.setAttribute(!rc&&n.propFix[c]||c,c):a[n.camelCase("default-"+c)]=a[c]=!0,c}},n.each(n.expr.match.bool.source.match(/\w+/g),function(a,b){var c=pc[b]||n.find.attr;pc[b]=sc&&rc||!qc.test(b)?function(a,b,d){var e,f;return d||(f=pc[b],pc[b]=e,e=null!=c(a,b,d)?b.toLowerCase():null,pc[b]=f),e}:function(a,b,c){return c?void 0:a[n.camelCase("default-"+b)]?b.toLowerCase():null}}),sc&&rc||(n.attrHooks.value={set:function(a,b,c){return n.nodeName(a,"input")?void(a.defaultValue=b):nc&&nc.set(a,b,c)}}),rc||(nc={set:function(a,b,c){var d=a.getAttributeNode(c);return d||a.setAttributeNode(d=a.ownerDocument.createAttribute(c)),d.value=b+="","value"===c||b===a.getAttribute(c)?b:void 0}},pc.id=pc.name=pc.coords=function(a,b,c){var d;return c?void 0:(d=a.getAttributeNode(b))&&""!==d.value?d.value:null},n.valHooks.button={get:function(a,b){var c=a.getAttributeNode(b);return c&&c.specified?c.value:void 0},set:nc.set},n.attrHooks.contenteditable={set:function(a,b,c){nc.set(a,""===b?!1:b,c)}},n.each(["width","height"],function(a,b){n.attrHooks[b]={set:function(a,c){return""===c?(a.setAttribute(b,"auto"),c):void 0}}})),l.style||(n.attrHooks.style={get:function(a){return a.style.cssText||void 0},set:function(a,b){return a.style.cssText=b+""}});var tc=/^(?:input|select|textarea|button|object)$/i,uc=/^(?:a|area)$/i;n.fn.extend({prop:function(a,b){return W(this,n.prop,a,b,arguments.length>1)},removeProp:function(a){return a=n.propFix[a]||a,this.each(function(){try{this[a]=void 0,delete this[a]}catch(b){}})}}),n.extend({propFix:{"for":"htmlFor","class":"className"},prop:function(a,b,c){var d,e,f,g=a.nodeType;if(a&&3!==g&&8!==g&&2!==g)return f=1!==g||!n.isXMLDoc(a),f&&(b=n.propFix[b]||b,e=n.propHooks[b]),void 0!==c?e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:a[b]=c:e&&"get"in e&&null!==(d=e.get(a,b))?d:a[b]},propHooks:{tabIndex:{get:function(a){var b=n.find.attr(a,"tabindex");return b?parseInt(b,10):tc.test(a.nodeName)||uc.test(a.nodeName)&&a.href?0:-1}}}}),l.hrefNormalized||n.each(["href","src"],function(a,b){n.propHooks[b]={get:function(a){return a.getAttribute(b,4)}}}),l.optSelected||(n.propHooks.selected={get:function(a){var b=a.parentNode;return b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex),null}}),n.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){n.propFix[this.toLowerCase()]=this}),l.enctype||(n.propFix.enctype="encoding");var vc=/[\t\r\n\f]/g;n.fn.extend({addClass:function(a){var b,c,d,e,f,g,h=0,i=this.length,j="string"==typeof a&&a;if(n.isFunction(a))return this.each(function(b){n(this).addClass(a.call(this,b,this.className))});if(j)for(b=(a||"").match(F)||[];i>h;h++)if(c=this[h],d=1===c.nodeType&&(c.className?(" "+c.className+" ").replace(vc," "):" ")){f=0;while(e=b[f++])d.indexOf(" "+e+" ")<0&&(d+=e+" ");g=n.trim(d),c.className!==g&&(c.className=g)}return this},removeClass:function(a){var b,c,d,e,f,g,h=0,i=this.length,j=0===arguments.length||"string"==typeof a&&a;if(n.isFunction(a))return this.each(function(b){n(this).removeClass(a.call(this,b,this.className))});if(j)for(b=(a||"").match(F)||[];i>h;h++)if(c=this[h],d=1===c.nodeType&&(c.className?(" "+c.className+" ").replace(vc," "):"")){f=0;while(e=b[f++])while(d.indexOf(" "+e+" ")>=0)d=d.replace(" "+e+" "," ");g=a?n.trim(d):"",c.className!==g&&(c.className=g)}return this},toggleClass:function(a,b){var c=typeof a;return"boolean"==typeof b&&"string"===c?b?this.addClass(a):this.removeClass(a):this.each(n.isFunction(a)?function(c){n(this).toggleClass(a.call(this,c,this.className,b),b)}:function(){if("string"===c){var b,d=0,e=n(this),f=a.match(F)||[];while(b=f[d++])e.hasClass(b)?e.removeClass(b):e.addClass(b)}else(c===L||"boolean"===c)&&(this.className&&n._data(this,"__className__",this.className),this.className=this.className||a===!1?"":n._data(this,"__className__")||"")})},hasClass:function(a){for(var b=" "+a+" ",c=0,d=this.length;d>c;c++)if(1===this[c].nodeType&&(" "+this[c].className+" ").replace(vc," ").indexOf(b)>=0)return!0;return!1}}),n.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){n.fn[b]=function(a,c){return arguments.length>0?this.on(b,null,a,c):this.trigger(b)}}),n.fn.extend({hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)},bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return 1===arguments.length?this.off(a,"**"):this.off(b,a||"**",c)}});var wc=n.now(),xc=/\?/,yc=/(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g;n.parseJSON=function(b){if(a.JSON&&a.JSON.parse)return a.JSON.parse(b+"");var c,d=null,e=n.trim(b+"");return e&&!n.trim(e.replace(yc,function(a,b,e,f){return c&&b&&(d=0),0===d?a:(c=e||b,d+=!f-!e,"")}))?Function("return "+e)():n.error("Invalid JSON: "+b)},n.parseXML=function(b){var c,d;if(!b||"string"!=typeof b)return null;try{a.DOMParser?(d=new DOMParser,c=d.parseFromString(b,"text/xml")):(c=new ActiveXObject("Microsoft.XMLDOM"),c.async="false",c.loadXML(b))}catch(e){c=void 0}return c&&c.documentElement&&!c.getElementsByTagName("parsererror").length||n.error("Invalid XML: "+b),c};var zc,Ac,Bc=/#.*$/,Cc=/([?&])_=[^&]*/,Dc=/^(.*?):[ \t]*([^\r\n]*)\r?$/gm,Ec=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Fc=/^(?:GET|HEAD)$/,Gc=/^\/\//,Hc=/^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,Ic={},Jc={},Kc="*/".concat("*");try{Ac=location.href}catch(Lc){Ac=z.createElement("a"),Ac.href="",Ac=Ac.href}zc=Hc.exec(Ac.toLowerCase())||[];function Mc(a){return function(b,c){"string"!=typeof b&&(c=b,b="*");var d,e=0,f=b.toLowerCase().match(F)||[];if(n.isFunction(c))while(d=f[e++])"+"===d.charAt(0)?(d=d.slice(1)||"*",(a[d]=a[d]||[]).unshift(c)):(a[d]=a[d]||[]).push(c)}}function Nc(a,b,c,d){var e={},f=a===Jc;function g(h){var i;return e[h]=!0,n.each(a[h]||[],function(a,h){var j=h(b,c,d);return"string"!=typeof j||f||e[j]?f?!(i=j):void 0:(b.dataTypes.unshift(j),g(j),!1)}),i}return g(b.dataTypes[0])||!e["*"]&&g("*")}function Oc(a,b){var c,d,e=n.ajaxSettings.flatOptions||{};for(d in b)void 0!==b[d]&&((e[d]?a:c||(c={}))[d]=b[d]);return c&&n.extend(!0,a,c),a}function Pc(a,b,c){var d,e,f,g,h=a.contents,i=a.dataTypes;while("*"===i[0])i.shift(),void 0===e&&(e=a.mimeType||b.getResponseHeader("Content-Type"));if(e)for(g in h)if(h[g]&&h[g].test(e)){i.unshift(g);break}if(i[0]in c)f=i[0];else{for(g in c){if(!i[0]||a.converters[g+" "+i[0]]){f=g;break}d||(d=g)}f=f||d}return f?(f!==i[0]&&i.unshift(f),c[f]):void 0}function Qc(a,b,c,d){var e,f,g,h,i,j={},k=a.dataTypes.slice();if(k[1])for(g in a.converters)j[g.toLowerCase()]=a.converters[g];f=k.shift();while(f)if(a.responseFields[f]&&(c[a.responseFields[f]]=b),!i&&d&&a.dataFilter&&(b=a.dataFilter(b,a.dataType)),i=f,f=k.shift())if("*"===f)f=i;else if("*"!==i&&i!==f){if(g=j[i+" "+f]||j["* "+f],!g)for(e in j)if(h=e.split(" "),h[1]===f&&(g=j[i+" "+h[0]]||j["* "+h[0]])){g===!0?g=j[e]:j[e]!==!0&&(f=h[0],k.unshift(h[1]));break}if(g!==!0)if(g&&a["throws"])b=g(b);else try{b=g(b)}catch(l){return{state:"parsererror",error:g?l:"No conversion from "+i+" to "+f}}}return{state:"success",data:b}}n.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:Ac,type:"GET",isLocal:Ec.test(zc[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":Kc,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":n.parseJSON,"text xml":n.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(a,b){return b?Oc(Oc(a,n.ajaxSettings),b):Oc(n.ajaxSettings,a)},ajaxPrefilter:Mc(Ic),ajaxTransport:Mc(Jc),ajax:function(a,b){"object"==typeof a&&(b=a,a=void 0),b=b||{};var c,d,e,f,g,h,i,j,k=n.ajaxSetup({},b),l=k.context||k,m=k.context&&(l.nodeType||l.jquery)?n(l):n.event,o=n.Deferred(),p=n.Callbacks("once memory"),q=k.statusCode||{},r={},s={},t=0,u="canceled",v={readyState:0,getResponseHeader:function(a){var b;if(2===t){if(!j){j={};while(b=Dc.exec(f))j[b[1].toLowerCase()]=b[2]}b=j[a.toLowerCase()]}return null==b?null:b},getAllResponseHeaders:function(){return 2===t?f:null},setRequestHeader:function(a,b){var c=a.toLowerCase();return t||(a=s[c]=s[c]||a,r[a]=b),this},overrideMimeType:function(a){return t||(k.mimeType=a),this},statusCode:function(a){var b;if(a)if(2>t)for(b in a)q[b]=[q[b],a[b]];else v.always(a[v.status]);return this},abort:function(a){var b=a||u;return i&&i.abort(b),x(0,b),this}};if(o.promise(v).complete=p.add,v.success=v.done,v.error=v.fail,k.url=((a||k.url||Ac)+"").replace(Bc,"").replace(Gc,zc[1]+"//"),k.type=b.method||b.type||k.method||k.type,k.dataTypes=n.trim(k.dataType||"*").toLowerCase().match(F)||[""],null==k.crossDomain&&(c=Hc.exec(k.url.toLowerCase()),k.crossDomain=!(!c||c[1]===zc[1]&&c[2]===zc[2]&&(c[3]||("http:"===c[1]?"80":"443"))===(zc[3]||("http:"===zc[1]?"80":"443")))),k.data&&k.processData&&"string"!=typeof k.data&&(k.data=n.param(k.data,k.traditional)),Nc(Ic,k,b,v),2===t)return v;h=k.global,h&&0===n.active++&&n.event.trigger("ajaxStart"),k.type=k.type.toUpperCase(),k.hasContent=!Fc.test(k.type),e=k.url,k.hasContent||(k.data&&(e=k.url+=(xc.test(e)?"&":"?")+k.data,delete k.data),k.cache===!1&&(k.url=Cc.test(e)?e.replace(Cc,"$1_="+wc++):e+(xc.test(e)?"&":"?")+"_="+wc++)),k.ifModified&&(n.lastModified[e]&&v.setRequestHeader("If-Modified-Since",n.lastModified[e]),n.etag[e]&&v.setRequestHeader("If-None-Match",n.etag[e])),(k.data&&k.hasContent&&k.contentType!==!1||b.contentType)&&v.setRequestHeader("Content-Type",k.contentType),v.setRequestHeader("Accept",k.dataTypes[0]&&k.accepts[k.dataTypes[0]]?k.accepts[k.dataTypes[0]]+("*"!==k.dataTypes[0]?", "+Kc+"; q=0.01":""):k.accepts["*"]);for(d in k.headers)v.setRequestHeader(d,k.headers[d]);if(k.beforeSend&&(k.beforeSend.call(l,v,k)===!1||2===t))return v.abort();u="abort";for(d in{success:1,error:1,complete:1})v[d](k[d]);if(i=Nc(Jc,k,b,v)){v.readyState=1,h&&m.trigger("ajaxSend",[v,k]),k.async&&k.timeout>0&&(g=setTimeout(function(){v.abort("timeout")},k.timeout));try{t=1,i.send(r,x)}catch(w){if(!(2>t))throw w;x(-1,w)}}else x(-1,"No Transport");function x(a,b,c,d){var j,r,s,u,w,x=b;2!==t&&(t=2,g&&clearTimeout(g),i=void 0,f=d||"",v.readyState=a>0?4:0,j=a>=200&&300>a||304===a,c&&(u=Pc(k,v,c)),u=Qc(k,u,v,j),j?(k.ifModified&&(w=v.getResponseHeader("Last-Modified"),w&&(n.lastModified[e]=w),w=v.getResponseHeader("etag"),w&&(n.etag[e]=w)),204===a||"HEAD"===k.type?x="nocontent":304===a?x="notmodified":(x=u.state,r=u.data,s=u.error,j=!s)):(s=x,(a||!x)&&(x="error",0>a&&(a=0))),v.status=a,v.statusText=(b||x)+"",j?o.resolveWith(l,[r,x,v]):o.rejectWith(l,[v,x,s]),v.statusCode(q),q=void 0,h&&m.trigger(j?"ajaxSuccess":"ajaxError",[v,k,j?r:s]),p.fireWith(l,[v,x]),h&&(m.trigger("ajaxComplete",[v,k]),--n.active||n.event.trigger("ajaxStop")))}return v},getJSON:function(a,b,c){return n.get(a,b,c,"json")},getScript:function(a,b){return n.get(a,void 0,b,"script")}}),n.each(["get","post"],function(a,b){n[b]=function(a,c,d,e){return n.isFunction(c)&&(e=e||d,d=c,c=void 0),n.ajax({url:a,type:b,dataType:e,data:c,success:d})}}),n.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(a,b){n.fn[b]=function(a){return this.on(b,a)}}),n._evalUrl=function(a){return n.ajax({url:a,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0})},n.fn.extend({wrapAll:function(a){if(n.isFunction(a))return this.each(function(b){n(this).wrapAll(a.call(this,b))});if(this[0]){var b=n(a,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstChild&&1===a.firstChild.nodeType)a=a.firstChild;return a}).append(this)}return this},wrapInner:function(a){return this.each(n.isFunction(a)?function(b){n(this).wrapInner(a.call(this,b))}:function(){var b=n(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=n.isFunction(a);return this.each(function(c){n(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){n.nodeName(this,"body")||n(this).replaceWith(this.childNodes)}).end()}}),n.expr.filters.hidden=function(a){return a.offsetWidth<=0&&a.offsetHeight<=0||!l.reliableHiddenOffsets()&&"none"===(a.style&&a.style.display||n.css(a,"display"))},n.expr.filters.visible=function(a){return!n.expr.filters.hidden(a)};var Rc=/%20/g,Sc=/\[\]$/,Tc=/\r?\n/g,Uc=/^(?:submit|button|image|reset|file)$/i,Vc=/^(?:input|select|textarea|keygen)/i;function Wc(a,b,c,d){var e;if(n.isArray(b))n.each(b,function(b,e){c||Sc.test(a)?d(a,e):Wc(a+"["+("object"==typeof e?b:"")+"]",e,c,d)});else if(c||"object"!==n.type(b))d(a,b);else for(e in b)Wc(a+"["+e+"]",b[e],c,d)}n.param=function(a,b){var c,d=[],e=function(a,b){b=n.isFunction(b)?b():null==b?"":b,d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};if(void 0===b&&(b=n.ajaxSettings&&n.ajaxSettings.traditional),n.isArray(a)||a.jquery&&!n.isPlainObject(a))n.each(a,function(){e(this.name,this.value)});else for(c in a)Wc(c,a[c],b,e);return d.join("&").replace(Rc,"+")},n.fn.extend({serialize:function(){return n.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var a=n.prop(this,"elements");return a?n.makeArray(a):this}).filter(function(){var a=this.type;return this.name&&!n(this).is(":disabled")&&Vc.test(this.nodeName)&&!Uc.test(a)&&(this.checked||!X.test(a))}).map(function(a,b){var c=n(this).val();return null==c?null:n.isArray(c)?n.map(c,function(a){return{name:b.name,value:a.replace(Tc,"\r\n")}}):{name:b.name,value:c.replace(Tc,"\r\n")}}).get()}}),n.ajaxSettings.xhr=void 0!==a.ActiveXObject?function(){return!this.isLocal&&/^(get|post|head|put|delete|options)$/i.test(this.type)&&$c()||_c()}:$c;var Xc=0,Yc={},Zc=n.ajaxSettings.xhr();a.ActiveXObject&&n(a).on("unload",function(){for(var a in Yc)Yc[a](void 0,!0)}),l.cors=!!Zc&&"withCredentials"in Zc,Zc=l.ajax=!!Zc,Zc&&n.ajaxTransport(function(a){if(!a.crossDomain||l.cors){var b;return{send:function(c,d){var e,f=a.xhr(),g=++Xc;if(f.open(a.type,a.url,a.async,a.username,a.password),a.xhrFields)for(e in a.xhrFields)f[e]=a.xhrFields[e];a.mimeType&&f.overrideMimeType&&f.overrideMimeType(a.mimeType),a.crossDomain||c["X-Requested-With"]||(c["X-Requested-With"]="XMLHttpRequest");for(e in c)void 0!==c[e]&&f.setRequestHeader(e,c[e]+"");f.send(a.hasContent&&a.data||null),b=function(c,e){var h,i,j;if(b&&(e||4===f.readyState))if(delete Yc[g],b=void 0,f.onreadystatechange=n.noop,e)4!==f.readyState&&f.abort();else{j={},h=f.status,"string"==typeof f.responseText&&(j.text=f.responseText);try{i=f.statusText}catch(k){i=""}h||!a.isLocal||a.crossDomain?1223===h&&(h=204):h=j.text?200:404}j&&d(h,i,j,f.getAllResponseHeaders())},a.async?4===f.readyState?setTimeout(b):f.onreadystatechange=Yc[g]=b:b()},abort:function(){b&&b(void 0,!0)}}}});function $c(){try{return new a.XMLHttpRequest}catch(b){}}function _c(){try{return new a.ActiveXObject("Microsoft.XMLHTTP")}catch(b){}}n.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(a){return n.globalEval(a),a}}}),n.ajaxPrefilter("script",function(a){void 0===a.cache&&(a.cache=!1),a.crossDomain&&(a.type="GET",a.global=!1)}),n.ajaxTransport("script",function(a){if(a.crossDomain){var b,c=z.head||n("head")[0]||z.documentElement;return{send:function(d,e){b=z.createElement("script"),b.async=!0,a.scriptCharset&&(b.charset=a.scriptCharset),b.src=a.url,b.onload=b.onreadystatechange=function(a,c){(c||!b.readyState||/loaded|complete/.test(b.readyState))&&(b.onload=b.onreadystatechange=null,b.parentNode&&b.parentNode.removeChild(b),b=null,c||e(200,"success"))},c.insertBefore(b,c.firstChild)},abort:function(){b&&b.onload(void 0,!0)}}}});var ad=[],bd=/(=)\?(?=&|$)|\?\?/;n.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=ad.pop()||n.expando+"_"+wc++;return this[a]=!0,a}}),n.ajaxPrefilter("json jsonp",function(b,c,d){var e,f,g,h=b.jsonp!==!1&&(bd.test(b.url)?"url":"string"==typeof b.data&&!(b.contentType||"").indexOf("application/x-www-form-urlencoded")&&bd.test(b.data)&&"data");return h||"jsonp"===b.dataTypes[0]?(e=b.jsonpCallback=n.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,h?b[h]=b[h].replace(bd,"$1"+e):b.jsonp!==!1&&(b.url+=(xc.test(b.url)?"&":"?")+b.jsonp+"="+e),b.converters["script json"]=function(){return g||n.error(e+" was not called"),g[0]},b.dataTypes[0]="json",f=a[e],a[e]=function(){g=arguments},d.always(function(){a[e]=f,b[e]&&(b.jsonpCallback=c.jsonpCallback,ad.push(e)),g&&n.isFunction(f)&&f(g[0]),g=f=void 0}),"script"):void 0}),n.parseHTML=function(a,b,c){if(!a||"string"!=typeof a)return null;"boolean"==typeof b&&(c=b,b=!1),b=b||z;var d=v.exec(a),e=!c&&[];return d?[b.createElement(d[1])]:(d=n.buildFragment([a],b,e),e&&e.length&&n(e).remove(),n.merge([],d.childNodes))};var cd=n.fn.load;n.fn.load=function(a,b,c){if("string"!=typeof a&&cd)return cd.apply(this,arguments);var d,e,f,g=this,h=a.indexOf(" ");return h>=0&&(d=a.slice(h,a.length),a=a.slice(0,h)),n.isFunction(b)?(c=b,b=void 0):b&&"object"==typeof b&&(f="POST"),g.length>0&&n.ajax({url:a,type:f,dataType:"html",data:b}).done(function(a){e=arguments,g.html(d?n("<div>").append(n.parseHTML(a)).find(d):a)}).complete(c&&function(a,b){g.each(c,e||[a.responseText,b,a])}),this},n.expr.filters.animated=function(a){return n.grep(n.timers,function(b){return a===b.elem}).length};var dd=a.document.documentElement;function ed(a){return n.isWindow(a)?a:9===a.nodeType?a.defaultView||a.parentWindow:!1}n.offset={setOffset:function(a,b,c){var d,e,f,g,h,i,j,k=n.css(a,"position"),l=n(a),m={};"static"===k&&(a.style.position="relative"),h=l.offset(),f=n.css(a,"top"),i=n.css(a,"left"),j=("absolute"===k||"fixed"===k)&&n.inArray("auto",[f,i])>-1,j?(d=l.position(),g=d.top,e=d.left):(g=parseFloat(f)||0,e=parseFloat(i)||0),n.isFunction(b)&&(b=b.call(a,c,h)),null!=b.top&&(m.top=b.top-h.top+g),null!=b.left&&(m.left=b.left-h.left+e),"using"in b?b.using.call(a,m):l.css(m)}},n.fn.extend({offset:function(a){if(arguments.length)return void 0===a?this:this.each(function(b){n.offset.setOffset(this,a,b)});var b,c,d={top:0,left:0},e=this[0],f=e&&e.ownerDocument;if(f)return b=f.documentElement,n.contains(b,e)?(typeof e.getBoundingClientRect!==L&&(d=e.getBoundingClientRect()),c=ed(f),{top:d.top+(c.pageYOffset||b.scrollTop)-(b.clientTop||0),left:d.left+(c.pageXOffset||b.scrollLeft)-(b.clientLeft||0)}):d},position:function(){if(this[0]){var a,b,c={top:0,left:0},d=this[0];return"fixed"===n.css(d,"position")?b=d.getBoundingClientRect():(a=this.offsetParent(),b=this.offset(),n.nodeName(a[0],"html")||(c=a.offset()),c.top+=n.css(a[0],"borderTopWidth",!0),c.left+=n.css(a[0],"borderLeftWidth",!0)),{top:b.top-c.top-n.css(d,"marginTop",!0),left:b.left-c.left-n.css(d,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||dd;while(a&&!n.nodeName(a,"html")&&"static"===n.css(a,"position"))a=a.offsetParent;return a||dd})}}),n.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,b){var c=/Y/.test(b);n.fn[a]=function(d){return W(this,function(a,d,e){var f=ed(a);return void 0===e?f?b in f?f[b]:f.document.documentElement[d]:a[d]:void(f?f.scrollTo(c?n(f).scrollLeft():e,c?e:n(f).scrollTop()):a[d]=e)},a,d,arguments.length,null)}}),n.each(["top","left"],function(a,b){n.cssHooks[b]=Mb(l.pixelPosition,function(a,c){return c?(c=Kb(a,b),Ib.test(c)?n(a).position()[b]+"px":c):void 0})}),n.each({Height:"height",Width:"width"},function(a,b){n.each({padding:"inner"+a,content:b,"":"outer"+a},function(c,d){n.fn[d]=function(d,e){var f=arguments.length&&(c||"boolean"!=typeof d),g=c||(d===!0||e===!0?"margin":"border");return W(this,function(b,c,d){var e;return n.isWindow(b)?b.document.documentElement["client"+a]:9===b.nodeType?(e=b.documentElement,Math.max(b.body["scroll"+a],e["scroll"+a],b.body["offset"+a],e["offset"+a],e["client"+a])):void 0===d?n.css(b,c,g):n.style(b,c,d,g)},b,f?d:void 0,f,null)}})}),n.fn.size=function(){return this.length},n.fn.andSelf=n.fn.addBack,"function"==typeof define&&define.amd&&define("jquery",[],function(){return n});var fd=a.jQuery,gd=a.$;return n.noConflict=function(b){return a.$===n&&(a.$=gd),b&&a.jQuery===n&&(a.jQuery=fd),n},typeof b===L&&(a.jQuery=a.$=n),n});
;

//     Backbone.js 1.1.2

//     (c) 2010-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(root, factory) {

  // Set up Backbone appropriately for the environment. Start with AMD.
  if (typeof define === 'function' && define.amd) {
    define(['underscore', 'jquery', 'exports'], function(_, $, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Backbone.
      root.Backbone = factory(root, exports, _, $);
    });

  // Next for Node.js or CommonJS. jQuery may not be needed as a module.
  } else if (typeof exports !== 'undefined') {
    var _ = require('underscore');
    factory(root, exports, _);

  // Finally, as a browser global.
  } else {
    root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
  }

}(this, function(root, Backbone, _, $) {

  // Initial Setup
  // -------------

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create local references to array methods we'll want to use later.
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '1.1.2';

  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
  // the `$` variable.
  Backbone.$ = $;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = void 0;
        return this;
      }
      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeningTo = this._listeningTo;
      if (!listeningTo) return this;
      var remove = !name && !callback;
      if (!callback && typeof name === 'object') callback = this;
      if (obj) (listeningTo = {})[obj._listenId] = obj;
      for (var id in listeningTo) {
        obj = listeningTo[id];
        obj.off(name, callback, this);
        if (remove || _.isEmpty(obj._events)) delete this._listeningTo[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeningTo = this._listeningTo || (this._listeningTo = {});
      var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
      listeningTo[id] = obj;
      if (!callback && typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Backbone.Model
  // --------------

  // Backbone **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.

  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var attrs = attributes || {};
    options || (options = {});
    this.cid = _.uniqueId('c');
    this.attributes = {};
    if (options.collection) this.collection = options.collection;
    if (options.parse) attrs = this.parse(attrs, options) || {};
    attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The value returned during the last failed validation.
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = options;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          options = this._pending;
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, method, xhr, attributes = this.attributes;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options = _.extend({validate: true}, options);

      // If we're not waiting and attributes exist, save acts as
      // `set(attr).save(null, opts)` with validation. Otherwise, check if
      // the model will be valid when the attributes, if any, are set.
      if (attrs && !options.wait) {
        if (!this.set(attrs, options)) return false;
      } else {
        if (!this._validate(attrs, options)) return false;
      }

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);

      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch') options.attrs = attrs;
      xhr = this.sync(method, this, options);

      // Restore attributes.
      if (attrs && options.wait) this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;

      var destroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function(resp) {
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
        if (!model.isNew()) model.trigger('sync', model, resp, options);
      };

      if (this.isNew()) {
        options.success();
        return false;
      }
      wrapError(this, options);

      var xhr = this.sync('delete', this, options);
      if (!options.wait) destroy();
      return xhr;
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base =
        _.result(this, 'urlRoot') ||
        _.result(this.collection, 'url') ||
        urlError();
      if (this.isNew()) return base;
      return base.replace(/([^\/])$/, '$1/') + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return !this.has(this.idAttribute);
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return this._validate({}, _.extend(options || {}, { validate: true }));
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
      return false;
    }

  });

  // Underscore methods that we want to implement on the Model.
  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function(method) {
    Model.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });

  // Backbone.Collection
  // -------------------

  // If models tend to represent a single row of data, a Backbone Collection is
  // more analagous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.

  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

  // Default options for `Collection#set`.
  var setOptions = {add: true, remove: true, merge: true};
  var addOptions = {add: true, remove: false};

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set.
    add: function(models, options) {
      return this.set(models, _.extend({merge: false}, options, addOptions));
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      var singular = !_.isArray(models);
      models = singular ? [models] : _.clone(models);
      options || (options = {});
      var i, l, index, model;
      for (i = 0, l = models.length; i < l; i++) {
        model = models[i] = this.get(models[i]);
        if (!model) continue;
        delete this._byId[model.id];
        delete this._byId[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model, options);
      }
      return singular ? models[0] : models;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      options = _.defaults({}, options, setOptions);
      if (options.parse) models = this.parse(models, options);
      var singular = !_.isArray(models);
      models = singular ? (models ? [models] : []) : _.clone(models);
      var i, l, id, model, attrs, existing, sort;
      var at = options.at;
      var targetModel = this.model;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};
      var add = options.add, merge = options.merge, remove = options.remove;
      var order = !sortable && add && remove ? [] : false;

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, l = models.length; i < l; i++) {
        attrs = models[i] || {};
        if (attrs instanceof Model) {
          id = model = attrs;
        } else {
          id = attrs[targetModel.prototype.idAttribute || 'id'];
        }

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(id)) {
          if (remove) modelMap[existing.cid] = true;
          if (merge) {
            attrs = attrs === model ? model.attributes : attrs;
            if (options.parse) attrs = existing.parse(attrs, options);
            existing.set(attrs, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }
          models[i] = existing;

        // If this is a new, valid model, push it to the `toAdd` list.
        } else if (add) {
          model = models[i] = this._prepareModel(attrs, options);
          if (!model) continue;
          toAdd.push(model);
          this._addReference(model, options);
        }

        // Do not add multiple models with the same `id`.
        model = existing || model;
        if (order && (model.isNew() || !modelMap[model.id])) order.push(model);
        modelMap[model.id] = true;
      }

      // Remove nonexistent models if appropriate.
      if (remove) {
        for (i = 0, l = this.length; i < l; ++i) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length || (order && order.length)) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          for (i = 0, l = toAdd.length; i < l; i++) {
            this.models.splice(at + i, 0, toAdd[i]);
          }
        } else {
          if (order) this.models.length = 0;
          var orderedModels = order || toAdd;
          for (i = 0, l = orderedModels.length; i < l; i++) {
            this.models.push(orderedModels[i]);
          }
        }
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({silent: true});

      // Unless silenced, it's time to fire all appropriate add/sort events.
      if (!options.silent) {
        for (i = 0, l = toAdd.length; i < l; i++) {
          (model = toAdd[i]).trigger('add', model, this, options);
        }
        if (sort || (order && order.length)) this.trigger('sort', this, options);
      }

      // Return the added (or merged) model (or models).
      return singular ? models[0] : models;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options || (options = {});
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i], options);
      }
      options.previousModels = this.models;
      this._reset();
      models = this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return models;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      return this.add(model, _.extend({at: this.length}, options));
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      return this.add(model, _.extend({at: 0}, options));
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function() {
      return slice.apply(this.models, arguments);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      return this._byId[obj] || this._byId[obj.id] || this._byId[obj.cid];
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      if (_.isEmpty(attrs)) return first ? void 0 : [];
      return this[first ? 'find' : 'filter'](function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
        var method = options.reset ? 'reset' : 'set';
        collection[method](resp, options);
        if (success) success(collection, resp, options);
        collection.trigger('sync', collection, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(model, resp) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models);
    },

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function() {
      this.length = 0;
      this.models = [];
      this._byId  = {};
    },

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) return attrs;
      options = options ? _.clone(options) : {};
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model.validationError) return model;
      this.trigger('invalid', this, model.validationError, options);
      return false;
    },

    // Internal method to create a model's ties to a collection.
    _addReference: function(model, options) {
      this._byId[model.cid] = model;
      if (model.id != null) this._byId[model.id] = model;
      if (!model.collection) model.collection = this;
      model.on('all', this._onModelEvent, this);
    },

    // Internal method to sever a model's ties to a collection.
    _removeReference: function(model, options) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (model && event === 'change:' + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
    'lastIndexOf', 'isEmpty', 'chain', 'sample'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy', 'indexBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  // Backbone.View
  // -------------

  // Backbone Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    options || (options = {});
    _.extend(this, _.pick(options, viewOptions));
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be preferred to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
    },

    // Change the view's element (`this.el` property), including event
    // re-delegation.
    setElement: function(element, delegate) {
      if (this.$el) this.undelegateEvents();
      this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
      this.el = this.$el[0];
      if (delegate !== false) this.delegateEvents();
      return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save',
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, 'events')))) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) continue;

        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegateEvents' + this.cid;
        if (selector === '') {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
      return this;
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.off('.delegateEvents' + this.cid);
      return this;
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
        this.setElement($el, false);
      } else {
        this.setElement(_.result(this, 'el'), false);
      }
    }

  });

  // Backbone.sync
  // -------------

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    // If we're sending a `PATCH` request, and we're in an old Internet Explorer
    // that still has ActiveX enabled by default, override jQuery to use that
    // for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.
    if (params.type === 'PATCH' && noXhrPatch) {
      params.xhr = function() {
        return new ActiveXObject("Microsoft.XMLHTTP");
      };
    }

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  var noXhrPatch =
    typeof window !== 'undefined' && !!window.ActiveXObject &&
      !(window.XMLHttpRequest && (new XMLHttpRequest).dispatchEvent);

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

  // Backbone.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) callback = this[name];
      var router = this;
      Backbone.history.route(route, function(fragment) {
        var args = router._extractParameters(route, fragment);
        router.execute(callback, args);
        router.trigger.apply(router, ['route:' + name].concat(args));
        router.trigger('route', name, args);
        Backbone.history.trigger('route', router, name, args);
      });
      return this;
    },

    // Execute a route handler with the provided parameters.  This is an
    // excellent place to do pre-route setup or post-route cleanup.
    execute: function(callback, args) {
      if (callback) callback.apply(this, args);
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      this.routes = _.result(this, 'routes');
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional) {
                     return optional ? match : '([^/?]+)';
                   })
                   .replace(splatParam, '([^?]*?)');
      return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param, i) {
        // Don't decode the search params.
        if (i === params.length - 1) return param || null;
        return param ? decodeURIComponent(param) : null;
      });
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;

  // Cached regex for stripping urls of hash.
  var pathStripper = /#.*$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Are we at the app root?
    atRoot: function() {
      return this.location.pathname.replace(/[^\/]$/, '$&/') === this.root;
    },

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = decodeURI(this.location.pathname + this.location.search);
          var root = this.root.replace(trailingSlash, '');
          if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Backbone.history has already been started");
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment          = this.getFragment();
      var docMode           = document.documentMode;
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      if (oldIE && this._wantsHashChange) {
        var frame = Backbone.$('<iframe src="javascript:0" tabindex="-1">');
        this.iframe = frame.hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        Backbone.$(window).on('popstate', this.checkUrl);
      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
        Backbone.$(window).on('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;

      // Transition from hashChange to pushState or vice versa if both are
      // requested.
      if (this._wantsHashChange && this._wantsPushState) {

        // If we've started off with a route from a `pushState`-enabled
        // browser, but we're currently in a browser that doesn't support it...
        if (!this._hasPushState && !this.atRoot()) {
          this.fragment = this.getFragment(null, true);
          this.location.replace(this.root + '#' + this.fragment);
          // Return immediately as browser will do redirect to new url
          return true;

        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
        } else if (this._hasPushState && this.atRoot() && loc.hash) {
          this.fragment = this.getHash().replace(routeStripper, '');
          this.history.replaceState({}, document.title, this.root + this.fragment);
        }

      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      Backbone.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
      if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl();
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragment) {
      fragment = this.fragment = this.getFragment(fragment);
      return _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: !!options};

      var url = this.root + (fragment = this.getFragment(fragment || ''));

      // Strip the hash for matching.
      fragment = fragment.replace(pathStripper, '');

      if (this.fragment === fragment) return;
      this.fragment = fragment;

      // Don't include a trailing slash on the root.
      if (fragment === '' && url !== '/') url = url.slice(0, -1);

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) return this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function(model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error(model, resp, options);
      model.trigger('error', model, resp, options);
    };
  };

  return Backbone;

}));
;

(function(global) {
  "use strict";

  var inNodeJS = false;
  if (typeof process !== 'undefined') {
    inNodeJS = true;
    var request = require('request');
  }

  // from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement, fromIndex) {
      if (this == null) {
        throw new TypeError();
      }
      var t = Object(this);
      var len = t.length >>> 0;
      if (len === 0) {
        return -1;
      }
      var n = 0;
      if (arguments.length > 1) {
        n = Number(arguments[1]);
        if (n != n) { // shortcut for verifying if it's NaN
          n = 0;
        } else if (n != 0 && n != Infinity && n != -Infinity) {
          n = (n > 0 || -1) * Math.floor(Math.abs(n));
        }
      }
      if (n >= len) {
        return -1;
      }
      var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
      for (; k < len; k++) {
        if (k in t && t[k] === searchElement) {
          return k;
        }
      }
      return -1;
    }
  }
  /*
    Initialize with Tabletop.init( { key: '0AjAPaAU9MeLFdHUxTlJiVVRYNGRJQnRmSnQwTlpoUXc' } )
      OR!
    Initialize with Tabletop.init( { key: 'https://docs.google.com/spreadsheet/pub?hl=en_US&hl=en_US&key=0AjAPaAU9MeLFdHUxTlJiVVRYNGRJQnRmSnQwTlpoUXc&output=html&widget=true' } )
      OR!
    Initialize with Tabletop.init('0AjAPaAU9MeLFdHUxTlJiVVRYNGRJQnRmSnQwTlpoUXc')
  */

  var Tabletop = function(options) {
    // Make sure Tabletop is being used as a constructor no matter what.
    if(!this || !(this instanceof Tabletop)) {
      return new Tabletop(options);
    }
    
    if(typeof(options) === 'string') {
      options = { key : options };
    }

    this.callback = options.callback;
    this.wanted = options.wanted || [];
    this.key = options.key;
    this.simpleSheet = !!options.simpleSheet;
    this.parseNumbers = !!options.parseNumbers;
    this.wait = !!options.wait;
    this.reverse = !!options.reverse;
    this.postProcess = options.postProcess;
    this.debug = !!options.debug;
    this.query = options.query || '';
    this.orderby = options.orderby;
    this.endpoint = options.endpoint || "https://spreadsheets.google.com";
    this.singleton = !!options.singleton;
    this.simple_url = !!options.simple_url;
    this.callbackContext = options.callbackContext;
    
    if(typeof(options.proxy) !== 'undefined') {
      this.endpoint = options.proxy;
      this.simple_url = true;
      this.singleton = true;
    }
    
    this.parameterize = options.parameterize || false;
    
    if(this.singleton) {
      if(typeof(Tabletop.singleton) !== 'undefined') {
        this.log("WARNING! Tabletop singleton already defined");
      }
      Tabletop.singleton = this;
    }
    
    /* Be friendly about what you accept */
    if(/key=/.test(this.key)) {
      this.log("You passed a key as a URL! Attempting to parse.");
      this.key = this.key.match("key=(.*?)&")[1];
    }

    if(!this.key) {
      this.log("You need to pass Tabletop a key!");
      return;
    }

    this.log("Initializing with key " + this.key);

    this.models = {};
    this.model_names = [];

    this.base_json_path = "/feeds/worksheets/" + this.key + "/public/basic?alt=";

    if (inNodeJS) {
      this.base_json_path += 'json';
    } else {
      this.base_json_path += 'json-in-script';
    }
    
    if(!this.wait) {
      this.fetch();
    }
  };

  // A global storage for callbacks.
  Tabletop.callbacks = {};

  // Backwards compatibility.
  Tabletop.init = function(options) {
    return new Tabletop(options);
  };

  Tabletop.sheets = function() {
    this.log("Times have changed! You'll want to use var tabletop = Tabletop.init(...); tabletop.sheets(...); instead of Tabletop.sheets(...)");
  };

  Tabletop.prototype = {

    fetch: function(callback) {
      if(typeof(callback) !== "undefined") {
        this.callback = callback;
      }
      this.requestData(this.base_json_path, this.loadSheets);
    },
    
    /*
      This will call the environment appropriate request method.
      
      In browser it will use JSON-P, in node it will use request()
    */
    requestData: function(path, callback) {
      if (inNodeJS) {
        this.serverSideFetch(path, callback);
      } else {
        this.injectScript(path, callback);
      }
    },
    
    /*
      Insert the URL into the page as a script tag. Once it's loaded the spreadsheet data
      it triggers the callback. This helps you avoid cross-domain errors
      http://code.google.com/apis/gdata/samples/spreadsheet_sample.html

      Let's be plain-Jane and not use jQuery or anything.
    */
    injectScript: function(path, callback) {
      var script = document.createElement('script');
      var callbackName;
      
      if(this.singleton) {
        if(callback === this.loadSheets) {
          callbackName = 'Tabletop.singleton.loadSheets';
        } else if (callback === this.loadSheet) {
          callbackName = 'Tabletop.singleton.loadSheet';
        }
      } else {
        var self = this;
        callbackName = 'tt' + (+new Date()) + (Math.floor(Math.random()*100000));
        // Create a temp callback which will get removed once it has executed,
        // this allows multiple instances of Tabletop to coexist.
        Tabletop.callbacks[ callbackName ] = function () {
          var args = Array.prototype.slice.call( arguments, 0 );
          callback.apply(self, args);
          script.parentNode.removeChild(script);
          delete Tabletop.callbacks[callbackName];
        };
        callbackName = 'Tabletop.callbacks.' + callbackName;
      }
      
      var url = path + "&callback=" + callbackName;
      
      if(this.simple_url) {
        // We've gone down a rabbit hole of passing injectScript the path, so let's
        // just pull the sheet_id out of the path like the least efficient worker bees
        if(path.indexOf("/list/") !== -1) {
          script.src = this.endpoint + "/" + this.key + "-" + path.split("/")[4];
        } else {
          script.src = this.endpoint + "/" + this.key;
        }
      } else {
        script.src = this.endpoint + url;
      }
      
      if (this.parameterize) {
        script.src = this.parameterize + encodeURIComponent(script.src);
      }
      
      document.getElementsByTagName('script')[0].parentNode.appendChild(script);
    },
    
    /* 
      This will only run if tabletop is being run in node.js
    */
    serverSideFetch: function(path, callback) {
      var self = this
      request({url: this.endpoint + path, json: true}, function(err, resp, body) {
        if (err) {
          return console.error(err);
        }
        callback.call(self, body);
      });
    },

    /* 
      Is this a sheet you want to pull?
      If { wanted: ["Sheet1"] } has been specified, only Sheet1 is imported
      Pulls all sheets if none are specified
    */
    isWanted: function(sheetName) {
      if(this.wanted.length === 0) {
        return true;
      } else {
        return this.wanted.indexOf(sheetName) !== -1;
      }
    },
    
    /*
      What gets send to the callback
      if simpleSheet === true, then don't return an array of Tabletop.this.models,
      only return the first one's elements
    */
    data: function() {
      // If the instance is being queried before the data's been fetched
      // then return undefined.
      if(this.model_names.length === 0) {
        return undefined;
      }
      if(this.simpleSheet) {
        if(this.model_names.length > 1 && this.debug) {
          this.log("WARNING You have more than one sheet but are using simple sheet mode! Don't blame me when something goes wrong.");
        }
        return this.models[ this.model_names[0] ].all();
      } else {
        return this.models;
      }
    },

    /*
      Add another sheet to the wanted list
    */
    addWanted: function(sheet) {
      if(this.wanted.indexOf(sheet) === -1) {
        this.wanted.push(sheet);
      }
    },
    
    /*
      Load all worksheets of the spreadsheet, turning each into a Tabletop Model.
      Need to use injectScript because the worksheet view that you're working from
      doesn't actually include the data. The list-based feed (/feeds/list/key..) does, though.
      Calls back to loadSheet in order to get the real work done.

      Used as a callback for the worksheet-based JSON
    */
    loadSheets: function(data) {
      var i, ilen;
      var toLoad = [];
      this.foundSheetNames = [];

      for(i = 0, ilen = data.feed.entry.length; i < ilen ; i++) {
        this.foundSheetNames.push(data.feed.entry[i].title.$t);
        // Only pull in desired sheets to reduce loading
        if( this.isWanted(data.feed.entry[i].content.$t) ) {
          var sheet_id = data.feed.entry[i].link[3].href.substr( data.feed.entry[i].link[3].href.length - 3, 3);
          var json_path = "/feeds/list/" + this.key + "/" + sheet_id + "/public/values?sq=" + this.query + '&alt='
          if (inNodeJS) {
            json_path += 'json';
          } else {
            json_path += 'json-in-script';
          }
          if(this.orderby) {
            json_path += "&orderby=column:" + this.orderby.toLowerCase();
          }
          if(this.reverse) {
            json_path += "&reverse=true";
          }
          toLoad.push(json_path);
        }
      }

      this.sheetsToLoad = toLoad.length;
      for(i = 0, ilen = toLoad.length; i < ilen; i++) {
        this.requestData(toLoad[i], this.loadSheet);
      }
    },

    /*
      Access layer for the this.models
      .sheets() gets you all of the sheets
      .sheets('Sheet1') gets you the sheet named Sheet1
    */
    sheets: function(sheetName) {
      if(typeof sheetName === "undefined") {
        return this.models;
      } else {
        if(typeof(this.models[ sheetName ]) === "undefined") {
          // alert( "Can't find " + sheetName );
          return;
        } else {
          return this.models[ sheetName ];
        }
      }
    },

    /*
      Parse a single list-based worksheet, turning it into a Tabletop Model

      Used as a callback for the list-based JSON
    */
    loadSheet: function(data) {
      var model = new Tabletop.Model( { data: data, 
                                    parseNumbers: this.parseNumbers,
                                    postProcess: this.postProcess,
                                    tabletop: this } );
      this.models[ model.name ] = model;
      if(this.model_names.indexOf(model.name) === -1) {
        this.model_names.push(model.name);
      }
      this.sheetsToLoad--;
      if(this.sheetsToLoad === 0)
        this.doCallback();
    },

    /*
      Execute the callback upon loading! Rely on this.data() because you might
        only request certain pieces of data (i.e. simpleSheet mode)
      Tests this.sheetsToLoad just in case a race condition happens to show up
    */
    doCallback: function() {
      if(this.sheetsToLoad === 0) {
        this.callback.apply(this.callbackContext || this, [this.data(), this]);
      }
    },

    log: function(msg) {
      if(this.debug) {
        if(typeof console !== "undefined" && typeof console.log !== "undefined") {
          Function.prototype.apply.apply(console.log, [console, arguments]);
        }
      }
    }

  };

  /*
    Tabletop.Model stores the attribute names and parses the worksheet data
      to turn it into something worthwhile

    Options should be in the format { data: XXX }, with XXX being the list-based worksheet
  */
  Tabletop.Model = function(options) {
    var i, j, ilen, jlen;
    this.column_names = [];
    this.name = options.data.feed.title.$t;
    this.elements = [];
    this.raw = options.data; // A copy of the sheet's raw data, for accessing minutiae

    if(typeof(options.data.feed.entry) === 'undefined') {
      options.tabletop.log("Missing data for " + this.name + ", make sure you didn't forget column headers");
      this.elements = [];
      return;
    }
    
    for(var key in options.data.feed.entry[0]){
      if(/^gsx/.test(key))
        this.column_names.push( key.replace("gsx$","") );
    }

    for(i = 0, ilen =  options.data.feed.entry.length ; i < ilen; i++) {
      var source = options.data.feed.entry[i];
      var element = {};
      for(var j = 0, jlen = this.column_names.length; j < jlen ; j++) {
        var cell = source[ "gsx$" + this.column_names[j] ];
        if (typeof(cell) !== 'undefined') {
          if(options.parseNumbers && cell.$t !== '' && !isNaN(cell.$t))
            element[ this.column_names[j] ] = +cell.$t;
          else
            element[ this.column_names[j] ] = cell.$t;
        } else {
            element[ this.column_names[j] ] = '';
        }
      }
      if(element.rowNumber === undefined)
        element.rowNumber = i + 1;
      if( options.postProcess )
        options.postProcess(element);
      this.elements.push(element);
    }

  };

  Tabletop.Model.prototype = {
    /*
      Returns all of the elements (rows) of the worksheet as objects
    */
    all: function() {
      return this.elements;
    },

    /*
      Return the elements as an array of arrays, instead of an array of objects
    */
    toArray: function() {
      var array = [],
          i, j, ilen, jlen;
      for(i = 0, ilen = this.elements.length; i < ilen; i++) {
        var row = [];
        for(j = 0, jlen = this.column_names.length; j < jlen ; j++) {
          row.push( this.elements[i][ this.column_names[j] ] );
        }
        array.push(row);
      }
      return array;
    }
  };

  if(inNodeJS) {
    module.exports = Tabletop;
  } else {
    global.Tabletop = Tabletop;
  }

})(this);
;

//! moment.js
//! version : 2.5.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com
(function(a){function b(){return{empty:!1,unusedTokens:[],unusedInput:[],overflow:-2,charsLeftOver:0,nullInput:!1,invalidMonth:null,invalidFormat:!1,userInvalidated:!1,iso:!1}}function c(a,b){return function(c){return k(a.call(this,c),b)}}function d(a,b){return function(c){return this.lang().ordinal(a.call(this,c),b)}}function e(){}function f(a){w(a),h(this,a)}function g(a){var b=q(a),c=b.year||0,d=b.month||0,e=b.week||0,f=b.day||0,g=b.hour||0,h=b.minute||0,i=b.second||0,j=b.millisecond||0;this._milliseconds=+j+1e3*i+6e4*h+36e5*g,this._days=+f+7*e,this._months=+d+12*c,this._data={},this._bubble()}function h(a,b){for(var c in b)b.hasOwnProperty(c)&&(a[c]=b[c]);return b.hasOwnProperty("toString")&&(a.toString=b.toString),b.hasOwnProperty("valueOf")&&(a.valueOf=b.valueOf),a}function i(a){var b,c={};for(b in a)a.hasOwnProperty(b)&&qb.hasOwnProperty(b)&&(c[b]=a[b]);return c}function j(a){return 0>a?Math.ceil(a):Math.floor(a)}function k(a,b,c){for(var d=""+Math.abs(a),e=a>=0;d.length<b;)d="0"+d;return(e?c?"+":"":"-")+d}function l(a,b,c,d){var e,f,g=b._milliseconds,h=b._days,i=b._months;g&&a._d.setTime(+a._d+g*c),(h||i)&&(e=a.minute(),f=a.hour()),h&&a.date(a.date()+h*c),i&&a.month(a.month()+i*c),g&&!d&&db.updateOffset(a),(h||i)&&(a.minute(e),a.hour(f))}function m(a){return"[object Array]"===Object.prototype.toString.call(a)}function n(a){return"[object Date]"===Object.prototype.toString.call(a)||a instanceof Date}function o(a,b,c){var d,e=Math.min(a.length,b.length),f=Math.abs(a.length-b.length),g=0;for(d=0;e>d;d++)(c&&a[d]!==b[d]||!c&&s(a[d])!==s(b[d]))&&g++;return g+f}function p(a){if(a){var b=a.toLowerCase().replace(/(.)s$/,"$1");a=Tb[a]||Ub[b]||b}return a}function q(a){var b,c,d={};for(c in a)a.hasOwnProperty(c)&&(b=p(c),b&&(d[b]=a[c]));return d}function r(b){var c,d;if(0===b.indexOf("week"))c=7,d="day";else{if(0!==b.indexOf("month"))return;c=12,d="month"}db[b]=function(e,f){var g,h,i=db.fn._lang[b],j=[];if("number"==typeof e&&(f=e,e=a),h=function(a){var b=db().utc().set(d,a);return i.call(db.fn._lang,b,e||"")},null!=f)return h(f);for(g=0;c>g;g++)j.push(h(g));return j}}function s(a){var b=+a,c=0;return 0!==b&&isFinite(b)&&(c=b>=0?Math.floor(b):Math.ceil(b)),c}function t(a,b){return new Date(Date.UTC(a,b+1,0)).getUTCDate()}function u(a){return v(a)?366:365}function v(a){return a%4===0&&a%100!==0||a%400===0}function w(a){var b;a._a&&-2===a._pf.overflow&&(b=a._a[jb]<0||a._a[jb]>11?jb:a._a[kb]<1||a._a[kb]>t(a._a[ib],a._a[jb])?kb:a._a[lb]<0||a._a[lb]>23?lb:a._a[mb]<0||a._a[mb]>59?mb:a._a[nb]<0||a._a[nb]>59?nb:a._a[ob]<0||a._a[ob]>999?ob:-1,a._pf._overflowDayOfYear&&(ib>b||b>kb)&&(b=kb),a._pf.overflow=b)}function x(a){return null==a._isValid&&(a._isValid=!isNaN(a._d.getTime())&&a._pf.overflow<0&&!a._pf.empty&&!a._pf.invalidMonth&&!a._pf.nullInput&&!a._pf.invalidFormat&&!a._pf.userInvalidated,a._strict&&(a._isValid=a._isValid&&0===a._pf.charsLeftOver&&0===a._pf.unusedTokens.length)),a._isValid}function y(a){return a?a.toLowerCase().replace("_","-"):a}function z(a,b){return b._isUTC?db(a).zone(b._offset||0):db(a).local()}function A(a,b){return b.abbr=a,pb[a]||(pb[a]=new e),pb[a].set(b),pb[a]}function B(a){delete pb[a]}function C(a){var b,c,d,e,f=0,g=function(a){if(!pb[a]&&rb)try{require("./lang/"+a)}catch(b){}return pb[a]};if(!a)return db.fn._lang;if(!m(a)){if(c=g(a))return c;a=[a]}for(;f<a.length;){for(e=y(a[f]).split("-"),b=e.length,d=y(a[f+1]),d=d?d.split("-"):null;b>0;){if(c=g(e.slice(0,b).join("-")))return c;if(d&&d.length>=b&&o(e,d,!0)>=b-1)break;b--}f++}return db.fn._lang}function D(a){return a.match(/\[[\s\S]/)?a.replace(/^\[|\]$/g,""):a.replace(/\\/g,"")}function E(a){var b,c,d=a.match(vb);for(b=0,c=d.length;c>b;b++)d[b]=Yb[d[b]]?Yb[d[b]]:D(d[b]);return function(e){var f="";for(b=0;c>b;b++)f+=d[b]instanceof Function?d[b].call(e,a):d[b];return f}}function F(a,b){return a.isValid()?(b=G(b,a.lang()),Vb[b]||(Vb[b]=E(b)),Vb[b](a)):a.lang().invalidDate()}function G(a,b){function c(a){return b.longDateFormat(a)||a}var d=5;for(wb.lastIndex=0;d>=0&&wb.test(a);)a=a.replace(wb,c),wb.lastIndex=0,d-=1;return a}function H(a,b){var c,d=b._strict;switch(a){case"DDDD":return Ib;case"YYYY":case"GGGG":case"gggg":return d?Jb:zb;case"Y":case"G":case"g":return Lb;case"YYYYYY":case"YYYYY":case"GGGGG":case"ggggg":return d?Kb:Ab;case"S":if(d)return Gb;case"SS":if(d)return Hb;case"SSS":if(d)return Ib;case"DDD":return yb;case"MMM":case"MMMM":case"dd":case"ddd":case"dddd":return Cb;case"a":case"A":return C(b._l)._meridiemParse;case"X":return Fb;case"Z":case"ZZ":return Db;case"T":return Eb;case"SSSS":return Bb;case"MM":case"DD":case"YY":case"GG":case"gg":case"HH":case"hh":case"mm":case"ss":case"ww":case"WW":return d?Hb:xb;case"M":case"D":case"d":case"H":case"h":case"m":case"s":case"w":case"W":case"e":case"E":return xb;default:return c=new RegExp(P(O(a.replace("\\","")),"i"))}}function I(a){a=a||"";var b=a.match(Db)||[],c=b[b.length-1]||[],d=(c+"").match(Qb)||["-",0,0],e=+(60*d[1])+s(d[2]);return"+"===d[0]?-e:e}function J(a,b,c){var d,e=c._a;switch(a){case"M":case"MM":null!=b&&(e[jb]=s(b)-1);break;case"MMM":case"MMMM":d=C(c._l).monthsParse(b),null!=d?e[jb]=d:c._pf.invalidMonth=b;break;case"D":case"DD":null!=b&&(e[kb]=s(b));break;case"DDD":case"DDDD":null!=b&&(c._dayOfYear=s(b));break;case"YY":e[ib]=s(b)+(s(b)>68?1900:2e3);break;case"YYYY":case"YYYYY":case"YYYYYY":e[ib]=s(b);break;case"a":case"A":c._isPm=C(c._l).isPM(b);break;case"H":case"HH":case"h":case"hh":e[lb]=s(b);break;case"m":case"mm":e[mb]=s(b);break;case"s":case"ss":e[nb]=s(b);break;case"S":case"SS":case"SSS":case"SSSS":e[ob]=s(1e3*("0."+b));break;case"X":c._d=new Date(1e3*parseFloat(b));break;case"Z":case"ZZ":c._useUTC=!0,c._tzm=I(b);break;case"w":case"ww":case"W":case"WW":case"d":case"dd":case"ddd":case"dddd":case"e":case"E":a=a.substr(0,1);case"gg":case"gggg":case"GG":case"GGGG":case"GGGGG":a=a.substr(0,2),b&&(c._w=c._w||{},c._w[a]=b)}}function K(a){var b,c,d,e,f,g,h,i,j,k,l=[];if(!a._d){for(d=M(a),a._w&&null==a._a[kb]&&null==a._a[jb]&&(f=function(b){var c=parseInt(b,10);return b?b.length<3?c>68?1900+c:2e3+c:c:null==a._a[ib]?db().weekYear():a._a[ib]},g=a._w,null!=g.GG||null!=g.W||null!=g.E?h=Z(f(g.GG),g.W||1,g.E,4,1):(i=C(a._l),j=null!=g.d?V(g.d,i):null!=g.e?parseInt(g.e,10)+i._week.dow:0,k=parseInt(g.w,10)||1,null!=g.d&&j<i._week.dow&&k++,h=Z(f(g.gg),k,j,i._week.doy,i._week.dow)),a._a[ib]=h.year,a._dayOfYear=h.dayOfYear),a._dayOfYear&&(e=null==a._a[ib]?d[ib]:a._a[ib],a._dayOfYear>u(e)&&(a._pf._overflowDayOfYear=!0),c=U(e,0,a._dayOfYear),a._a[jb]=c.getUTCMonth(),a._a[kb]=c.getUTCDate()),b=0;3>b&&null==a._a[b];++b)a._a[b]=l[b]=d[b];for(;7>b;b++)a._a[b]=l[b]=null==a._a[b]?2===b?1:0:a._a[b];l[lb]+=s((a._tzm||0)/60),l[mb]+=s((a._tzm||0)%60),a._d=(a._useUTC?U:T).apply(null,l)}}function L(a){var b;a._d||(b=q(a._i),a._a=[b.year,b.month,b.day,b.hour,b.minute,b.second,b.millisecond],K(a))}function M(a){var b=new Date;return a._useUTC?[b.getUTCFullYear(),b.getUTCMonth(),b.getUTCDate()]:[b.getFullYear(),b.getMonth(),b.getDate()]}function N(a){a._a=[],a._pf.empty=!0;var b,c,d,e,f,g=C(a._l),h=""+a._i,i=h.length,j=0;for(d=G(a._f,g).match(vb)||[],b=0;b<d.length;b++)e=d[b],c=(h.match(H(e,a))||[])[0],c&&(f=h.substr(0,h.indexOf(c)),f.length>0&&a._pf.unusedInput.push(f),h=h.slice(h.indexOf(c)+c.length),j+=c.length),Yb[e]?(c?a._pf.empty=!1:a._pf.unusedTokens.push(e),J(e,c,a)):a._strict&&!c&&a._pf.unusedTokens.push(e);a._pf.charsLeftOver=i-j,h.length>0&&a._pf.unusedInput.push(h),a._isPm&&a._a[lb]<12&&(a._a[lb]+=12),a._isPm===!1&&12===a._a[lb]&&(a._a[lb]=0),K(a),w(a)}function O(a){return a.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,function(a,b,c,d,e){return b||c||d||e})}function P(a){return a.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")}function Q(a){var c,d,e,f,g;if(0===a._f.length)return a._pf.invalidFormat=!0,a._d=new Date(0/0),void 0;for(f=0;f<a._f.length;f++)g=0,c=h({},a),c._pf=b(),c._f=a._f[f],N(c),x(c)&&(g+=c._pf.charsLeftOver,g+=10*c._pf.unusedTokens.length,c._pf.score=g,(null==e||e>g)&&(e=g,d=c));h(a,d||c)}function R(a){var b,c,d=a._i,e=Mb.exec(d);if(e){for(a._pf.iso=!0,b=0,c=Ob.length;c>b;b++)if(Ob[b][1].exec(d)){a._f=Ob[b][0]+(e[6]||" ");break}for(b=0,c=Pb.length;c>b;b++)if(Pb[b][1].exec(d)){a._f+=Pb[b][0];break}d.match(Db)&&(a._f+="Z"),N(a)}else a._d=new Date(d)}function S(b){var c=b._i,d=sb.exec(c);c===a?b._d=new Date:d?b._d=new Date(+d[1]):"string"==typeof c?R(b):m(c)?(b._a=c.slice(0),K(b)):n(c)?b._d=new Date(+c):"object"==typeof c?L(b):b._d=new Date(c)}function T(a,b,c,d,e,f,g){var h=new Date(a,b,c,d,e,f,g);return 1970>a&&h.setFullYear(a),h}function U(a){var b=new Date(Date.UTC.apply(null,arguments));return 1970>a&&b.setUTCFullYear(a),b}function V(a,b){if("string"==typeof a)if(isNaN(a)){if(a=b.weekdaysParse(a),"number"!=typeof a)return null}else a=parseInt(a,10);return a}function W(a,b,c,d,e){return e.relativeTime(b||1,!!c,a,d)}function X(a,b,c){var d=hb(Math.abs(a)/1e3),e=hb(d/60),f=hb(e/60),g=hb(f/24),h=hb(g/365),i=45>d&&["s",d]||1===e&&["m"]||45>e&&["mm",e]||1===f&&["h"]||22>f&&["hh",f]||1===g&&["d"]||25>=g&&["dd",g]||45>=g&&["M"]||345>g&&["MM",hb(g/30)]||1===h&&["y"]||["yy",h];return i[2]=b,i[3]=a>0,i[4]=c,W.apply({},i)}function Y(a,b,c){var d,e=c-b,f=c-a.day();return f>e&&(f-=7),e-7>f&&(f+=7),d=db(a).add("d",f),{week:Math.ceil(d.dayOfYear()/7),year:d.year()}}function Z(a,b,c,d,e){var f,g,h=U(a,0,1).getUTCDay();return c=null!=c?c:e,f=e-h+(h>d?7:0)-(e>h?7:0),g=7*(b-1)+(c-e)+f+1,{year:g>0?a:a-1,dayOfYear:g>0?g:u(a-1)+g}}function $(a){var b=a._i,c=a._f;return null===b?db.invalid({nullInput:!0}):("string"==typeof b&&(a._i=b=C().preparse(b)),db.isMoment(b)?(a=i(b),a._d=new Date(+b._d)):c?m(c)?Q(a):N(a):S(a),new f(a))}function _(a,b){db.fn[a]=db.fn[a+"s"]=function(a){var c=this._isUTC?"UTC":"";return null!=a?(this._d["set"+c+b](a),db.updateOffset(this),this):this._d["get"+c+b]()}}function ab(a){db.duration.fn[a]=function(){return this._data[a]}}function bb(a,b){db.duration.fn["as"+a]=function(){return+this/b}}function cb(a){var b=!1,c=db;"undefined"==typeof ender&&(a?(gb.moment=function(){return!b&&console&&console.warn&&(b=!0,console.warn("Accessing Moment through the global scope is deprecated, and will be removed in an upcoming release.")),c.apply(null,arguments)},h(gb.moment,c)):gb.moment=db)}for(var db,eb,fb="2.5.1",gb=this,hb=Math.round,ib=0,jb=1,kb=2,lb=3,mb=4,nb=5,ob=6,pb={},qb={_isAMomentObject:null,_i:null,_f:null,_l:null,_strict:null,_isUTC:null,_offset:null,_pf:null,_lang:null},rb="undefined"!=typeof module&&module.exports&&"undefined"!=typeof require,sb=/^\/?Date\((\-?\d+)/i,tb=/(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,ub=/^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,vb=/(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g,wb=/(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,xb=/\d\d?/,yb=/\d{1,3}/,zb=/\d{1,4}/,Ab=/[+\-]?\d{1,6}/,Bb=/\d+/,Cb=/[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i,Db=/Z|[\+\-]\d\d:?\d\d/gi,Eb=/T/i,Fb=/[\+\-]?\d+(\.\d{1,3})?/,Gb=/\d/,Hb=/\d\d/,Ib=/\d{3}/,Jb=/\d{4}/,Kb=/[+-]?\d{6}/,Lb=/[+-]?\d+/,Mb=/^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,Nb="YYYY-MM-DDTHH:mm:ssZ",Ob=[["YYYYYY-MM-DD",/[+-]\d{6}-\d{2}-\d{2}/],["YYYY-MM-DD",/\d{4}-\d{2}-\d{2}/],["GGGG-[W]WW-E",/\d{4}-W\d{2}-\d/],["GGGG-[W]WW",/\d{4}-W\d{2}/],["YYYY-DDD",/\d{4}-\d{3}/]],Pb=[["HH:mm:ss.SSSS",/(T| )\d\d:\d\d:\d\d\.\d{1,3}/],["HH:mm:ss",/(T| )\d\d:\d\d:\d\d/],["HH:mm",/(T| )\d\d:\d\d/],["HH",/(T| )\d\d/]],Qb=/([\+\-]|\d\d)/gi,Rb="Date|Hours|Minutes|Seconds|Milliseconds".split("|"),Sb={Milliseconds:1,Seconds:1e3,Minutes:6e4,Hours:36e5,Days:864e5,Months:2592e6,Years:31536e6},Tb={ms:"millisecond",s:"second",m:"minute",h:"hour",d:"day",D:"date",w:"week",W:"isoWeek",M:"month",y:"year",DDD:"dayOfYear",e:"weekday",E:"isoWeekday",gg:"weekYear",GG:"isoWeekYear"},Ub={dayofyear:"dayOfYear",isoweekday:"isoWeekday",isoweek:"isoWeek",weekyear:"weekYear",isoweekyear:"isoWeekYear"},Vb={},Wb="DDD w W M D d".split(" "),Xb="M D H h m s w W".split(" "),Yb={M:function(){return this.month()+1},MMM:function(a){return this.lang().monthsShort(this,a)},MMMM:function(a){return this.lang().months(this,a)},D:function(){return this.date()},DDD:function(){return this.dayOfYear()},d:function(){return this.day()},dd:function(a){return this.lang().weekdaysMin(this,a)},ddd:function(a){return this.lang().weekdaysShort(this,a)},dddd:function(a){return this.lang().weekdays(this,a)},w:function(){return this.week()},W:function(){return this.isoWeek()},YY:function(){return k(this.year()%100,2)},YYYY:function(){return k(this.year(),4)},YYYYY:function(){return k(this.year(),5)},YYYYYY:function(){var a=this.year(),b=a>=0?"+":"-";return b+k(Math.abs(a),6)},gg:function(){return k(this.weekYear()%100,2)},gggg:function(){return k(this.weekYear(),4)},ggggg:function(){return k(this.weekYear(),5)},GG:function(){return k(this.isoWeekYear()%100,2)},GGGG:function(){return k(this.isoWeekYear(),4)},GGGGG:function(){return k(this.isoWeekYear(),5)},e:function(){return this.weekday()},E:function(){return this.isoWeekday()},a:function(){return this.lang().meridiem(this.hours(),this.minutes(),!0)},A:function(){return this.lang().meridiem(this.hours(),this.minutes(),!1)},H:function(){return this.hours()},h:function(){return this.hours()%12||12},m:function(){return this.minutes()},s:function(){return this.seconds()},S:function(){return s(this.milliseconds()/100)},SS:function(){return k(s(this.milliseconds()/10),2)},SSS:function(){return k(this.milliseconds(),3)},SSSS:function(){return k(this.milliseconds(),3)},Z:function(){var a=-this.zone(),b="+";return 0>a&&(a=-a,b="-"),b+k(s(a/60),2)+":"+k(s(a)%60,2)},ZZ:function(){var a=-this.zone(),b="+";return 0>a&&(a=-a,b="-"),b+k(s(a/60),2)+k(s(a)%60,2)},z:function(){return this.zoneAbbr()},zz:function(){return this.zoneName()},X:function(){return this.unix()},Q:function(){return this.quarter()}},Zb=["months","monthsShort","weekdays","weekdaysShort","weekdaysMin"];Wb.length;)eb=Wb.pop(),Yb[eb+"o"]=d(Yb[eb],eb);for(;Xb.length;)eb=Xb.pop(),Yb[eb+eb]=c(Yb[eb],2);for(Yb.DDDD=c(Yb.DDD,3),h(e.prototype,{set:function(a){var b,c;for(c in a)b=a[c],"function"==typeof b?this[c]=b:this["_"+c]=b},_months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),months:function(a){return this._months[a.month()]},_monthsShort:"Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),monthsShort:function(a){return this._monthsShort[a.month()]},monthsParse:function(a){var b,c,d;for(this._monthsParse||(this._monthsParse=[]),b=0;12>b;b++)if(this._monthsParse[b]||(c=db.utc([2e3,b]),d="^"+this.months(c,"")+"|^"+this.monthsShort(c,""),this._monthsParse[b]=new RegExp(d.replace(".",""),"i")),this._monthsParse[b].test(a))return b},_weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),weekdays:function(a){return this._weekdays[a.day()]},_weekdaysShort:"Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),weekdaysShort:function(a){return this._weekdaysShort[a.day()]},_weekdaysMin:"Su_Mo_Tu_We_Th_Fr_Sa".split("_"),weekdaysMin:function(a){return this._weekdaysMin[a.day()]},weekdaysParse:function(a){var b,c,d;for(this._weekdaysParse||(this._weekdaysParse=[]),b=0;7>b;b++)if(this._weekdaysParse[b]||(c=db([2e3,1]).day(b),d="^"+this.weekdays(c,"")+"|^"+this.weekdaysShort(c,"")+"|^"+this.weekdaysMin(c,""),this._weekdaysParse[b]=new RegExp(d.replace(".",""),"i")),this._weekdaysParse[b].test(a))return b},_longDateFormat:{LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D YYYY",LLL:"MMMM D YYYY LT",LLLL:"dddd, MMMM D YYYY LT"},longDateFormat:function(a){var b=this._longDateFormat[a];return!b&&this._longDateFormat[a.toUpperCase()]&&(b=this._longDateFormat[a.toUpperCase()].replace(/MMMM|MM|DD|dddd/g,function(a){return a.slice(1)}),this._longDateFormat[a]=b),b},isPM:function(a){return"p"===(a+"").toLowerCase().charAt(0)},_meridiemParse:/[ap]\.?m?\.?/i,meridiem:function(a,b,c){return a>11?c?"pm":"PM":c?"am":"AM"},_calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},calendar:function(a,b){var c=this._calendar[a];return"function"==typeof c?c.apply(b):c},_relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},relativeTime:function(a,b,c,d){var e=this._relativeTime[c];return"function"==typeof e?e(a,b,c,d):e.replace(/%d/i,a)},pastFuture:function(a,b){var c=this._relativeTime[a>0?"future":"past"];return"function"==typeof c?c(b):c.replace(/%s/i,b)},ordinal:function(a){return this._ordinal.replace("%d",a)},_ordinal:"%d",preparse:function(a){return a},postformat:function(a){return a},week:function(a){return Y(a,this._week.dow,this._week.doy).week},_week:{dow:0,doy:6},_invalidDate:"Invalid date",invalidDate:function(){return this._invalidDate}}),db=function(c,d,e,f){var g;return"boolean"==typeof e&&(f=e,e=a),g={},g._isAMomentObject=!0,g._i=c,g._f=d,g._l=e,g._strict=f,g._isUTC=!1,g._pf=b(),$(g)},db.utc=function(c,d,e,f){var g;return"boolean"==typeof e&&(f=e,e=a),g={},g._isAMomentObject=!0,g._useUTC=!0,g._isUTC=!0,g._l=e,g._i=c,g._f=d,g._strict=f,g._pf=b(),$(g).utc()},db.unix=function(a){return db(1e3*a)},db.duration=function(a,b){var c,d,e,f=a,h=null;return db.isDuration(a)?f={ms:a._milliseconds,d:a._days,M:a._months}:"number"==typeof a?(f={},b?f[b]=a:f.milliseconds=a):(h=tb.exec(a))?(c="-"===h[1]?-1:1,f={y:0,d:s(h[kb])*c,h:s(h[lb])*c,m:s(h[mb])*c,s:s(h[nb])*c,ms:s(h[ob])*c}):(h=ub.exec(a))&&(c="-"===h[1]?-1:1,e=function(a){var b=a&&parseFloat(a.replace(",","."));return(isNaN(b)?0:b)*c},f={y:e(h[2]),M:e(h[3]),d:e(h[4]),h:e(h[5]),m:e(h[6]),s:e(h[7]),w:e(h[8])}),d=new g(f),db.isDuration(a)&&a.hasOwnProperty("_lang")&&(d._lang=a._lang),d},db.version=fb,db.defaultFormat=Nb,db.updateOffset=function(){},db.lang=function(a,b){var c;return a?(b?A(y(a),b):null===b?(B(a),a="en"):pb[a]||C(a),c=db.duration.fn._lang=db.fn._lang=C(a),c._abbr):db.fn._lang._abbr},db.langData=function(a){return a&&a._lang&&a._lang._abbr&&(a=a._lang._abbr),C(a)},db.isMoment=function(a){return a instanceof f||null!=a&&a.hasOwnProperty("_isAMomentObject")},db.isDuration=function(a){return a instanceof g},eb=Zb.length-1;eb>=0;--eb)r(Zb[eb]);for(db.normalizeUnits=function(a){return p(a)},db.invalid=function(a){var b=db.utc(0/0);return null!=a?h(b._pf,a):b._pf.userInvalidated=!0,b},db.parseZone=function(a){return db(a).parseZone()},h(db.fn=f.prototype,{clone:function(){return db(this)},valueOf:function(){return+this._d+6e4*(this._offset||0)},unix:function(){return Math.floor(+this/1e3)},toString:function(){return this.clone().lang("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")},toDate:function(){return this._offset?new Date(+this):this._d},toISOString:function(){var a=db(this).utc();return 0<a.year()&&a.year()<=9999?F(a,"YYYY-MM-DD[T]HH:mm:ss.SSS[Z]"):F(a,"YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]")},toArray:function(){var a=this;return[a.year(),a.month(),a.date(),a.hours(),a.minutes(),a.seconds(),a.milliseconds()]},isValid:function(){return x(this)},isDSTShifted:function(){return this._a?this.isValid()&&o(this._a,(this._isUTC?db.utc(this._a):db(this._a)).toArray())>0:!1},parsingFlags:function(){return h({},this._pf)},invalidAt:function(){return this._pf.overflow},utc:function(){return this.zone(0)},local:function(){return this.zone(0),this._isUTC=!1,this},format:function(a){var b=F(this,a||db.defaultFormat);return this.lang().postformat(b)},add:function(a,b){var c;return c="string"==typeof a?db.duration(+b,a):db.duration(a,b),l(this,c,1),this},subtract:function(a,b){var c;return c="string"==typeof a?db.duration(+b,a):db.duration(a,b),l(this,c,-1),this},diff:function(a,b,c){var d,e,f=z(a,this),g=6e4*(this.zone()-f.zone());return b=p(b),"year"===b||"month"===b?(d=432e5*(this.daysInMonth()+f.daysInMonth()),e=12*(this.year()-f.year())+(this.month()-f.month()),e+=(this-db(this).startOf("month")-(f-db(f).startOf("month")))/d,e-=6e4*(this.zone()-db(this).startOf("month").zone()-(f.zone()-db(f).startOf("month").zone()))/d,"year"===b&&(e/=12)):(d=this-f,e="second"===b?d/1e3:"minute"===b?d/6e4:"hour"===b?d/36e5:"day"===b?(d-g)/864e5:"week"===b?(d-g)/6048e5:d),c?e:j(e)},from:function(a,b){return db.duration(this.diff(a)).lang(this.lang()._abbr).humanize(!b)},fromNow:function(a){return this.from(db(),a)},calendar:function(){var a=z(db(),this).startOf("day"),b=this.diff(a,"days",!0),c=-6>b?"sameElse":-1>b?"lastWeek":0>b?"lastDay":1>b?"sameDay":2>b?"nextDay":7>b?"nextWeek":"sameElse";return this.format(this.lang().calendar(c,this))},isLeapYear:function(){return v(this.year())},isDST:function(){return this.zone()<this.clone().month(0).zone()||this.zone()<this.clone().month(5).zone()},day:function(a){var b=this._isUTC?this._d.getUTCDay():this._d.getDay();return null!=a?(a=V(a,this.lang()),this.add({d:a-b})):b},month:function(a){var b,c=this._isUTC?"UTC":"";return null!=a?"string"==typeof a&&(a=this.lang().monthsParse(a),"number"!=typeof a)?this:(b=this.date(),this.date(1),this._d["set"+c+"Month"](a),this.date(Math.min(b,this.daysInMonth())),db.updateOffset(this),this):this._d["get"+c+"Month"]()},startOf:function(a){switch(a=p(a)){case"year":this.month(0);case"month":this.date(1);case"week":case"isoWeek":case"day":this.hours(0);case"hour":this.minutes(0);case"minute":this.seconds(0);case"second":this.milliseconds(0)}return"week"===a?this.weekday(0):"isoWeek"===a&&this.isoWeekday(1),this},endOf:function(a){return a=p(a),this.startOf(a).add("isoWeek"===a?"week":a,1).subtract("ms",1)},isAfter:function(a,b){return b="undefined"!=typeof b?b:"millisecond",+this.clone().startOf(b)>+db(a).startOf(b)},isBefore:function(a,b){return b="undefined"!=typeof b?b:"millisecond",+this.clone().startOf(b)<+db(a).startOf(b)},isSame:function(a,b){return b=b||"ms",+this.clone().startOf(b)===+z(a,this).startOf(b)},min:function(a){return a=db.apply(null,arguments),this>a?this:a},max:function(a){return a=db.apply(null,arguments),a>this?this:a},zone:function(a){var b=this._offset||0;return null==a?this._isUTC?b:this._d.getTimezoneOffset():("string"==typeof a&&(a=I(a)),Math.abs(a)<16&&(a=60*a),this._offset=a,this._isUTC=!0,b!==a&&l(this,db.duration(b-a,"m"),1,!0),this)},zoneAbbr:function(){return this._isUTC?"UTC":""},zoneName:function(){return this._isUTC?"Coordinated Universal Time":""},parseZone:function(){return this._tzm?this.zone(this._tzm):"string"==typeof this._i&&this.zone(this._i),this},hasAlignedHourOffset:function(a){return a=a?db(a).zone():0,(this.zone()-a)%60===0},daysInMonth:function(){return t(this.year(),this.month())},dayOfYear:function(a){var b=hb((db(this).startOf("day")-db(this).startOf("year"))/864e5)+1;return null==a?b:this.add("d",a-b)},quarter:function(){return Math.ceil((this.month()+1)/3)},weekYear:function(a){var b=Y(this,this.lang()._week.dow,this.lang()._week.doy).year;return null==a?b:this.add("y",a-b)},isoWeekYear:function(a){var b=Y(this,1,4).year;return null==a?b:this.add("y",a-b)},week:function(a){var b=this.lang().week(this);return null==a?b:this.add("d",7*(a-b))},isoWeek:function(a){var b=Y(this,1,4).week;return null==a?b:this.add("d",7*(a-b))},weekday:function(a){var b=(this.day()+7-this.lang()._week.dow)%7;return null==a?b:this.add("d",a-b)},isoWeekday:function(a){return null==a?this.day()||7:this.day(this.day()%7?a:a-7)},get:function(a){return a=p(a),this[a]()},set:function(a,b){return a=p(a),"function"==typeof this[a]&&this[a](b),this},lang:function(b){return b===a?this._lang:(this._lang=C(b),this)}}),eb=0;eb<Rb.length;eb++)_(Rb[eb].toLowerCase().replace(/s$/,""),Rb[eb]);_("year","FullYear"),db.fn.days=db.fn.day,db.fn.months=db.fn.month,db.fn.weeks=db.fn.week,db.fn.isoWeeks=db.fn.isoWeek,db.fn.toJSON=db.fn.toISOString,h(db.duration.fn=g.prototype,{_bubble:function(){var a,b,c,d,e=this._milliseconds,f=this._days,g=this._months,h=this._data;h.milliseconds=e%1e3,a=j(e/1e3),h.seconds=a%60,b=j(a/60),h.minutes=b%60,c=j(b/60),h.hours=c%24,f+=j(c/24),h.days=f%30,g+=j(f/30),h.months=g%12,d=j(g/12),h.years=d},weeks:function(){return j(this.days()/7)},valueOf:function(){return this._milliseconds+864e5*this._days+this._months%12*2592e6+31536e6*s(this._months/12)},humanize:function(a){var b=+this,c=X(b,!a,this.lang());return a&&(c=this.lang().pastFuture(b,c)),this.lang().postformat(c)},add:function(a,b){var c=db.duration(a,b);return this._milliseconds+=c._milliseconds,this._days+=c._days,this._months+=c._months,this._bubble(),this},subtract:function(a,b){var c=db.duration(a,b);return this._milliseconds-=c._milliseconds,this._days-=c._days,this._months-=c._months,this._bubble(),this},get:function(a){return a=p(a),this[a.toLowerCase()+"s"]()},as:function(a){return a=p(a),this["as"+a.charAt(0).toUpperCase()+a.slice(1)+"s"]()},lang:db.fn.lang,toIsoString:function(){var a=Math.abs(this.years()),b=Math.abs(this.months()),c=Math.abs(this.days()),d=Math.abs(this.hours()),e=Math.abs(this.minutes()),f=Math.abs(this.seconds()+this.milliseconds()/1e3);return this.asSeconds()?(this.asSeconds()<0?"-":"")+"P"+(a?a+"Y":"")+(b?b+"M":"")+(c?c+"D":"")+(d||e||f?"T":"")+(d?d+"H":"")+(e?e+"M":"")+(f?f+"S":""):"P0D"}});for(eb in Sb)Sb.hasOwnProperty(eb)&&(bb(eb,Sb[eb]),ab(eb.toLowerCase()));bb("Weeks",6048e5),db.duration.fn.asMonths=function(){return(+this-31536e6*this.years())/2592e6+12*this.years()},db.lang("en",{ordinal:function(a){var b=a%10,c=1===s(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th";return a+c}}),rb?(module.exports=db,cb(!0)):"function"==typeof define&&define.amd?define("moment",function(b,c,d){return d.config&&d.config()&&d.config().noGlobal!==!0&&cb(d.config().noGlobal===a),db}):cb()}).call(this);;

!function(a){"use strict";var b=a.document;b&&(Date.now||(Date.now=function(){return+new Date}),String.prototype.trim||(String.prototype.trim=function(){return this.replace(/^\s+/,"").replace(/\s+$/,"")}),Object.keys||(Object.keys=function(){var a=Object.prototype.hasOwnProperty,b=!{toString:null}.propertyIsEnumerable("toString"),c=["toString","toLocaleString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","constructor"],d=c.length;return function(e){if("object"!=typeof e&&"function"!=typeof e||null===e)throw new TypeError("Object.keys called on non-object");var f=[];for(var g in e)a.call(e,g)&&f.push(g);if(b)for(var h=0;d>h;h++)a.call(e,c[h])&&f.push(c[h]);return f}}()),Array.prototype.indexOf||(Array.prototype.indexOf=function(a,b){var c;for(void 0===b&&(b=0),0>b&&(b+=this.length),0>b&&(b=0),c=this.length;c>b;b++)if(this.hasOwnProperty(b)&&this[b]===a)return b;return-1}),Array.prototype.forEach||(Array.prototype.forEach=function(a,b){var c,d;for(c=0,d=this.length;d>c;c+=1)this.hasOwnProperty(c)&&a.call(b,this[c],c,this)}),Array.prototype.map||(Array.prototype.map=function(a,b){var c,d,e=[];for(c=0,d=this.length;d>c;c+=1)this.hasOwnProperty(c)&&(e[c]=a.call(b,this[c],c,this));return e}),Array.prototype.filter||(Array.prototype.filter=function(a,b){var c,d,e=[];for(c=0,d=this.length;d>c;c+=1)this.hasOwnProperty(c)&&a.call(b,this[c],c,this)&&(e[e.length]=this[c]);return e}),a.addEventListener||!function(a,b){var c,d,e,f,g,h;c=function(a,b){var c,d=this;for(c in a)d[c]=a[c];d.currentTarget=b,d.target=a.srcElement||b,d.timeStamp=+new Date,d.preventDefault=function(){a.returnValue=!1},d.stopPropagation=function(){a.cancelBubble=!0}},d=function(a,b){var d,e,f=this;d=f.listeners||(f.listeners=[]),e=d.length,d[e]=[b,function(a){b.call(f,new c(a,f))}],f.attachEvent("on"+a,d[e][1])},e=function(a,b){var c,d,e=this;if(e.listeners)for(c=e.listeners,d=c.length;d--;)c[d][0]===b&&e.detachEvent("on"+a,c[d][1])},a.addEventListener=b.addEventListener=d,a.removeEventListener=b.removeEventListener=e,"Element"in a?(Element.prototype.addEventListener=d,Element.prototype.removeEventListener=e):(h=b.createElement,b.createElement=function(a){var b=h(a);return b.addEventListener=d,b.removeEventListener=e,b},f=b.getElementsByTagName("head")[0],g=b.createElement("style"),f.insertBefore(g,f.firstChild))}(a,b),a.getComputedStyle||(a.getComputedStyle=function(){function a(b,c,d,e){var f,g=c[d],h=parseFloat(g),i=g.split(/\d/)[0];return e=null!=e?e:/%|em/.test(i)&&b.parentElement?a(b.parentElement,b.parentElement.currentStyle,"fontSize",null):16,f="fontSize"==d?e:/width/i.test(d)?b.clientWidth:b.clientHeight,"em"==i?h*e:"in"==i?96*h:"pt"==i?96*h/72:"%"==i?h/100*f:h}function b(a,b){var c="border"==b?"Width":"",d=b+"Top"+c,e=b+"Right"+c,f=b+"Bottom"+c,g=b+"Left"+c;a[b]=(a[d]==a[e]==a[f]==a[g]?[a[d]]:a[d]==a[f]&&a[g]==a[e]?[a[d],a[e]]:a[g]==a[e]?[a[d],a[e],a[f]]:[a[d],a[e],a[f],a[g]]).join(" ")}function c(c){var d,e,f,g;d=c.currentStyle,e=this,f=a(c,d,"fontSize",null);for(g in d)/width|height|margin.|padding.|border.+W/.test(g)&&"auto"!==e[g]?e[g]=a(c,d,g,f)+"px":"styleFloat"===g?e.float=d[g]:e[g]=d[g];return b(e,"margin"),b(e,"padding"),b(e,"border"),e.fontSize=f+"px",e}function d(a){return new c(a)}return c.prototype={constructor:c,getPropertyPriority:function(){},getPropertyValue:function(a){return this[a]||""},item:function(){},removeProperty:function(){},setProperty:function(){},getPropertyCSSValue:function(){}},d}()))}("undefined"!=typeof window?window:this),function(a){var b=function(){return"undefined"!=typeof document?document&&document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure","1.1"):void 0}(),c=function(){var a;try{Object.create(null),a=Object.create}catch(b){a=function(){var a=function(){};return function(b,c){var d;return null===b?{}:(a.prototype=b,d=new a,c&&Object.defineProperties(d,c),d)}}()}return a}(),d={html:"http://www.w3.org/1999/xhtml",mathml:"http://www.w3.org/1998/Math/MathML",svg:"http://www.w3.org/2000/svg",xlink:"http://www.w3.org/1999/xlink",xml:"http://www.w3.org/XML/1998/namespace",xmlns:"http://www.w3.org/2000/xmlns/"},e=function(a,b){return a?function(a,b){return b?document.createElementNS(b,a):document.createElement(a)}:function(a,c){if(c&&c!==b.html)throw"This browser does not support namespaces other than http://www.w3.org/1999/xhtml. The most likely cause of this error is that you're trying to render SVG in an older browser. See https://github.com/RactiveJS/Ractive/wiki/SVG-and-older-browsers for more information";return document.createElement(a)}}(b,d),f=function(){return"object"==typeof document?!0:!1}(),g=function(a){try{return Object.defineProperty({},"test",{value:0}),a&&Object.defineProperty(document.createElement("div"),"test",{value:0}),Object.defineProperty}catch(b){return function(a,b,c){a[b]=c.value}}}(f),h=function(a,b,c){try{try{Object.defineProperties({},{test:{value:0}})}catch(d){throw d}return c&&Object.defineProperties(a("div"),{test:{value:0}}),Object.defineProperties}catch(d){return function(a,c){var d;for(d in c)c.hasOwnProperty(d)&&b(a,d,c[d])}}}(e,g,f),i=function(){var a=/\[\s*(\*|[0-9]|[1-9][0-9]+)\s*\]/g;return function(b){return(b||"").replace(a,".$1")}}(),j={},k={TEXT:1,INTERPOLATOR:2,TRIPLE:3,SECTION:4,INVERTED:5,CLOSING:6,ELEMENT:7,PARTIAL:8,COMMENT:9,DELIMCHANGE:10,MUSTACHE:11,TAG:12,ATTRIBUTE:13,COMPONENT:15,NUMBER_LITERAL:20,STRING_LITERAL:21,ARRAY_LITERAL:22,OBJECT_LITERAL:23,BOOLEAN_LITERAL:24,GLOBAL:26,KEY_VALUE_PAIR:27,REFERENCE:30,REFINEMENT:31,MEMBER:32,PREFIX_OPERATOR:33,BRACKETED:34,CONDITIONAL:35,INFIX_OPERATOR:36,INVOCATION:40},l=function(){var a=Object.prototype.toString;return function(b){return"[object Array]"===a.call(b)}}(),m=function(){return function a(b,c){var d,e;if((e=b._wrapped[c])&&e.teardown()!==!1&&(b._wrapped[c]=null),b._cache[c]=void 0,d=b._cacheMap[c])for(;d.length;)a(b,d.pop())}}(),n=function(){return function(a,b){var c,d,e,f,g,h;for(c=[],h=a.rendered?a.el:a.fragment.docFrag,d=h.querySelectorAll('input[type="checkbox"][name="{{'+b+'}}"]'),f=d.length,g=0;f>g;g+=1)e=d[g],(e.hasAttribute("checked")||e.checked)&&(c[c.length]=e._ractive.value);return c}}(),o=function(a){return function(b){var c,d,e,f,g,h;for(c=b._deferred;d=c.evals.pop();)d.update().deferred=!1;for(;e=c.selectValues.pop();)e.deferredUpdate();for(;f=c.attrs.pop();)f.update().deferred=!1;for(;g=c.checkboxes.pop();)b.set(g,a(b,g));for(;h=c.radios.pop();)h.update()}}(n),p=function(){return function(a){var b,c,d,e,f,g;for(b=a._deferred,(c=b.focusable)&&(c.focus(),b.focusable=null);d=b.liveQueries.pop();)d._sort();for(;e=b.decorators.pop();)e.init();for(;f=b.transitions.pop();)f.init();for(;g=b.observers.pop();)g.update()}}(),q=function(){var a=function(a,b){var c,d,e,f;return a._parent&&a._parent._transitionManager?a._parent._transitionManager:(d=[],e=function(){var a,b;for(a=d.length;a--;)b=d[a],f(b.node)&&(b.detach(),d.splice(a,1))},f=function(a){var b,d;for(b=c.active.length;b--;)if(d=c.active[b],a.contains(d))return!1;return!0},c={active:[],push:function(a){c.active[c.active.length]=a},pop:function(a){var b;b=c.active.indexOf(a),-1!==b&&(c.active.splice(b,1),e(),!c.active.length&&c._ready&&c.complete())},complete:function(){b&&b.call(a)},ready:function(){e(),c._ready=!0,c.active.length||c.complete()},detachWhenReady:function(a){d[d.length]=a}})};return a}(),r=function(){function a(a,d,e,f){var g=a._deps[e];g&&(b(g[d]),f||c(a._depsMap[d],a,e))}function b(a){var b,c;if(a)for(c=a.length,b=0;c>b;b+=1)a[b].update()}function c(b,c,d,e){var f;if(b)for(f=b.length;f--;)a(c,b[f],d,e)}function d(a,b,c,f,g){var i,j,k,l,m,n,o,p;for(i=a._patternObservers.length;i--;)j=a._patternObservers[i],j.regex.test(c)&&j.update(c);f||(p=function(b){if(k=a._depsMap[b])for(i=k.length;i--;)l=k[i],m=h.exec(l)[0],n=c+"."+m,d(a,l,n)},g?(o=e(c),o.forEach(p)):p(b))}function e(a){var b,c,d,e,g,h;for(b=a.split("."),c=f(b.length),g=[],d=function(a,c){return a?"*":b[c]},e=c.length;e--;)h=c[e].map(d).join("."),g[h]||(g[g.length]=h,g[h]=!0);return g}function f(a){var b,c,d,e,f,g="";if(!i[a]){for(d=[];g.length<a;)g+=1;for(b=parseInt(g,2),e=function(a){return"1"===a},f=0;b>=f;f+=1){for(c=f.toString(2);c.length<a;)c="0"+c;d[f]=Array.prototype.map.call(c,e)}i[a]=d}return i[a]}var g,h,i={};return h=/[^\.]+$/,g=function(b,c,e){var f;for(b._patternObservers.length&&d(b,c,c,e,!0),f=0;f<b._deps.length;f+=1)a(b,c,f,e)},g.multiple=function(b,c,e){var f,g,h;if(h=c.length,b._patternObservers.length)for(f=h;f--;)d(b,c[f],c[f],e,!0);for(f=0;f<b._deps.length;f+=1)if(b._deps[f])for(g=h;g--;)a(b,c[g],f,e)},g}(),s=function(a,b,c,d,e,f,g,h){var i,j,k,l,m,n,o,p,q,r;return i={filter:function(a){return c(a)&&(!a._ractive||!a._ractive.setting)},wrap:function(a,b,c){return new k(a,b,c)}},k=function(a,c,d){this.root=a,this.value=c,this.keypath=d,c._ractive||(b(c,"_ractive",{value:{wrappers:[],instances:[],setting:!1},configurable:!0}),l(c)),c._ractive.instances[a._guid]||(c._ractive.instances[a._guid]=0,c._ractive.instances.push(a)),c._ractive.instances[a._guid]+=1,c._ractive.wrappers.push(this)},k.prototype={get:function(){return this.value},teardown:function(){var a,b,c,d,e;if(a=this.value,b=a._ractive,c=b.wrappers,d=b.instances,b.setting)return!1;if(e=c.indexOf(this),-1===e)throw new Error(r);if(c.splice(e,1),c.length){if(d[this.root._guid]-=1,!d[this.root._guid]){if(e=d.indexOf(this.root),-1===e)throw new Error(r);d.splice(e,1)}}else delete a._ractive,m(this.value)}},j=function(b,c,f){var g,i,j,k,l;for(g=function(a,g){var j,k,l,m,n,o,p,q,r,s,t,u;if("sort"===c||"reverse"===c)return a.set(g,b),void 0;for(d(a,g),n=[],o=[],p=0;p<a._deps.length;p+=1)if(j=a._deps[p],j&&(k=j[g])){for(i(g,k,n,o),e(a);n.length;)n.pop().smartUpdate(c,f);for(;o.length;)o.pop().update()}if("splice"===c&&f.length>2&&f[1])for(q=Math.min(f[1],f.length-2),r=f[0],s=r+q,f[1]===f.length-2&&(u=!0),p=r;s>p;p+=1)t=g+"."+p,h(a,t);for(e(a),m=[],l=g.split(".");l.length;)l.pop(),m[m.length]=l.join(".");h.multiple(a,m,!0),u||h(a,g+".length",!0)},i=function(b,c,d,e){var f,g;for(f=c.length;f--;)g=c[f],g.type===a.REFERENCE?g.update():g.keypath===b&&g.type===a.SECTION&&!g.inverted&&g.docFrag?d[d.length]=g:e[e.length]=g},j=b._ractive.wrappers,l=j.length;l--;)k=j[l],g(k.root,k.keypath)},n=[],p=["pop","push","reverse","shift","sort","splice","unshift"],q=function(){},p.forEach(function(a){var c=function(){var b,c,d,h,i={},k={};for(b=Array.prototype[a].apply(this,arguments),c=this._ractive.instances,h=c.length;h--;)d=c[h],i[d._guid]=d._transitionManager,d._transitionManager=k[d._guid]=g(d,q);for(this._ractive.setting=!0,j(this,a,arguments),this._ractive.setting=!1,h=c.length;h--;)d=c[h],d._transitionManager=i[d._guid],k[d._guid].ready(),e(d),f(d);return b};b(n,a,{value:c})}),o={},o.__proto__?(l=function(a){a.__proto__=n},m=function(a){a.__proto__=Array.prototype}):(l=function(a){var c,d;for(c=p.length;c--;)d=p[c],b(a,d,{value:n[d],configurable:!0})},m=function(a){var b;for(b=p.length;b--;)delete a[p[b]]}),r="Something went wrong in a rather interesting way",i}(k,g,l,m,o,p,q,r),t=function(){var a,b;try{Object.defineProperty({},"test",{value:0})}catch(c){return!1}return a={filter:function(a,b){return!!b},wrap:function(a,c,d){return new b(a,c,d)}},b=function(a,b,c){var d,e,f,g,h,i,j,k,l,m=this;if(this.ractive=a,this.keypath=c,d=c.split("."),this.prop=d.pop(),f=d.join("."),this.obj=f?a.get(f):a.data,g=this.originalDescriptor=Object.getOwnPropertyDescriptor(this.obj,this.prop),g&&g.set&&(h=g.set._ractiveWrappers))return-1===h.indexOf(this)&&h.push(this),void 0;if(g&&!g.configurable)throw new Error('Cannot use magic mode with property "'+e+'" - object is not configurable');g&&(this.value=g.value,i=g.get,j=g.set),k=i||function(){return m.value},l=function(a){var b,c,d;for(j&&j(a),b=l._ractiveWrappers,d=b.length;d--;)c=b[d],c.resetting||c.ractive.set(c.keypath,a)},l._ractiveWrappers=[this],Object.defineProperty(this.obj,this.prop,{get:k,set:l,enumerable:!0,configurable:!0})},b.prototype={get:function(){return this.value},reset:function(a){this.resetting=!0,this.value=a,this.resetting=!1},teardown:function(){var a,b,c,d;a=Object.getOwnPropertyDescriptor(this.obj,this.prop),b=a.set,d=b._ractiveWrappers,d.splice(d.indexOf(this),1),d.length||(c=this.obj[this.prop],Object.defineProperty(this.obj,this.prop,this.originalDescriptor||{writable:!0,enumerable:!0,configrable:!0}),this.obj[this.prop]=c)}},a}(),u=function(a,b,c){function d(a,b){var c,d={};if(!b)return a;b+=".";for(c in a)a.hasOwnProperty(c)&&(d[b+c]=a[c]);return d}function e(a){var b;return f[a]||(b=a?a+".":"",f[a]=function(c,e){var f;return"string"==typeof c?(f={},f[b+c]=e,f):"object"==typeof c?b?d(c,a):c:void 0}),f[a]}var f={};return function(d,f,g,h){var i,j,k,l;for(i=d.adaptors.length,j=0;i>j;j+=1){if(k=d.adaptors[j],"string"==typeof k){if(!a[k])throw new Error('Missing adaptor "'+k+'"');k=d.adaptors[j]=a[k]}if(k.filter(g,f,d))return l=d._wrapped[f]=k.wrap(d,g,f,e(f)),l.value=g,void 0}h||(d.magic&&c.filter(g,f,d)?d._wrapped[f]=c.wrap(d,g,f):d.modifyArrays&&b.filter(g,f,d)&&(d._wrapped[f]=b.wrap(d,g,f)))}}(j,s,t),v=function(a,b,c){var d,e,f;return d=function(a){return this._captured&&!this._captured[a]&&(this._captured.push(a),this._captured[a]=!0),e(this,a)},e=function(b,d){var e,g,h,i,j;return d=a(d),e=b._cache,void 0!==(g=e[d])?g:((i=b._wrapped[d])?h=i.value:d?h=(j=b._evaluators[d])?j.value:f(b,d):(c(b,"",b.data),h=b.data),e[d]=h,h)},f=function(a,b){var d,f,g,h,i,j,k;return d=b.split("."),f=d.pop(),g=d.join("."),h=e(a,g),(k=a._wrapped[g])&&(h=k.get()),null!==h&&void 0!==h?((i=a._cacheMap[g])?-1===i.indexOf(b)&&(i[i.length]=b):a._cacheMap[g]=[b],j=h[f],c(a,b,j),a._cache[b]=j,j):void 0},d}(i,j,u),w=function(){var a=Object.prototype.toString;return function(b){return"object"==typeof b&&"[object Object]"===a.call(b)}}(),x=function(){return function(a,b){return null===a&&null===b?!0:"object"==typeof a||"object"==typeof b?!1:a===b}}(),y=function(){var a;return a=function(a,b,c){var d,e,f,g,h,i,j,k,l,m,n;if(n='Could not resolve reference - too many "../" prefixes',"."===b){if(!c.length)return"";d=c[c.length-1]}else if("."===b.charAt(0))if(m=c[c.length-1],g=m?m.split("."):[],"../"===b.substr(0,3)){for(;"../"===b.substr(0,3);){if(!g.length)throw new Error(n);g.pop(),b=b.substring(3)}g.push(b),d=g.join(".")}else d=m?m+b:b.substring(1);else{for(e=b.split("."),f=e.pop(),i=e.length?"."+e.join("."):"",c=c.concat();c.length;)if(h=c.pop(),j=h+i,k=a.get(j),(l=a._wrapped[j])&&(k=l.get()),"object"==typeof k&&null!==k&&k.hasOwnProperty(f)){d=h+"."+b;break}d||void 0===a.get(b)||(d=b)}return d?d.replace(/^\./,""):d}}(),z=function(a){var b=Array.prototype.push;return function(c){for(var d,e,f;d=c._pendingResolution.pop();)e=a(c,d.ref,d.contextStack),void 0!==e?d.resolve(e):(f||(f=[])).push(d);f&&b.apply(c._pendingResolution,f)}}(y),A=function(a,b){return function(c){a(c),b(c)}}(o,p),B=function(){return function(a,b,c){var d,e,f,g,h,i,j;for(d=b.split("."),e=[],(f=a._wrapped[""])?(f.set&&f.set(d.join("."),c),g=f.get()):g=a.data;d.length>1;)h=e[e.length]=d.shift(),i=e.join("."),(f=a._wrapped[i])?(f.set&&f.set(d.join("."),c),g=f.get()):(g.hasOwnProperty(h)||(j||(j=i),g[h]=/^\s*[0-9]+\s*$/.test(d[0])?[]:{}),g=g[h]);return h=d[0],g[h]=c,j}}(),C=function(a,b,c,d,e,f,g,h,i){var j,k,l,m;return j=function(b,d,i){var j,m,n,o,p,q,r;if(m=[],a(b)&&(j=b,i=d),j)for(b in j)j.hasOwnProperty(b)&&(d=j[b],b=c(b),k(this,b,d,m));else b=c(b),k(this,b,d,m);if(m.length){if(o=this._transitionManager,this._transitionManager=p=g(this,i),n=l(m),n.length&&e.multiple(this,n,!0),e.multiple(this,m),this._pendingResolution.length&&f(this),h(this),this._transitionManager=o,p.ready(),!this.firingChangeEvent){for(this.firingChangeEvent=!0,r={},q=m.length;q--;)r[m[q]]=this.get(m[q]);this.fire("change",r),this.firingChangeEvent=!1}return this}},k=function(a,b,c,e){var f,g,h,j,k;if(!(h=a._wrapped[b])||!h.reset||m(a,b,c,h,e)===!1){if((k=a._evaluators[b])&&(k.value=c),f=a._cache[b],g=a.get(b),g===c||k){if(c===f&&"object"!=typeof c)return}else j=i(a,b,c);d(a,j||b),e[e.length]=b}},l=function(a){var b,c,d,e,f=[""];for(b=a.length;b--;)for(c=a[b],d=c.split(".");d.length>1;)d.pop(),e=d.join("."),f[e]||(f[f.length]=e,f[e]=!0);return f},m=function(a,c,e,f,g){var h,i,j,k;if(h=f.get(),!b(h,e)&&f.reset(e)===!1)return!1;if(e=f.get(),i=a._cache[c],!b(i,e)){if(a._cache[c]=e,j=a._cacheMap[c])for(k=j.length;k--;)d(a,j[k]);g[g.length]=c}},j}(w,x,i,m,r,z,q,A,B),D=function(a,b,c,d,e){return function(f,g){var h,i;return"function"==typeof f&&(g=f,f=""),i=this._transitionManager,this._transitionManager=h=a(this,g),b(this),c(this,f||""),d(this,f||""),e(this),this._transitionManager=i,h.ready(),"string"==typeof f?this.fire("update",f):this.fire("update"),this}}(q,z,m,r,A),E=function(a){return function(b,c){var d;if(!a(b)||!a(c))return!1;if(b.length!==c.length)return!1;for(d=b.length;d--;)if(b[d]!==c[d])return!1;return!0}}(l),F=function(a,b,c){function d(a,e,f,g,h){var i,j,k,l,m,n;if(i=a._twowayBindings[e])for(k=i.length;k--;)l=i[k],(!l.radioName||l.node.checked)&&(l.checkboxName?l.changed()&&!g[e]&&(g[e]=!0,g[g.length]=e):(m=l.attr.value,n=l.value(),b(m,n)||c(m,n)||(f[e]=n)));if(h&&(j=a._depsMap[e]))for(k=j.length;k--;)d(a,j[k],f,g,h)}return function(b,c){var e,f,g;if("string"!=typeof b&&(b="",c=!0),d(this,b,e={},f=[],c),g=f.length)for(;g--;)b=f[g],e[b]=a(this,b);this.set(e)}}(n,E,x),G=function(){return"undefined"!=typeof window?(function(a,b,c){var d,e;if(!c.requestAnimationFrame){for(d=0;d<a.length&&!c.requestAnimationFrame;++d)c.requestAnimationFrame=c[a[d]+"RequestAnimationFrame"];c.requestAnimationFrame||(e=c.setTimeout,c.requestAnimationFrame=function(a){var c,d,f;return c=Date.now(),d=Math.max(0,16-(c-b)),f=e(function(){a(c+d)},d),b=c+d,f})}}(["ms","moz","webkit","o"],0,window),window.requestAnimationFrame):void 0}(),H=function(a){var b=[],c={tick:function(){var d,e;for(d=0;d<b.length;d+=1)e=b[d],e.tick()||b.splice(d--,1);b.length?a(c.tick):c.running=!1},add:function(a){b[b.length]=a,c.running||(c.running=!0,c.tick())},abort:function(a,c){for(var d,e=b.length;e--;)d=b[e],d.root===c&&d.keypath===a&&d.stop()}};return c}(G),I=function(){return"undefined"!=typeof console&&"function"==typeof console.warn&&"function"==typeof console.warn.apply?function(){console.warn.apply(console,arguments)}:function(){}}(),J=function(){return function(a){return!isNaN(parseFloat(a))&&isFinite(a)}}(),K=function(a,b,c){function d(a,b){var c=b-a;return c?function(b){return a+b*c}:function(){return a}}function e(a,b){var c,d,e,f;for(c=[],d=[],f=e=Math.min(a.length,b.length);f--;)d[f]=g(a[f],b[f]);for(f=e;f<a.length;f+=1)c[f]=a[f];for(f=e;f<b.length;f+=1)c[f]=b[f];return function(a){for(var b=e;b--;)c[b]=d[b](a);return c}}function f(a,b){var c,d,e,f,h=[];e={},d={};for(f in a)a.hasOwnProperty(f)&&(b.hasOwnProperty(f)?(h[h.length]=f,d[f]=g(a[f],b[f])):e[f]=a[f]);for(f in b)b.hasOwnProperty(f)&&!a.hasOwnProperty(f)&&(e[f]=b[f]);return c=h.length,function(a){for(var b,f=c;f--;)b=h[f],e[b]=d[b](a);return e}}var g=function(g,h){return c(g)&&c(h)?d(+g,+h):a(g)&&a(h)?e(g,h):b(g)&&b(h)?f(g,h):function(){return h}};return g}(l,w,J),L=function(a,b){var c=function(a){var c;this.startTime=Date.now();for(c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);this.interpolator=b(this.from,this.to),this.running=!0};return c.prototype={tick:function(){var b,c,d,e,f,g;return g=this.keypath,this.running?(e=Date.now(),b=e-this.startTime,b>=this.duration?(null!==g&&this.root.set(g,this.to),this.step&&this.step(1,this.to),this.complete&&this.complete(1,this.to),f=this.root._animations.indexOf(this),-1===f&&a("Animation was not found"),this.root._animations.splice(f,1),this.running=!1,!1):(c=this.easing?this.easing(b/this.duration):b/this.duration,null!==g&&(d=this.interpolator(c),this.root.set(g,d)),this.step&&this.step(c,d),!0)):!1},stop:function(){var b;this.running=!1,b=this.root._animations.indexOf(this),-1===b&&a("Animation was not found"),this.root._animations.splice(b,1)}},c}(I,K),M=function(){return{linear:function(a){return a},easeIn:function(a){return Math.pow(a,3)},easeOut:function(a){return Math.pow(a-1,3)+1},easeInOut:function(a){return(a/=.5)<1?.5*Math.pow(a,3):.5*(Math.pow(a-2,3)+2)}}}(),N=function(a,b,c,d){function e(e,g,h,i){var j,k,l,m;return null!==g&&(m=e.get(g)),b.abort(g,e),a(m,h)?(i.complete&&i.complete(1,i.to),f):(i.easing&&(j="function"==typeof i.easing?i.easing:e.easing&&e.easing[i.easing]?e.easing[i.easing]:d[i.easing],"function"!=typeof j&&(j=null)),k=void 0===i.duration?400:i.duration,l=new c({keypath:g,from:m,to:h,root:e,duration:k,easing:j,step:i.step,complete:i.complete}),b.add(l),e._animations[e._animations.length]=l,l)}var f={stop:function(){}};return function(a,b,c){var d,f,g,h,i,j,k,l,m,n,o,p;if("object"==typeof a){c=b||{},h=c.easing,i=c.duration,g=[],j=c.step,k=c.complete,(j||k)&&(m={},c.step=null,c.complete=null,l=function(a){return function(b,c){m[a]=c}});for(d in a)a.hasOwnProperty(d)&&((j||k)&&(n=l(d),c={easing:h,duration:i},j&&(c.step=n),k&&(c.complete=n)),g[g.length]=e(this,d,a[d],c));return(j||k)&&(p={easing:h,duration:i},j&&(p.step=function(a){j(a,m)}),k&&(p.complete=function(a){k(a,m)}),g[g.length]=o=e(this,null,null,p)),{stop:function(){for(;g.length;)g.pop().stop();o&&o.stop()}}}return c=c||{},f=e(this,a,b,c),{stop:function(){f.stop()}}}}(x,H,L,M),O=function(){return function(a,b){var c,d,e=this;if("object"==typeof a){c=[];for(d in a)a.hasOwnProperty(d)&&(c[c.length]=this.on(d,a[d]));return{cancel:function(){for(;c.length;)c.pop().cancel()}}}return this._subs[a]?this._subs[a].push(b):this._subs[a]=[b],{cancel:function(){e.off(a,b)}}}}(),P=function(){return function(a,b){var c,d;if(!b)if(a)this._subs[a]=[];else for(a in this._subs)delete this._subs[a];c=this._subs[a],c&&(d=c.indexOf(b),-1!==d&&c.splice(d,1))}}(),Q=function(){return function(a){var b,c,d,e,f,g,h,i;if(g=a.root,h=a.keypath,i=a.priority,b=g._deps[i]||(g._deps[i]={}),c=b[h]||(b[h]=[]),c[c.length]=a,a.registered=!0,h)for(d=h.split(".");d.length;)d.pop(),e=d.join("."),f=g._depsMap[e]||(g._depsMap[e]=[]),void 0===f[h]&&(f[h]=0,f[f.length]=h),f[h]+=1,h=e}}(),R=function(){return function(a){var b,c,d,e,f,g,h,i;if(g=a.root,h=a.keypath,i=a.priority,b=g._deps[i][h],c=b.indexOf(a),-1===c||!a.registered)throw new Error("Attempted to remove a dependant that was no longer registered! This should not happen. If you are seeing this bug in development please raise an issue at https://github.com/RactiveJS/Ractive/issues - thanks");if(b.splice(c,1),a.registered=!1,h)for(d=h.split(".");d.length;)d.pop(),e=d.join("."),f=g._depsMap[e],f[h]-=1,f[h]||(f.splice(f.indexOf(h),1),f[h]=void 0),h=e}}(),S=function(a){var b=function(a,b,c,d){var e=this;this.root=a,this.keypath=b,this.callback=c,this.defer=d.defer,this.debug=d.debug,this.proxy={update:function(){e.reallyUpdate()}},this.priority=0,this.context=d&&d.context?d.context:a};return b.prototype={init:function(a){a!==!1?this.update():this.value=this.root.get(this.keypath)},update:function(){return this.defer&&this.ready?(this.root._deferred.observers.push(this.proxy),void 0):(this.reallyUpdate(),void 0)},reallyUpdate:function(){var b,c;if(b=this.value,c=this.root.get(this.keypath),this.value=c,!this.updating){if(this.updating=!0,!a(c,b)||!this.ready)try{this.callback.call(this.context,c,b,this.keypath)}catch(d){if(this.debug||this.root.debug)throw d}this.updating=!1}}},b}(x),T=function(){return function(a,b){var c,d,e,f,g,h,i;for(c=b.split("."),f=[],h=function(b){var c,d;c=a._wrapped[b]?a._wrapped[b].get():a.get(b);for(d in c)g.push(b+"."+d)},i=function(a){return a+"."+d};d=c.shift();)"*"===d?(g=[],f.forEach(h),f=g):f[0]?f=f.map(i):f[0]=d;return e={},f.forEach(function(b){e[b]=a.get(b)}),e}}(),U=function(a,b){var c,d=/\*/;return c=function(a,b,c,d){this.root=a,this.callback=c,this.defer=d.defer,this.debug=d.debug,this.keypath=b,this.regex=new RegExp("^"+b.replace(/\./g,"\\.").replace(/\*/g,"[^\\.]+")+"$"),this.values={},this.defer&&(this.proxies=[]),this.priority="pattern",this.context=d&&d.context?d.context:a},c.prototype={init:function(a){var c,d;if(c=b(this.root,this.keypath),a!==!1)for(d in c)c.hasOwnProperty(d)&&this.update(d);else this.values=c},update:function(a){var c;{if(!d.test(a))return this.defer&&this.ready?(this.root._deferred.observers.push(this.getProxy(a)),void 0):(this.reallyUpdate(a),void 0);c=b(this.root,a);for(a in c)c.hasOwnProperty(a)&&this.update(a)}},reallyUpdate:function(b){var c=this.root.get(b);if(this.updating)return this.values[b]=c,void 0;if(this.updating=!0,!a(c,this.values[b])||!this.ready){try{this.callback.call(this.context,c,this.values[b],b)}catch(d){if(this.debug||this.root.debug)throw d}this.values[b]=c}this.updating=!1},getProxy:function(a){var b=this;return this.proxies[a]||(this.proxies[a]={update:function(){b.reallyUpdate(a)}}),this.proxies[a]}},c}(x,T),V=function(a,b,c,d,e){var f=/\*/,g={};return function(h,i,j,k){var l,m;return i=a(i),k=k||g,f.test(i)?(l=new e(h,i,j,k),h._patternObservers.push(l),m=!0):l=new d(h,i,j,k),b(l),l.init(k.init),l.ready=!0,{cancel:function(){var a;m&&(a=h._patternObservers.indexOf(l),-1!==a&&h._patternObservers.splice(a,1)),c(l)}}}}(i,Q,R,S,U),W=function(a,b){return function(c,d,e){var f,g=[];if(a(c)){e=d;for(f in c)c.hasOwnProperty(f)&&(d=c[f],g[g.length]=b(this,f,d,e));return{cancel:function(){for(;g.length;)g.pop().cancel()}}}return b(this,c,d,e)}}(w,V),X=function(){return function(a){var b,c,d,e=this._subs[a];if(e)for(b=Array.prototype.slice.call(arguments,1),c=0,d=e.length;d>c;c+=1)e[c].apply(this,b)}}(),Y=function(){return function(a){return this.el?this.fragment.find(a):null}}(),Z=function(a,b){var c,d,e,f,g,h,i,j;if(a){for(c=b("div"),d=["matches","matchesSelector"],g=["o","ms","moz","webkit"],j=function(a){return function(b,c){return b[a](c)}},h=d.length;h--;){if(e=d[h],c[e])return j(e);for(i=g.length;i--;)if(f=g[h]+e.substr(0,1).toUpperCase()+e.substring(1),c[f])return j(f)}return function(a,b){var c,d;for(c=(a.parentNode||a.document).querySelectorAll(b),d=c.length;d--;)if(c[d]===a)return!0;return!1}}}(f,e),$=function(a){return function(b,c){var d=this._isComponentQuery?!this.selector||b.name===this.selector:a(b.node,this.selector);return d?(this.push(b.node||b.instance),c||this._makeDirty(),!0):void 0}}(Z),_=function(){return function(){var a,b,c;a=this._root[this._isComponentQuery?"liveComponentQueries":"liveQueries"],b=this.selector,c=a.indexOf(b),-1!==c&&(a.splice(c,1),a[b]=null)}}(),ab=function(){function a(a){var b;return(b=a.parentFragment)?b.owner:a.component&&(b=a.component.parentFragment)?b.owner:void 0}function b(b){var c,d;for(c=[b],d=a(b);d;)c.push(d),d=a(d);return c}return function(a,c){var d,e,f,g,h,i,j,k,l,m;for(d=b(a.component||a._ractive.proxy),e=b(c.component||c._ractive.proxy),f=d[d.length-1],g=e[e.length-1];f&&f===g;)d.pop(),e.pop(),h=f,f=d[d.length-1],g=e[e.length-1];if(f=f.component||f,g=g.component||g,l=f.parentFragment,m=g.parentFragment,l===m)return i=l.items.indexOf(f),j=m.items.indexOf(g),i-j||d.length-e.length;if(k=h.fragments)return i=k.indexOf(l),j=k.indexOf(m),i-j||d.length-e.length;throw new Error("An unexpected condition was met while comparing the position of two components. Please file an issue at https://github.com/RactiveJS/Ractive/issues - thanks!")}}(),bb=function(a){return function(b,c){var d;return b.compareDocumentPosition?(d=b.compareDocumentPosition(c),2&d?1:-1):a(b,c)}}(ab),cb=function(a,b){return function(){this.sort(this._isComponentQuery?b:a),this._dirty=!1}}(bb,ab),db=function(){return function(){this._dirty||(this._root._deferred.liveQueries.push(this),this._dirty=!0)}}(),eb=function(){return function(a){var b=this.indexOf(this._isComponentQuery?a.instance:a.node);-1!==b&&this.splice(b,1)}}(),fb=function(a,b,c,d,e,f){return function(g,h,i,j){var k;return k=[],a(k,{selector:{value:h},live:{value:i},_isComponentQuery:{value:j},_test:{value:b}}),i?(a(k,{cancel:{value:c},_root:{value:g},_sort:{value:d},_makeDirty:{value:e},_remove:{value:f},_dirty:{value:!1,writable:!0}}),k):k}}(h,$,_,cb,db,eb),gb=function(a,b,c,d){return function(a,b){var c,e;return this.el?(b=b||{},c=this._liveQueries,(e=c[a])?b&&b.live?e:e.slice():(e=d(this,a,!!b.live,!1),e.live&&(c.push(a),c[a]=e),this.fragment.findAll(a,e),e)):[]}}(I,Z,h,fb),hb=function(){return function(a){return this.fragment.findComponent(a)}}(),ib=function(a,b,c,d){return function(a,b){var c,e;return b=b||{},c=this._liveComponentQueries,(e=c[a])?b&&b.live?e:e.slice():(e=d(this,a,!!b.live,!0),e.live&&(c.push(a),c[a]=e),this.fragment.findAllComponents(a,e),e)}}(I,Z,h,fb),jb=function(){return function(a){var b;return"undefined"!=typeof window&&document&&a?a.nodeType?a:"string"==typeof a&&(b=document.getElementById(a),!b&&document.querySelector&&(b=document.querySelector(a)),b&&b.nodeType)?b:a[0]&&a[0].nodeType?a[0]:null:null}}(),kb=function(a,b){return function(c,d){var e,f,g,h,i;if(c.owner=d.owner,g=c.owner.parentFragment,c.root=d.root,c.pNode=d.pNode,c.contextStack=d.contextStack||[],c.owner.type===a.SECTION&&(c.index=d.index),g&&(h=g.indexRefs)){c.indexRefs=b(null);for(i in h)c.indexRefs[i]=h[i]}for(c.priority=g?g.priority+1:1,d.indexRef&&(c.indexRefs||(c.indexRefs={}),c.indexRefs[d.indexRef]=d.index),c.items=[],e=d.descriptor?d.descriptor.length:0,f=0;e>f;f+=1)c.items[c.items.length]=c.createItem({parentFragment:c,descriptor:d.descriptor[f],index:f})}}(k,c),lb=function(a){var b={};return function(c,d,e){var f,g=[];if(c)for(f=b[d]||(b[d]=a(d)),f.innerHTML=c;f.firstChild;)g[g.length]=f.firstChild,e.appendChild(f.firstChild);return g}}(e),mb=function(a){var b,c,d;return c=/</g,d=/>/g,b=function(b,c){this.type=a.TEXT,this.descriptor=b.descriptor,c&&(this.node=document.createTextNode(b.descriptor),c.appendChild(this.node))},b.prototype={detach:function(){return this.node.parentNode.removeChild(this.node),this.node},teardown:function(a){a&&this.detach()},firstNode:function(){return this.node},toString:function(){return(""+this.descriptor).replace(c,"&lt;").replace(d,"&gt;")}},b}(k),nb=function(a){return function(b){if(b.keypath)a(b);else{var c=b.root._pendingResolution.indexOf(b);-1!==c&&b.root._pendingResolution.splice(c,1)}}}(R),ob=function(a,b,c,d,e){function f(a,b,d){var e,f,g;if(!h.test(a.toString()))return c(a,"_nowrap",{value:!0}),a;if(!a["_"+b._guid]){c(a,"_"+b._guid,{value:function(){var c,d,e,g;if(c=b._captured,c||(b._captured=[]),d=a.apply(b,arguments),b._captured.length)for(e=f.length;e--;)g=f[e],g.updateSoftDependencies(b._captured);return b._captured=c,d},writable:!0});for(e in a)a.hasOwnProperty(e)&&(a["_"+b._guid][e]=a[e]);a["_"+b._guid+"_evaluators"]=[]}return f=a["_"+b._guid+"_evaluators"],g=f.indexOf(d),-1===g&&f.push(d),a["_"+b._guid]}var g,h;return h=/this/,g=function(b,c,e,g,h){var i;this.evaluator=e,this.keypath=c,this.root=b,this.argNum=g,this.type=a.REFERENCE,this.priority=h,i=b.get(c),"function"==typeof i&&(i=f(i,b,e)),this.value=e.values[g]=i,d(this)},g.prototype={update:function(){var a=this.root.get(this.keypath);"function"!=typeof a||a._nowrap||(a=f(a,this.root,this.evaluator)),b(a,this.value)||(this.evaluator.values[this.argNum]=a,this.evaluator.bubble(),this.value=a)},teardown:function(){e(this)}},g}(k,x,g,Q,R),pb=function(a,b,c){var d=function(a,c,d){this.root=a,this.keypath=c,this.priority=d.priority,this.evaluator=d,b(this)};return d.prototype={update:function(){var b=this.root.get(this.keypath);a(b,this.value)||(this.evaluator.bubble(),this.value=b)},teardown:function(){c(this)}},d}(x,Q,R),qb=function(a,b,c,d,e,f,g,h,i){function j(a,b){var c,d;if(a=a.replace(/\$\{([0-9]+)\}/g,"_$1"),l[a])return l[a];for(d=[];b--;)d[b]="_"+b;return c=new Function(d.join(","),"return("+a+")"),l[a]=c,c}var k,l={};return k=function(a,b,c,d,e){var f,g;for(this.root=a,this.keypath=b,this.priority=e,this.fn=j(c,d.length),this.values=[],this.refs=[],f=d.length;f--;)(g=d[f])?g[0]?this.values[f]=g[1]:this.refs[this.refs.length]=new h(a,g[1],this,f,e):this.values[f]=void 0;this.selfUpdating=this.refs.length<=1,this.update()},k.prototype={bubble:function(){this.selfUpdating?this.update():this.deferred||(this.root._deferred.evals.push(this),this.deferred=!0)
},update:function(){var b;if(this.evaluating)return this;this.evaluating=!0;try{b=this.fn.apply(null,this.values)}catch(e){if(this.root.debug)throw e;b=void 0}return a(b,this.value)||(c(this.root,this.keypath),this.root._cache[this.keypath]=b,g(this.root,this.keypath,b,!0),this.value=b,d(this.root,this.keypath)),this.evaluating=!1,this},teardown:function(){for(;this.refs.length;)this.refs.pop().teardown();c(this.root,this.keypath),this.root._evaluators[this.keypath]=null},refresh:function(){this.selfUpdating||(this.deferred=!0);for(var a=this.refs.length;a--;)this.refs[a].update();this.deferred&&(this.update(),this.deferred=!1)},updateSoftDependencies:function(a){var b,c,d;for(this.softRefs||(this.softRefs=[]),b=this.softRefs.length;b--;)d=this.softRefs[b],a[d.keypath]||(this.softRefs.splice(b,1),this.softRefs[d.keypath]=!1,d.teardown());for(b=a.length;b--;)c=a[b],this.softRefs[c]||(d=new i(this.root,c,this),this.softRefs[this.softRefs.length]=d,this.softRefs[c]=!0);this.selfUpdating=this.refs.length+this.softRefs.length<=1}},k}(x,g,m,r,Q,R,u,ob,pb),rb=function(a,b){var c=function(b,c,d,e){var f,g;g=this.root=b.root,f=a(g,c,d),void 0!==f?b.resolveRef(e,!1,f):(this.ref=c,this.argNum=e,this.resolver=b,this.contextStack=d,g._pendingResolution[g._pendingResolution.length]=this)};return c.prototype={resolve:function(a){this.keypath=a,this.resolver.resolveRef(this.argNum,!1,a)},teardown:function(){this.keypath||b(this)}},c}(y,nb),sb=function(){var a=/^(?:(?:[a-zA-Z$_][a-zA-Z$_0-9]*)|(?:[0-9]|[1-9][0-9]+))$/;return function(b){var c,d,e;for(c=b.split("."),e=c.length;e--;)if(d=c[e],"undefined"===d||!a.test(d))return!1;return!0}}(),tb=function(a,b){return function(c,d){var e,f;return e=c.replace(/\$\{([0-9]+)\}/g,function(a,b){return d[b]?d[b][1]:"undefined"}),f=a(e),b(f)?f:"${"+e.replace(/[\.\[\]]/g,"-")+"}"}}(i,sb),ub=function(a,b){function c(a,b,c){var e,f;if(e=a._depsMap[b])for(f=e.length;f--;)d(a,e[f],c)}function d(a,b,d){var e,f,g,h;for(e=a._deps.length;e--;)if(f=a._deps[e],f&&(g=f[b]))for(h=g.length;h--;)d.push(g[h]);c(a,b,d)}return function(c,e,f){var g,h,i;for(g=[],d(c,e,g),h=g.length;h--;)i=g[h],b(i),i.keypath=i.keypath.replace(e,f),a(i),i.update()}}(Q,R),vb=function(a,b,c,d){var e=function(a){var c,d,e,f,g;if(this.root=a.root,this.mustache=a,this.args=[],this.scouts=[],c=a.descriptor.x,g=a.parentFragment.indexRefs,this.str=c.s,e=this.unresolved=this.args.length=c.r?c.r.length:0,!e)return this.resolved=this.ready=!0,this.bubble(),void 0;for(d=0;e>d;d+=1)f=c.r[d],g&&void 0!==g[f]?this.resolveRef(d,!0,g[f]):this.scouts[this.scouts.length]=new b(this,f,a.contextStack,d);this.ready=!0,this.bubble()};return e.prototype={bubble:function(){var a;this.ready&&(a=this.keypath,this.keypath=c(this.str,this.args),"${"===this.keypath.substr(0,2)&&this.createEvaluator(),a?d(this.root,a,this.keypath):this.mustache.resolve(this.keypath))},teardown:function(){for(;this.scouts.length;)this.scouts.pop().teardown()},resolveRef:function(a,b,c){this.args[a]=[b,c],this.bubble(),this.resolved=!--this.unresolved},createEvaluator:function(){this.root._evaluators[this.keypath]?this.root._evaluators[this.keypath].refresh():this.root._evaluators[this.keypath]=new a(this.root,this.keypath,this.str,this.args,this.mustache.priority)}},e}(qb,rb,tb,ub),wb=function(a,b){return function(c,d){var e,f,g;g=c.parentFragment=d.parentFragment,c.root=g.root,c.contextStack=g.contextStack,c.descriptor=d.descriptor,c.index=d.index||0,c.priority=g.priority,c.type=d.descriptor.t,d.descriptor.r&&(g.indexRefs&&void 0!==g.indexRefs[d.descriptor.r]?(f=g.indexRefs[d.descriptor.r],c.indexRef=d.descriptor.r,c.value=f,c.render(c.value)):(e=a(c.root,d.descriptor.r,c.contextStack),void 0!==e?c.resolve(e):(c.ref=d.descriptor.r,c.root._pendingResolution[c.root._pendingResolution.length]=c))),d.descriptor.x&&(c.expressionResolver=new b(c)),c.descriptor.n&&!c.hasOwnProperty("value")&&c.render(void 0)}}(y,vb),xb=function(a,b,c){return function(d){d!==this.keypath&&(this.registered&&c(this),this.keypath=d,b(this),this.update(),this.root.twoway&&this.parentFragment.owner.type===a.ATTRIBUTE&&this.parentFragment.owner.element.bind(),this.expressionResolver&&this.expressionResolver.resolved&&(this.expressionResolver=null))}}(k,Q,R),yb=function(a){return function(){var b,c;c=this.root.get(this.keypath),(b=this.root._wrapped[this.keypath])&&(c=b.get()),a(c,this.value)||(this.render(c),this.value=c)}}(x),zb=function(a,b,c,d,e){var f,g,h;return g=/</g,h=/>/g,f=function(b,d){this.type=a.INTERPOLATOR,d&&(this.node=document.createTextNode(""),d.appendChild(this.node)),c(this,b)},f.prototype={update:e,resolve:d,detach:function(){return this.node.parentNode.removeChild(this.node),this.node},teardown:function(a){a&&this.detach(),b(this)},render:function(a){this.node&&(this.node.data=void 0==a?"":a)},firstNode:function(){return this.node},toString:function(){var a=void 0!=this.value?""+this.value:"";return a.replace(g,"&lt;").replace(h,"&gt;")}},f}(k,nb,wb,xb,yb),Ab=function(a,b,c){function d(a,b,c){var d,e,f;if(e=b.length,e<a.length)for(f=a.fragments.splice(e,a.length-e);f.length;)f.pop().teardown(!0);else if(e>a.length)for(d=a.length;e>d;d+=1)c.contextStack=a.contextStack.concat(a.keypath+"."+d),c.index=d,a.descriptor.i&&(c.indexRef=a.descriptor.i),a.fragments[d]=a.createFragment(c);a.length=e}function e(a,b,d){var e,f;f=a.fragmentsById||(a.fragmentsById=c(null));for(e in f)void 0===b[e]&&f[e]&&(f[e].teardown(!0),f[e]=null);for(e in b)void 0===b[e]||f[e]||(d.contextStack=a.contextStack.concat(a.keypath+"."+e),d.index=e,a.descriptor.i&&(d.indexRef=a.descriptor.i),f[e]=a.createFragment(d))}function f(a,b){a.length||(b.contextStack=a.contextStack.concat(a.keypath),b.index=0,a.fragments[0]=a.createFragment(b),a.length=1)}function g(b,c,d,e){var f,g,h,i;if(g=a(c)&&0===c.length,f=d?g||!c:c&&!g){if(b.length||(e.contextStack=b.contextStack,e.index=0,b.fragments[0]=b.createFragment(e),b.length=1),b.length>1)for(h=b.fragments.splice(1);i=h.pop();)i.teardown(!0)}else b.length&&(b.teardownFragments(!0),b.length=0)}return function(c,h){var i;return i={descriptor:c.descriptor.f,root:c.root,pNode:c.parentFragment.pNode,owner:c},c.descriptor.n?(g(c,h,!0,i),void 0):(a(h)?d(c,h,i):b(h)?c.descriptor.i?e(c,h,i):f(c,i):g(c,h,!1,i),void 0)}}(l,w,c),Bb=function(a,b,c){function d(b,c,g,h,i,j,k){var l,m,n,o;if(!b.html){for(b.indexRefs&&void 0!==b.indexRefs[c]&&(b.indexRefs[c]=h),l=b.contextStack.length;l--;)n=b.contextStack[l],n.substr(0,j.length)===j&&(b.contextStack[l]=n.replace(j,k));for(l=b.items.length;l--;)switch(m=b.items[l],m.type){case a.ELEMENT:e(m,c,g,h,i,j,k);break;case a.PARTIAL:d(m.fragment,c,g,h,i,j,k);break;case a.COMPONENT:d(m.instance.fragment,c,g,h,i,j,k),(o=b.root._liveComponentQueries[m.name])&&o._makeDirty();break;case a.SECTION:case a.INTERPOLATOR:case a.TRIPLE:f(m,c,g,h,i,j,k)}}}function e(a,b,c,e,f,g,h){var i,j,k,l,m,n,o,p,q,r;for(i=a.attributes.length;i--;)j=a.attributes[i],j.fragment&&(d(j.fragment,b,c,e,f,g,h),j.twoway&&j.updateBindings());if(k=a.node._ractive){k.keypath.substr(0,g.length)===g&&(k.keypath=k.keypath.replace(g,h)),void 0!==b&&(k.index[b]=e);for(l in k.events)for(m=k.events[l].proxies,i=m.length;i--;)n=m[i],"object"==typeof n.n&&d(n.a,b,c,e,f,g,h),n.d&&d(n.d,b,c,e,f,g,h);(o=k.binding)&&o.keypath.substr(0,g.length)===g&&(p=k.root._twowayBindings[o.keypath],p.splice(p.indexOf(o),1),o.keypath=o.keypath.replace(g,h),p=k.root._twowayBindings[o.keypath]||(k.root._twowayBindings[o.keypath]=[]),p.push(o))}if(a.fragment&&d(a.fragment,b,c,e,f,g,h),q=a.liveQueries)for(r=a.root,i=q.length;i--;)r._liveQueries[q[i]]._makeDirty()}function f(a,b,e,f,g,h,i){var j;if(a.descriptor.x&&(a.expressionResolver&&a.expressionResolver.teardown(),a.expressionResolver=new c(a)),a.keypath?a.keypath.substr(0,h.length)===h&&a.resolve(a.keypath.replace(h,i)):a.indexRef===b&&(a.value=f,a.render(f)),a.fragments)for(j=a.fragments.length;j--;)d(a.fragments[j],b,e,f,g,h,i)}return d}(k,R,vb),Cb=function(a,b,c){return function(a,d,e,f,g){var h,i,j,k,l,m,n;for(j=d.descriptor.i,h=e;f>h;h+=1)i=d.fragments[h],k=h-g,l=h,m=d.keypath+"."+(h-g),n=d.keypath+"."+h,i.index+=g,b(i,j,k,l,g,m,n);c(a)}}(k,Bb,o),Db=function(a){return function(b){var c,d,e,f,g,h,i,j,k,l,m=this;if(c=this.parentFragment,h=[],b.forEach(function(b,c){var f,g,j;return b===c?(h[b]=m.fragments[c],void 0):(void 0===d&&(d=c),-1===b?((i||(i=[])).push(m.fragments[c]),void 0):(f=b-c,g=m.keypath+"."+c,j=m.keypath+"."+b,a(m.fragments[c],m.descriptor.i,c,b,f,g,j),h[b]=m.fragments[c],e=!0,void 0))}),i)for(;k=i.pop();)k.teardown(!0);if(void 0===d&&(d=this.length),g=this.root.get(this.keypath).length,g!==d){for(j={descriptor:this.descriptor.f,root:this.root,pNode:c.pNode,owner:this},this.descriptor.i&&(j.indexRef=this.descriptor.i),f=d;g>f;f+=1)(k=h[f])?this.docFrag.appendChild(k.detach(!1)):(j.contextStack=this.contextStack.concat(this.keypath+"."+f),j.index=f,k=this.createFragment(j)),this.fragments[f]=k;l=c.findNextNode(this),c.pNode.insertBefore(this.docFrag,l),this.length=g}}}(Bb),Eb=function(){return[]}(),Fb=function(a,b,c,d,e,f,g,h,i,j,k){var l,m;return k.push(function(){m=k.DomFragment}),l=function(b,d){this.type=a.SECTION,this.inverted=!!b.descriptor.n,this.fragments=[],this.length=0,d&&(this.docFrag=document.createDocumentFragment()),this.initialising=!0,c(this,b),d&&d.appendChild(this.docFrag),this.initialising=!1},l.prototype={update:d,resolve:e,smartUpdate:function(a,b){var c;("push"===a||"unshift"===a||"splice"===a)&&(c={descriptor:this.descriptor.f,root:this.root,pNode:this.parentFragment.pNode,owner:this},this.descriptor.i&&(c.indexRef=this.descriptor.i)),this[a]&&(this.rendering=!0,this[a](c,b),this.rendering=!1)},pop:function(){this.length&&(this.fragments.pop().teardown(!0),this.length-=1)},push:function(a,b){var c,d,e;for(c=this.length,d=c+b.length,e=c;d>e;e+=1)a.contextStack=this.contextStack.concat(this.keypath+"."+e),a.index=e,this.fragments[e]=this.createFragment(a);this.length+=b.length,this.parentFragment.pNode.insertBefore(this.docFrag,this.parentFragment.findNextNode(this))},shift:function(){this.splice(null,[0,1])},unshift:function(a,b){this.splice(a,[0,0].concat(new Array(b.length)))},splice:function(a,b){var c,d,e,f,g,i,j,k,l;if(b.length&&(i=+(b[0]<0?this.length+b[0]:b[0]),d=Math.max(0,b.length-2),e=void 0!==b[1]?b[1]:this.length-i,e=Math.min(e,this.length-i),f=d-e)){if(0>f){for(j=i-f,g=i;j>g;g+=1)this.fragments[g].teardown(!0);this.fragments.splice(i,-f)}else{for(j=i+f,c=this.fragments[i]?this.fragments[i].firstNode():this.parentFragment.findNextNode(this),k=[i,0].concat(new Array(f)),this.fragments.splice.apply(this.fragments,k),g=i;j>g;g+=1)a.contextStack=this.contextStack.concat(this.keypath+"."+g),a.index=g,this.fragments[g]=this.createFragment(a);this.parentFragment.pNode.insertBefore(this.docFrag,c)}this.length+=f,l=i+d,h(this.root,this,l,this.length,f)}},merge:i,detach:function(){var a,b;for(b=this.fragments.length,a=0;b>a;a+=1)this.docFrag.appendChild(this.fragments[a].detach());return this.docFrag},teardown:function(a){this.teardownFragments(a),j(this)},firstNode:function(){return this.fragments[0]?this.fragments[0].firstNode():this.parentFragment.findNextNode(this)},findNextNode:function(a){return this.fragments[a.index+1]?this.fragments[a.index+1].firstNode():this.parentFragment.findNextNode(this)},teardownFragments:function(a){for(var b,c;c=this.fragments.shift();)c.teardown(a);if(this.fragmentsById)for(b in this.fragmentsById)this.fragments[b]&&(this.fragmentsById[b].teardown(a),this.fragmentsById[b]=null)},render:function(a){var c,d;(d=this.root._wrapped[this.keypath])&&(a=d.get()),this.rendering||(this.rendering=!0,f(this,a),this.rendering=!1,(!this.docFrag||this.docFrag.childNodes.length)&&!this.initialising&&b&&(c=this.parentFragment.findNextNode(this),c&&c.parentNode===this.parentFragment.pNode?this.parentFragment.pNode.insertBefore(this.docFrag,c):this.parentFragment.pNode.appendChild(this.docFrag)))},createFragment:function(a){var b=new m(a);return this.docFrag&&this.docFrag.appendChild(b.docFrag),b},toString:function(){var a,b,c,d;for(a="",b=0,d=this.length,b=0;d>b;b+=1)a+=this.fragments[b].toString();if(this.fragmentsById)for(c in this.fragmentsById)this.fragmentsById[c]&&(a+=this.fragmentsById[c].toString());return a},find:function(a){var b,c,d;for(c=this.fragments.length,b=0;c>b;b+=1)if(d=this.fragments[b].find(a))return d;return null},findAll:function(a,b){var c,d;for(d=this.fragments.length,c=0;d>c;c+=1)this.fragments[c].findAll(a,b)},findComponent:function(a){var b,c,d;for(c=this.fragments.length,b=0;c>b;b+=1)if(d=this.fragments[b].findComponent(a))return d;return null},findAllComponents:function(a,b){var c,d;for(d=this.fragments.length,c=0;d>c;c+=1)this.fragments[c].findAllComponents(a,b)}},l}(k,f,wb,yb,xb,Ab,Bb,Cb,Db,nb,Eb),Gb=function(a,b,c,d,e,f,g){var h=function(b,d){this.type=a.TRIPLE,d&&(this.nodes=[],this.docFrag=document.createDocumentFragment()),this.initialising=!0,c(this,b),d&&d.appendChild(this.docFrag),this.initialising=!1};return h.prototype={update:d,resolve:e,detach:function(){for(var a=this.nodes.length;a--;)this.docFrag.appendChild(this.nodes[a]);return this.docFrag},teardown:function(a){a&&(this.detach(),this.docFrag=this.nodes=null),g(this)},firstNode:function(){return this.nodes[0]?this.nodes[0]:this.parentFragment.findNextNode(this)},render:function(a){var b,c;if(this.nodes){for(;this.nodes.length;)b=this.nodes.pop(),b.parentNode.removeChild(b);if(!a)return this.nodes=[],void 0;c=this.parentFragment.pNode,this.nodes=f(a,c.tagName,this.docFrag),this.initialising||c.insertBefore(this.docFrag,this.parentFragment.findNextNode(this))}},toString:function(){return void 0!=this.value?this.value:""},find:function(a){var c,d,e,f;for(d=this.nodes.length,c=0;d>c;c+=1)if(e=this.nodes[c],1===e.nodeType){if(b(e,a))return e;if(f=e.querySelector(a))return f}return null},findAll:function(a,c){var d,e,f,g,h,i;for(e=this.nodes.length,d=0;e>d;d+=1)if(f=this.nodes[d],1===f.nodeType&&(b(f,a)&&c.push(f),g=f.querySelectorAll(a)))for(h=g.length,i=0;h>i;i+=1)c.push(g[i])}},h}(k,Z,wb,yb,xb,lb,nb),Hb=function(a){return function(b,c){return b.a&&b.a.xmlns?b.a.xmlns:"svg"===b.e?a.svg:c.namespaceURI||a.html}}(d),Ib=function(){var a,b,c,d;return a="altGlyph altGlyphDef altGlyphItem animateColor animateMotion animateTransform clipPath feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence foreignObject glyphRef linearGradient radialGradient textPath vkern".split(" "),b="attributeName attributeType baseFrequency baseProfile calcMode clipPathUnits contentScriptType contentStyleType diffuseConstant edgeMode externalResourcesRequired filterRes filterUnits glyphRef gradientTransform gradientUnits kernelMatrix kernelUnitLength keyPoints keySplines keyTimes lengthAdjust limitingConeAngle markerHeight markerUnits markerWidth maskContentUnits maskUnits numOctaves pathLength patternContentUnits patternTransform patternUnits pointsAtX pointsAtY pointsAtZ preserveAlpha preserveAspectRatio primitiveUnits refX refY repeatCount repeatDur requiredExtensions requiredFeatures specularConstant specularExponent spreadMethod startOffset stdDeviation stitchTiles surfaceScale systemLanguage tableValues targetX targetY textLength viewBox viewTarget xChannelSelector yChannelSelector zoomAndPan".split(" "),c=function(a){for(var b={},c=a.length;c--;)b[a[c].toLowerCase()]=a[c];return b},d=c(a.concat(b)),function(a){var b=a.toLowerCase();return d[b]||b}}(),Jb=function(a,b){return function(c,d){var e,f;if(e=d.indexOf(":"),-1===e||(f=d.substr(0,e),"xmlns"===f))c.name=c.element.namespace!==a.html?b(d):d,c.lcName=c.name.toLowerCase();else if(d=d.substring(e+1),c.name=b(d),c.lcName=c.name.toLowerCase(),c.namespace=a[f.toLowerCase()],!c.namespace)throw'Unknown namespace ("'+f+'")'}}(d,Ib),Kb=function(a){return function(b,c){var d,e=null===c.value?"":c.value;(d=c.pNode)&&(b.namespace?d.setAttributeNS(b.namespace,c.name,e):"style"===c.name&&d.style.setAttribute?d.style.setAttribute("cssText",e):"class"!==c.name||d.namespaceURI&&d.namespaceURI!==a.html?d.setAttribute(c.name,e):d.className=e,"id"===b.name&&(c.root.nodes[c.value]=d),"value"===b.name&&(d._ractive.value=c.value)),b.value=c.value}}(d),Lb=function(a){var b={"accept-charset":"acceptCharset",accesskey:"accessKey",bgcolor:"bgColor","class":"className",codebase:"codeBase",colspan:"colSpan",contenteditable:"contentEditable",datetime:"dateTime",dirname:"dirName","for":"htmlFor","http-equiv":"httpEquiv",ismap:"isMap",maxlength:"maxLength",novalidate:"noValidate",pubdate:"pubDate",readonly:"readOnly",rowspan:"rowSpan",tabindex:"tabIndex",usemap:"useMap"};return function(c,d){var e;!c.pNode||c.namespace||d.pNode.namespaceURI&&d.pNode.namespaceURI!==a.html||(e=b[c.name]||c.name,void 0!==d.pNode[e]&&(c.propertyName=e),("boolean"==typeof d.pNode[e]||"value"===e)&&(c.useProperty=!0))}}(d),Mb=function(a,b,c,d){var e,f,g,h,i,j,k,l,m,n,o,p,q,r;return e=function(){var a,b,c,d=this.pNode;return this.fragment?(a=f(this))?(this.interpolator=a,this.keypath=a.keypath||a.descriptor.r,(b=i(this))?(d._ractive.binding=this.element.binding=b,this.twoway=!0,c=this.root._twowayBindings[this.keypath]||(this.root._twowayBindings[this.keypath]=[]),c[c.length]=b,!0):!1):!1:!1},g=function(){this._ractive.binding.update()},h=function(){var a=this._ractive.root.get(this._ractive.binding.keypath);this.value=void 0==a?"":a},f=function(c){var d,e;return 1!==c.fragment.items.length?null:(d=c.fragment.items[0],d.type!==a.INTERPOLATOR?null:d.keypath||d.ref?d.keypath&&"${"===d.keypath.substr(0,2)?(e="You cannot set up two-way binding against an expression "+d.keypath,c.root.debug&&b(e),null):d:null)},i=function(a){var c=a.pNode;if("SELECT"===c.tagName)return c.multiple?new k(a,c):new l(a,c);if("checkbox"===c.type||"radio"===c.type){if("name"===a.propertyName){if("checkbox"===c.type)return new n(a,c);if("radio"===c.type)return new m(a,c)}return"checked"===a.propertyName?new o(a,c):null}return"value"!==a.lcName&&b("This is... odd"),"file"===c.type?new p(a,c):c.getAttribute("contenteditable")?new q(a,c):new r(a,c)},k=function(a,b){var c;j(this,a,b),b.addEventListener("change",g,!1),c=this.root.get(this.keypath),void 0===c&&this.update()},k.prototype={value:function(){var a,b,c,d;for(a=[],b=this.node.options,d=b.length,c=0;d>c;c+=1)b[c].selected&&(a[a.length]=b[c]._ractive.value);return a},update:function(){var a,b,d;return a=this.attr,b=a.value,d=this.value(),void 0!==b&&c(d,b)||(a.receiving=!0,a.value=d,this.root.set(this.keypath,d),a.receiving=!1),this},deferUpdate:function(){this.deferred!==!0&&(this.root._deferred.attrs.push(this),this.deferred=!0)},teardown:function(){this.node.removeEventListener("change",g,!1)}},l=function(a,b){var c;j(this,a,b),b.addEventListener("change",g,!1),c=this.root.get(this.keypath),void 0===c&&this.update()},l.prototype={value:function(){var a,b,c;for(a=this.node.options,c=a.length,b=0;c>b;b+=1)if(a[b].selected)return a[b]._ractive.value},update:function(){var a=this.value();return this.attr.receiving=!0,this.attr.value=a,this.root.set(this.keypath,a),this.attr.receiving=!1,this},deferUpdate:function(){this.deferred!==!0&&(this.root._deferred.attrs.push(this),this.deferred=!0)},teardown:function(){this.node.removeEventListener("change",g,!1)}},m=function(a,b){var c;this.radioName=!0,j(this,a,b),b.name="{{"+a.keypath+"}}",b.addEventListener("change",g,!1),b.attachEvent&&b.addEventListener("click",g,!1),c=this.root.get(this.keypath),void 0!==c?b.checked=c==b._ractive.value:this.root._deferred.radios.push(this)},m.prototype={value:function(){return this.node._ractive?this.node._ractive.value:this.node.value},update:function(){var a=this.node;a.checked&&(this.attr.receiving=!0,this.root.set(this.keypath,this.value()),this.attr.receiving=!1)},teardown:function(){this.node.removeEventListener("change",g,!1),this.node.removeEventListener("click",g,!1)}},n=function(a,b){var c,d;this.checkboxName=!0,j(this,a,b),b.name="{{"+this.keypath+"}}",b.addEventListener("change",g,!1),b.attachEvent&&b.addEventListener("click",g,!1),c=this.root.get(this.keypath),void 0!==c?(d=-1!==c.indexOf(b._ractive.value),b.checked=d):-1===this.root._deferred.checkboxes.indexOf(this.keypath)&&this.root._deferred.checkboxes.push(this.keypath)},n.prototype={changed:function(){return this.node.checked!==!!this.checked},update:function(){this.checked=this.node.checked,this.attr.receiving=!0,this.root.set(this.keypath,d(this.root,this.keypath)),this.attr.receiving=!1},teardown:function(){this.node.removeEventListener("change",g,!1),this.node.removeEventListener("click",g,!1)}},o=function(a,b){j(this,a,b),b.addEventListener("change",g,!1),b.attachEvent&&b.addEventListener("click",g,!1)},o.prototype={value:function(){return this.node.checked},update:function(){this.attr.receiving=!0,this.root.set(this.keypath,this.value()),this.attr.receiving=!1},teardown:function(){this.node.removeEventListener("change",g,!1),this.node.removeEventListener("click",g,!1)}},p=function(a,b){j(this,a,b),b.addEventListener("change",g,!1)},p.prototype={value:function(){return this.attr.pNode.files},update:function(){this.attr.root.set(this.attr.keypath,this.value())},teardown:function(){this.node.removeEventListener("change",g,!1)}},q=function(a,b){j(this,a,b),b.addEventListener("change",g,!1),this.root.lazy||(b.addEventListener("input",g,!1),b.attachEvent&&b.addEventListener("keyup",g,!1))},q.prototype={update:function(){this.attr.receiving=!0,this.root.set(this.keypath,this.node.innerHTML),this.attr.receiving=!1},teardown:function(){this.node.removeEventListener("change",g,!1),this.node.removeEventListener("input",g,!1),this.node.removeEventListener("keyup",g,!1)}},r=function(a,b){j(this,a,b),b.addEventListener("change",g,!1),this.root.lazy||(b.addEventListener("input",g,!1),b.attachEvent&&b.addEventListener("keyup",g,!1)),this.node.addEventListener("blur",h,!1)},r.prototype={value:function(){var a=this.attr.pNode.value;return+a+""===a&&-1===a.indexOf("e")&&(a=+a),a},update:function(){var a=this.attr,b=this.value();a.receiving=!0,a.root.set(a.keypath,b),a.receiving=!1},teardown:function(){this.node.removeEventListener("change",g,!1),this.node.removeEventListener("input",g,!1),this.node.removeEventListener("keyup",g,!1),this.node.removeEventListener("blur",h,!1)}},j=function(a,b,c){a.attr=b,a.node=c,a.root=b.root,a.keypath=b.keypath},e}(k,I,E,n),Nb=function(a,b){var c,d,e,f,g,h,i,j,k,l,m,n;return c=function(){var a;if(!this.ready)return this;if(a=this.pNode,"SELECT"===a.tagName&&"value"===this.lcName)return this.update=e,this.deferredUpdate=f,this.update();if(this.isFileInputValue)return this.update=d,this;if(this.twoway&&"name"===this.lcName){if("radio"===a.type)return this.update=i,this.update();if("checkbox"===a.type)return this.update=j,this.update()}return"style"===this.lcName&&a.style.setAttribute?(this.update=k,this.update()):"class"!==this.lcName||a.namespaceURI&&a.namespaceURI!==b.html?a.getAttribute("contenteditable")&&"value"===this.lcName?(this.update=m,this.update()):(this.update=n,this.update()):(this.update=l,this.update())},d=function(){return this},f=function(){this.deferredUpdate=this.pNode.multiple?h:g,this.deferredUpdate()},e=function(){return this.root._deferred.selectValues.push(this),this},g=function(){var a,b,c,d=this.fragment.getValue();for(this.value=this.pNode._ractive.value=d,a=this.pNode.options,c=a.length;c--;)if(b=a[c],b._ractive.value==d)return b.selected=!0,this;return this},h=function(){var b,c,d=this.fragment.getValue();for(a(d)||(d=[d]),b=this.pNode.options,c=b.length;c--;)b[c].selected=-1!==d.indexOf(b[c]._ractive.value);return this.value=d,this},i=function(){var a,b;return a=this.pNode,b=this.fragment.getValue(),a.checked=b==a._ractive.value,this},j=function(){var b,c;return b=this.pNode,c=this.fragment.getValue(),a(c)?(b.checked=-1!==c.indexOf(b._ractive.value),this):(b.checked=c==b._ractive.value,this)},k=function(){var a,b;return a=this.pNode,b=this.fragment.getValue(),void 0===b&&(b=""),b!==this.value&&(a.style.setAttribute("cssText",b),this.value=b),this},l=function(){var a,b;return a=this.pNode,b=this.fragment.getValue(),void 0===b&&(b=""),b!==this.value&&(a.className=b,this.value=b),this},m=function(){var a,b;return a=this.pNode,b=this.fragment.getValue(),void 0===b&&(b=""),b!==this.value&&(this.receiving||(a.innerHTML=b),this.value=b),this},n=function(){var a,b;if(a=this.pNode,b=this.fragment.getValue(),this.isValueAttribute&&(a._ractive.value=b),void 0===b&&(b=""),b!==this.value){if(this.useProperty)return this.receiving||(a[this.propertyName]=b),this.value=b,this;if(this.namespace)return a.setAttributeNS(this.namespace,this.name,b),this.value=b,this;"id"===this.lcName&&(void 0!==this.value&&(this.root.nodes[this.value]=void 0),this.root.nodes[b]=a),a.setAttribute(this.name,b),this.value=b}return this},c}(l,d),Ob=function(){return function(a){var b;return b=this.str.substr(this.pos,a.length),b===a?(this.pos+=a.length,a):null}}(),Pb=function(){var a=/^\s+/;return function(){var b=a.exec(this.remaining());return b?(this.pos+=b[0].length,b[0]):null}}(),Qb=function(){return function(a){return function(b){var c=a.exec(b.str.substring(b.pos));return c?(b.pos+=c[0].length,c[1]||c[0]):null}}}(),Rb=function(){function a(a){var b;return a.getStringMatch("\\")?(b=a.str.charAt(a.pos),a.pos+=1,b):null}return function(b){var c,d="";for(c=a(b);c;)d+=c,c=a(b);return d||null}}(),Sb=function(a,b){var c=a(/^[^\\"]+/),d=a(/^[^\\']+/);return function e(a,f){var g,h,i,j,k,l;if(g=a.pos,h="",l=f?d:c,i=b(a),i&&(h+=i),j=l(a),j&&(h+=j),!h)return"";for(k=e(a,f);""!==k;)h+=k;return h}}(Qb,Rb),Tb=function(a,b){return function(c){var d,e;return d=c.pos,c.getStringMatch('"')?(e=b(c,!1),c.getStringMatch('"')?{t:a.STRING_LITERAL,v:e}:(c.pos=d,null)):c.getStringMatch("'")?(e=b(c,!0),c.getStringMatch("'")?{t:a.STRING_LITERAL,v:e}:(c.pos=d,null)):null}}(k,Sb),Ub=function(a,b){var c=b(/^(?:[+-]?)(?:(?:(?:0|[1-9]\d*)?\.\d+)|(?:(?:0|[1-9]\d*)\.)|(?:0|[1-9]\d*))(?:[eE][+-]?\d+)?/);return function(b){var d;return(d=c(b))?{t:a.NUMBER_LITERAL,v:d}:null}}(k,Qb),Vb=function(a){return a(/^[a-zA-Z_$][a-zA-Z_$0-9]*/)}(Qb),Wb=function(a,b,c){var d=/^[a-zA-Z_$][a-zA-Z_$0-9]*$/;return function(e){var f;return(f=a(e))?d.test(f.v)?f.v:'"'+f.v.replace(/"/g,'\\"')+'"':(f=b(e))?f.v:(f=c(e))?f:void 0}}(Tb,Ub,Vb),Xb=function(a,b,c,d){function e(a){var b,c,e;return a.allowWhitespace(),(b=d(a))?(e={key:b},a.allowWhitespace(),a.getStringMatch(":")?(a.allowWhitespace(),(c=a.getToken())?(e.value=c.v,e):null):null):null}var f,g,h,i,j,k;return g={"true":!0,"false":!1,undefined:void 0,"null":null},h=new RegExp("^(?:"+Object.keys(g).join("|")+")"),i=/^(?:[+-]?)(?:(?:(?:0|[1-9]\d*)?\.\d+)|(?:(?:0|[1-9]\d*)\.)|(?:0|[1-9]\d*))(?:[eE][+-]?\d+)?/,j=/\$\{([^\}]+)\}/g,k=/^\$\{([^\}]+)\}/,f=function(a,b){this.str=a,this.values=b,this.pos=0,this.result=this.getToken()},f.prototype={remaining:function(){return this.str.substring(this.pos)},getStringMatch:a,getToken:function(){return this.allowWhitespace(),this.getPlaceholder()||this.getSpecial()||this.getNumber()||this.getString()||this.getObject()||this.getArray()},getPlaceholder:function(){var a;return this.values?(a=k.exec(this.remaining()))&&this.values.hasOwnProperty(a[1])?(this.pos+=a[0].length,{v:this.values[a[1]]}):void 0:null},getSpecial:function(){var a;return(a=h.exec(this.remaining()))?(this.pos+=a[0].length,{v:g[a[0]]}):void 0},getNumber:function(){var a;return(a=i.exec(this.remaining()))?(this.pos+=a[0].length,{v:+a[0]}):void 0},getString:function(){var a,b=c(this);return b&&(a=this.values)?{v:b.v.replace(j,function(b,c){return a[c]||c})}:b},getObject:function(){var a,b;if(!this.getStringMatch("{"))return null;for(a={};b=e(this);){if(a[b.key]=b.value,this.allowWhitespace(),this.getStringMatch("}"))return{v:a};if(!this.getStringMatch(","))return null}return null},getArray:function(){var a,b;if(!this.getStringMatch("["))return null;for(a=[];b=this.getToken();){if(a.push(b.v),this.getStringMatch("]"))return{v:a};if(!this.getStringMatch(","))return null}return null},allowWhitespace:b},function(a,b){var c=new f(a,b);return c.result?{value:c.result.v,remaining:c.remaining()}:null}}(Ob,Pb,Tb,Wb),Yb=function(a,b,c,d,e){function f(a){return"string"==typeof a?a:JSON.stringify(a)}var g=function(b){this.type=a.INTERPOLATOR,c(this,b)};return g.prototype={update:d,resolve:e,render:function(a){this.value=a,this.parentFragment.bubble()},teardown:function(){b(this)},toString:function(){return void 0==this.value?"":f(this.value)}},g}(k,nb,wb,yb,xb),Zb=function(a,b,c,d,e,f,g){var h,i;return g.push(function(){i=g.StringFragment}),h=function(c){this.type=a.SECTION,this.fragments=[],this.length=0,b(this,c)},h.prototype={update:c,resolve:d,teardown:function(){this.teardownFragments(),f(this)},teardownFragments:function(){for(;this.fragments.length;)this.fragments.shift().teardown();this.length=0},bubble:function(){this.value=this.fragments.join(""),this.parentFragment.bubble()},render:function(a){var b;(b=this.root._wrapped[this.keypath])&&(a=b.get()),e(this,a),this.parentFragment.bubble()},createFragment:function(a){return new i(a)},toString:function(){return this.fragments.join("")}},h}(k,wb,yb,xb,Ab,nb,Eb),$b=function(a){var b=function(b){this.type=a.TEXT,this.text=b};return b.prototype={toString:function(){return this.text},teardown:function(){}},b}(k),_b=function(a,b){return function(){var c,d,e,f,g,h,i;if(!this.argsList||this.dirty){if(c={},d=0,f=this.root._guid,i=function(a){return a.map(function(a){var b,e,g;return a.text?a.text:a.fragments?a.fragments.map(function(a){return i(a.items)}).join(""):(b=f+"-"+d++,g=(e=a.root._wrapped[a.keypath])?e.value:a.value,c[b]=g,"${"+b+"}")}).join("")},e=i(this.items),h=b("["+e+"]",c))this.argsList=h.value;else{if(g="Could not parse directive arguments ("+this.toString()+"). If you think this is a bug, please file an issue at http://github.com/RactiveJS/Ractive/issues",this.root.debug)throw new Error(g);a(g),this.argsList=[e]}this.dirty=!1}return this.argsList}}(I,Xb),ac=function(a,b,c,d,e,f,g,h){var i=function(a){c(this,a)};return i.prototype={createItem:function(b){if("string"==typeof b.descriptor)return new f(b.descriptor);switch(b.descriptor.t){case a.INTERPOLATOR:return new d(b);case a.TRIPLE:return new d(b);case a.SECTION:return new e(b);default:throw"Something went wrong in a rather interesting way"}},bubble:function(){this.dirty=!0,this.owner.bubble()},teardown:function(){var a,b;for(a=this.items.length,b=0;a>b;b+=1)this.items[b].teardown()},getValue:function(){var b;return 1===this.items.length&&this.items[0].type===a.INTERPOLATOR&&(b=this.items[0].value,void 0!==b)?b:this.toString()},isSimple:function(){var b,c,d;if(void 0!==this.simple)return this.simple;for(b=this.items.length;b--;)if(c=this.items[b],c.type!==a.TEXT){if(c.type!==a.INTERPOLATOR)return this.simple=!1;if(d)return!1;d=!0}return this.simple=!0},toString:function(){return this.items.join("")},toJSON:function(){var a,c=this.getValue();return"string"==typeof c&&(a=b(c),c=a?a.value:c),c},toArgsList:g},h.StringFragment=i,i}(k,Xb,kb,Yb,Zb,$b,_b,Eb),bc=function(a,b,c,d,e,f,g){var h=function(e){return this.type=a.ATTRIBUTE,this.element=e.element,b(this,e.name),null===e.value||"string"==typeof e.value?(c(this,e),void 0):(this.root=e.root,this.pNode=e.pNode,this.parentFragment=this.element.parentFragment,this.fragment=new g({descriptor:e.value,root:this.root,owner:this,contextStack:e.contextStack}),this.pNode&&("value"===this.name&&(this.isValueAttribute=!0,"INPUT"===this.pNode.tagName&&"file"===this.pNode.type&&(this.isFileInputValue=!0)),d(this,e),this.selfUpdating=this.fragment.isSimple(),this.ready=!0),void 0)};return h.prototype={bind:e,update:f,updateBindings:function(){this.keypath=this.interpolator.keypath||this.interpolator.ref,"name"===this.propertyName&&(this.pNode.name="{{"+this.keypath+"}}")
},teardown:function(){var a;if(this.boundEvents)for(a=this.boundEvents.length;a--;)this.pNode.removeEventListener(this.boundEvents[a],this.updateModel,!1);this.fragment&&this.fragment.teardown()},bubble:function(){this.selfUpdating?this.update():!this.deferred&&this.ready&&(this.root._deferred.attrs.push(this),this.deferred=!0)},toString:function(){var a;return null===this.value?this.name:this.fragment?(a=this.fragment.toString(),this.name+"="+JSON.stringify(a)):this.name+"="+JSON.stringify(this.value)}},h}(k,Jb,Kb,Lb,Mb,Nb,ac),cc=function(a){return function(b,c){var d,e,f;b.attributes=[];for(d in c)c.hasOwnProperty(d)&&(e=c[d],f=new a({element:b,name:d,value:e,root:b.root,pNode:b.node,contextStack:b.parentFragment.contextStack}),b.attributes[b.attributes.length]=b.attributes[d]=f,"name"!==d&&f.update());return b.attributes}}(bc),dc=function(a,b,c,d){var e,f,g;return d.push(function(){e=d.DomFragment}),f=function(){var a=this.node,b=this.fragment.toString();a.styleSheet&&(a.styleSheet.cssText=b),a.innerHTML=b},g=function(){this.node.type&&"text/javascript"!==this.node.type||a("Script tag was updated. This does not cause the code to be re-evaluated!"),this.node.innerHTML=this.fragment.toString()},function(a,d,h,i){var j,k,l,m,n;if("script"===a.lcName||"style"===a.lcName)return a.fragment=new c({descriptor:h.f,root:a.root,contextStack:a.parentFragment.contextStack,owner:a}),i&&("script"===a.lcName?(a.bubble=g,a.node.innerHTML=a.fragment.toString()):(a.bubble=f,a.bubble())),void 0;if("string"!=typeof h.f||d&&d.namespaceURI&&d.namespaceURI!==b.html)a.fragment=new e({descriptor:h.f,root:a.root,pNode:d,contextStack:a.parentFragment.contextStack,owner:a}),i&&d.appendChild(a.fragment.docFrag);else if(a.html=h.f,i)for(d.innerHTML=a.html,j=a.root._liveQueries,k=j.length;k--;)if(l=j[k],(m=d.querySelectorAll(l))&&(n=m.length))for((a.liveQueries||(a.liveQueries=[])).push(l),a.liveQueries[l]=[];n--;)a.liveQueries[l][n]=m[n]}}(I,d,ac,Eb),ec=function(a,b){var c=function(c,d,e,f){var g,h,i;if(this.root=d,this.node=e.node,g=c.n||c,"string"!=typeof g&&(h=new b({descriptor:g,root:this.root,owner:e,contextStack:f}),g=h.toString(),h.teardown()),c.a?this.params=c.a:c.d&&(h=new b({descriptor:c.d,root:this.root,owner:e,contextStack:f}),this.params=h.toArgsList(),h.teardown()),this.fn=d.decorators[g],!this.fn){if(i='Missing "'+g+'" decorator. You may need to download a plugin via https://github.com/RactiveJS/Ractive/wiki/Plugins#decorators',d.debug)throw new Error(i);a(i)}};return c.prototype={init:function(){var a,b;if(this.params?(b=[this.node].concat(this.params),a=this.fn.apply(this.root,b)):a=this.fn.call(this.root,this.node),!a||!a.teardown)throw new Error("Decorator definition must return an object with a teardown method");this.teardown=a.teardown}},c}(I,ac),fc=function(a){return function(b,c,d,e){d.decorator=new a(b,c,d,e),d.decorator.fn&&c._deferred.decorators.push(d.decorator)}}(ec),gc=function(a,b){var c,d,e,f,g,h,i,j,k;return c=function(a,b,c,e,f){var g,h;g=a.node._ractive.events,h=g[b]||(g[b]=new d(a,b,e,f)),h.add(c)},d=function(b,c,d){var e;this.element=b,this.root=b.root,this.node=b.node,this.name=c,this.contextStack=d,this.proxies=[],(e=this.root.events[c])?this.custom=e(this.node,k(c)):("on"+c in this.node||a('Missing "'+this.name+'" event. You may need to download a plugin via https://github.com/RactiveJS/Ractive/wiki/Plugins#events'),this.node.addEventListener(c,j,!1))},d.prototype={add:function(a){this.proxies[this.proxies.length]=new e(this.element,this.root,a,this.contextStack)},teardown:function(){var a;for(this.custom?this.custom.teardown():this.node.removeEventListener(this.name,j,!1),a=this.proxies.length;a--;)this.proxies[a].teardown()},fire:function(a){for(var b=this.proxies.length;b--;)this.proxies[b].fire(a)}},e=function(a,c,d,e){var i;return this.root=c,i=d.n||d,this.n="string"==typeof i?i:new b({descriptor:d.n,root:this.root,owner:a,contextStack:e}),d.a?(this.a=d.a,this.fire=g,void 0):d.d?(this.d=new b({descriptor:d.d,root:this.root,owner:a,contextStack:e}),this.fire=h,void 0):(this.fire=f,void 0)},e.prototype={teardown:function(){this.n.teardown&&this.n.teardown(),this.d&&this.d.teardown()},bubble:function(){}},f=function(a){this.root.fire(this.n.toString(),a)},g=function(a){this.root.fire.apply(this.root,[this.n.toString(),a].concat(this.a))},h=function(a){var b=this.d.toArgsList();"string"==typeof b&&(b=b.substr(1,b.length-2)),this.root.fire.apply(this.root,[this.n.toString(),a].concat(b))},j=function(a){var b=this._ractive;b.events[a.type].fire({node:this,original:a,index:b.index,keypath:b.keypath,context:b.root.get(b.keypath)})},i={},k=function(a){return i[a]?i[a]:i[a]=function(b){var c=b.node._ractive;b.index=c.index,b.keypath=c.keypath,b.context=c.root.get(c.keypath),c.events[a].fire(b)}},c}(I,ac),hc=function(a){return function(b,c){var d,e,f;for(e in c)if(c.hasOwnProperty(e))for(f=e.split("-"),d=f.length;d--;)a(b,f[d],c[e],b.parentFragment.contextStack)}}(gc),ic=function(){return function(a){var b,c,d,e,f;for(b=a.root,c=b._liveQueries,d=c.length;d--;)e=c[d],f=c[e],f._test(a)&&((a.liveQueries||(a.liveQueries=[])).push(e),a.liveQueries[e]=[a.node])}}(),jc=function(){return function(a){return a.replace(/-([a-zA-Z])/g,function(a,b){return b.toUpperCase()})}}(),kc=function(){return function(a,b){var c;for(c in b)b.hasOwnProperty(c)&&!a.hasOwnProperty(c)&&(a[c]=b[c]);return a}}(),lc=function(a,b,c,d,e,f,g,h){function i(a){var b,c,d;if(!q[a])if(void 0!==m[a])q[a]=a;else for(d=a.charAt(0).toUpperCase()+a.substring(1),b=n.length;b--;)if(c=n[b],void 0!==m[c+d]){q[a]=c+d;break}return q[a]}function j(a){return a.replace(p,"")}function k(a){var b;return o.test(a)&&(a="-"+a),b=a.replace(/[A-Z]/g,function(a){return"-"+a.toLowerCase()})}var l,m,n,o,p,q,r,s,t,u,v,w;if(a)return m=b("div").style,function(){void 0!==m.transition?(s="transition",w="transitionend",r=!0):void 0!==m.webkitTransition?(s="webkitTransition",w="webkitTransitionEnd",r=!0):r=!1}(),s&&(t=s+"Duration",u=s+"Property",v=s+"TimingFunction"),l=function(a,b,d,e,f){var g,i,j,k=this;if(this.root=b,this.node=d.node,this.isIntro=f,this.originalStyle=this.node.getAttribute("style"),this.complete=function(a){!a&&k.isIntro&&k.resetStyle(),k._manager.pop(k.node),k.node._ractive.transition=null},g=a.n||a,"string"!=typeof g&&(i=new h({descriptor:g,root:this.root,owner:d,contextStack:e}),g=i.toString(),i.teardown()),this.name=g,a.a?this.params=a.a:a.d&&(i=new h({descriptor:a.d,root:this.root,owner:d,contextStack:e}),this.params=i.toArgsList(),i.teardown()),this._fn=b.transitions[g],!this._fn){if(j='Missing "'+g+'" transition. You may need to download a plugin via https://github.com/RactiveJS/Ractive/wiki/Plugins#transitions',b.debug)throw new Error(j);return c(j),void 0}},l.prototype={init:function(){if(this._inited)throw new Error("Cannot initialize a transition more than once");this._inited=!0,this._fn.apply(this.root,[this].concat(this.params))},getStyle:function(a){var b,c,d,f,g;if(b=window.getComputedStyle(this.node),"string"==typeof a)return g=b[i(a)],"0px"===g&&(g=0),g;if(!e(a))throw new Error("Transition#getStyle must be passed a string, or an array of strings representing CSS properties");for(c={},d=a.length;d--;)f=a[d],g=b[i(f)],"0px"===g&&(g=0),c[f]=g;return c},setStyle:function(a,b){var c;if("string"==typeof a)this.node.style[i(a)]=b;else for(c in a)a.hasOwnProperty(c)&&(this.node.style[i(c)]=a[c]);return this},animateStyle:function(a,b,d,e){var g,h,l,m,n,o,p,q,r,s=this;for("string"==typeof a?(n={},n[a]=b):(n=a,e=d,d=b),d||(c('The "'+s.name+'" transition does not supply an options object to `t.animateStyle()`. This will break in a future version of Ractive. For more info see https://github.com/RactiveJS/Ractive/issues/340'),d=s,e=s.complete),d.duration||(s.setStyle(n),e&&e()),g=Object.keys(n),h=[],l=window.getComputedStyle(s.node),o={},q=g.length;q--;)r=g[q],m=l[i(r)],"0px"===m&&(m=0),m!=n[r]&&(h[h.length]=r,s.node.style[i(r)]=m);return h.length?(setTimeout(function(){s.node.style[u]=g.map(i).map(k).join(","),s.node.style[v]=k(d.easing||"linear"),s.node.style[t]=d.duration/1e3+"s",p=function(a){var b;b=h.indexOf(f(j(a.propertyName))),-1!==b&&h.splice(b,1),h.length||(s.root.fire(s.name+":end"),s.node.removeEventListener(w,p,!1),e&&e())},s.node.addEventListener(w,p,!1),setTimeout(function(){for(var a=h.length;a--;)r=h[a],s.node.style[i(r)]=n[r]},0)},d.delay||0),void 0):(e&&e(),void 0)},resetStyle:function(){this.originalStyle?this.node.setAttribute("style",this.originalStyle):(this.node.getAttribute("style"),this.node.removeAttribute("style"))},processParams:function(a,b){return"number"==typeof a?a={duration:a}:"string"==typeof a?a="slow"===a?{duration:600}:"fast"===a?{duration:200}:{duration:400}:a||(a={}),g(a,b)}},n=["o","ms","moz","webkit"],o=new RegExp("^(?:"+n.join("|")+")([A-Z])"),p=new RegExp("^-(?:"+n.join("|")+")-"),q={},l}(f,e,I,J,l,jc,kc,ac),mc=function(a,b){return function(a,c,d,e,f){var g,h,i;!c.transitionsEnabled||c._parent&&!c._parent.transitionsEnabled||(g=new b(a,c,d,e,f),g._fn&&(h=g.node,g._manager=c._transitionManager,(i=h._ractive.transition)&&i.complete(),h._ractive.transition=g,g._manager.push(h),f?c._deferred.transitions.push(g):g.init()))}}(I,lc),nc=function(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o){return function(e,p,q){var r,s,t,u,v,w,x,y,z,A,B,C,D;if(e.type=a.ELEMENT,r=e.parentFragment=p.parentFragment,s=r.pNode,t=r.contextStack,u=e.descriptor=p.descriptor,e.root=B=r.root,e.index=p.index,e.lcName=u.e.toLowerCase(),e.eventListeners=[],e.customEventListeners=[],s&&(v=e.namespace=h(u,s),w=v!==b.html?o(u.e):u.e,e.node=g(w,v),d(e.node,"_ractive",{value:{proxy:e,keypath:t.length?t[t.length-1]:"",index:r.indexRefs,events:c(null),root:B}})),x=i(e,u.a),u.f){if(e.node&&e.node.getAttribute("contenteditable")&&e.node.innerHTML){if(D="A pre-populated contenteditable element should not have children",B.debug)throw new Error(D);f(D)}j(e,e.node,u,q)}q&&u.v&&l(e,u.v),q&&(B.twoway&&(e.bind(),e.node.getAttribute("contenteditable")&&e.node._ractive.binding&&e.node._ractive.binding.update()),x.name&&!x.name.twoway&&x.name.update(),"IMG"===e.node.tagName&&((y=e.attributes.width)||(z=e.attributes.height))&&e.node.addEventListener("load",A=function(){y&&(e.node.width=y.value),z&&(e.node.height=z.value),e.node.removeEventListener("load",A,!1)},!1),q.appendChild(e.node),u.o&&k(u.o,B,e,t),u.t1&&n(u.t1,B,e,t,!0),"OPTION"===e.node.tagName&&("SELECT"===s.tagName&&(C=s._ractive.binding)&&C.deferUpdate(),e.node._ractive.value==s._ractive.value&&(e.node.selected=!0)),e.node.autofocus&&(B._deferred.focusable=e.node)),m(e)}}(k,d,c,g,Z,I,e,Hb,cc,dc,fc,hc,ic,mc,Ib),oc=function(a){return function(b){var c,d,e,f,g,h,i,j,k;for(this.fragment&&this.fragment.teardown(!1);this.attributes.length;)this.attributes.pop().teardown();if(this.node){for(c in this.node._ractive.events)this.node._ractive.events[c].teardown();(d=this.node._ractive.binding)&&(d.teardown(),e=this.root._twowayBindings[d.attr.keypath],e.splice(e.indexOf(d),1))}if(this.decorator&&this.decorator.teardown(),this.descriptor.t2&&a(this.descriptor.t2,this.root,this,this.parentFragment.contextStack,!1),b&&this.root._transitionManager.detachWhenReady(this),g=this.liveQueries)for(f=g.length;f--;)if(h=g[f],j=this.liveQueries[h])for(k=j.length,i=this.root._liveQueries[h];k--;)i._remove(j[k])}}(mc),pc=function(){return"area base br col command doctype embed hr img input keygen link meta param source track wbr".split(" ")}(),qc=function(a){return function(){var b,c,d;for(b="<"+(this.descriptor.y?"!doctype":this.descriptor.e),d=this.attributes.length,c=0;d>c;c+=1)b+=" "+this.attributes[c].toString();return b+=">",this.html?b+=this.html:this.fragment&&(b+=this.fragment.toString()),-1===a.indexOf(this.descriptor.e)&&(b+="</"+this.descriptor.e+">"),b}}(pc),rc=function(a){return function(b){var c;return a(this.node,b)?this.node:this.html&&(c=this.node.querySelector(b))?c:this.fragment&&this.fragment.find?this.fragment.find(b):void 0}}(Z),sc=function(){return function(a,b){var c,d,e,f,g;if(b._test(this,!0)&&b.live&&((this.liveQueries||(this.liveQueries=[])).push(a),this.liveQueries[a]=[this.node]),this.html&&(c=this.node.querySelectorAll(a))&&(e=c.length))for(b.live&&(this.liveQueries[a]||((this.liveQueries||(this.liveQueries=[])).push(a),this.liveQueries[a]=[]),g=this.liveQueries[a]),d=0;e>d;d+=1)f=c[d],b.push(f),b.live&&g.push(f);this.fragment&&this.fragment.findAll(a,b)}}(),tc=function(){return function(a){return this.fragment?this.fragment.findComponent(a):void 0}}(),uc=function(){return function(a,b){this.fragment&&this.fragment.findAllComponents(a,b)}}(),vc=function(){return function(){var a=this.attributes;if(this.node&&(this.binding&&(this.binding.teardown(),this.binding=null),!(this.node.getAttribute("contenteditable")&&a.value&&a.value.bind())))switch(this.descriptor.e){case"select":case"textarea":return a.value&&a.value.bind(),void 0;case"input":if("radio"===this.node.type||"checkbox"===this.node.type){if(a.name&&a.name.bind())return;if(a.checked&&a.checked.bind())return}if(a.value&&a.value.bind())return}}}(),wc=function(a,b,c,d,e,f,g,h){var i=function(b,c){a(this,b,c)};return i.prototype={detach:function(){return this.node?(this.node.parentNode&&this.node.parentNode.removeChild(this.node),this.node):void 0},teardown:b,firstNode:function(){return this.node},findNextNode:function(){return null},bubble:function(){},toString:c,find:d,findAll:e,findComponent:f,findAllComponents:g,bind:h},i}(nc,oc,qc,rc,sc,tc,uc,vc),xc={missingParser:"Missing Ractive.parse - cannot parse template. Either preparse or use the version that includes the parser"},yc={},zc=function(){return function(a){var b,c,d;for(d="";a.length;){if(b=a.indexOf("<!--"),c=a.indexOf("-->"),-1===b&&-1===c){d+=a;break}if(-1!==b&&-1===c)throw"Illegal HTML - expected closing comment sequence ('-->')";if(-1!==c&&-1===b||b>c)throw"Illegal HTML - unexpected closing comment sequence ('-->')";d+=a.substr(0,b),a=a.substring(c+3)}return d}}(),Ac=function(a){return function(b){var c,d,e,f,g,h;for(g=/^\s*\r?\n/,h=/\r?\n\s*$/,c=2;c<b.length;c+=1)d=b[c],e=b[c-1],f=b[c-2],d.type===a.TEXT&&e.type===a.MUSTACHE&&f.type===a.TEXT&&h.test(f.value)&&g.test(d.value)&&(e.mustacheType!==a.INTERPOLATOR&&e.mustacheType!==a.TRIPLE&&(f.value=f.value.replace(h,"\n")),d.value=d.value.replace(g,""),""===d.value&&b.splice(c--,1));return b}}(k),Bc=function(a){return function(b){var c,d,e,f;for(c=0;c<b.length;c+=1)d=b[c],e=b[c-1],f=b[c+1],(d.mustacheType===a.COMMENT||d.mustacheType===a.DELIMCHANGE)&&(b.splice(c,1),e&&f&&e.type===a.TEXT&&f.type===a.TEXT&&(e.value+=f.value,b.splice(c,1)),c-=1);return b}}(k),Cc=function(a){var b=a(/^[^\s=]+/);return function(a){var c,d,e;return a.getStringMatch("=")?(c=a.pos,a.allowWhitespace(),(d=b(a))?(a.allowWhitespace(),(e=b(a))?(a.allowWhitespace(),a.getStringMatch("=")?[d,e]:(a.pos=c,null)):(a.pos=c,null)):(a.pos=c,null)):null}}(Qb),Dc=function(a){var b={"#":a.SECTION,"^":a.INVERTED,"/":a.CLOSING,">":a.PARTIAL,"!":a.COMMENT,"&":a.TRIPLE};return function(a){var c=b[a.str.charAt(a.pos)];return c?(a.pos+=1,c):null}}(k),Ec=function(a,b,c){var d=b(/^\s*:\s*([a-zA-Z_$][a-zA-Z_$0-9]*)/),e=/^[0-9][1-9]*$/;return function(b,f){var g,h,i,j,k,l,m;if(g=b.pos,h={type:f?a.TRIPLE:a.MUSTACHE},!(f||((j=b.getExpression())&&(h.mustacheType=a.INTERPOLATOR,b.allowWhitespace(),b.getStringMatch(b.delimiters[1])?b.pos-=b.delimiters[1].length:(b.pos=g,j=null)),j||(i=c(b),i===a.TRIPLE?h={type:a.TRIPLE}:h.mustacheType=i||a.INTERPOLATOR,i!==a.COMMENT&&i!==a.CLOSING||(l=b.remaining(),m=l.indexOf(b.delimiters[1]),-1===m)))))return h.ref=l.substr(0,m),b.pos+=m,h;for(j||(b.allowWhitespace(),j=b.getExpression());j.t===a.BRACKETED&&j.x;)j=j.x;return j.t===a.REFERENCE?h.ref=j.n:j.t===a.NUMBER_LITERAL&&e.test(j.v)?h.ref=j.v:h.expression=j,k=d(b),null!==k&&(h.indexRef=k),h}}(k,Qb,Dc),Fc=function(a,b,c){function d(d,e){var f,g,h=d.pos;return g=e?d.tripleDelimiters:d.delimiters,d.getStringMatch(g[0])?(f=b(d))?d.getStringMatch(g[1])?(d[e?"tripleDelimiters":"delimiters"]=f,{type:a.MUSTACHE,mustacheType:a.DELIMCHANGE}):(d.pos=h,null):(d.allowWhitespace(),f=c(d,e),null===f?(d.pos=h,null):(d.allowWhitespace(),d.getStringMatch(g[1])?f:(d.pos=h,null))):null}return function(){var a=this.tripleDelimiters[0].length>this.delimiters[0].length;return d(this,a)||d(this,!a)}}(k,Cc,Ec),Gc=function(a){return function(){var b,c,d;if(!this.getStringMatch("<!--"))return null;if(c=this.remaining(),d=c.indexOf("-->"),-1===d)throw new Error('Unexpected end of input (expected "-->" to close comment)');return b=c.substr(0,d),this.pos+=d+3,{type:a.COMMENT,content:b}}}(k),Hc=function(){return function(a,b){var c,d,e;for(c=b.length;c--;){if(d=a.indexOf(b[c]),!d)return 0;-1!==d&&(!e||e>d)&&(e=d)}return e||-1}}(),Ic=function(a,b,c){var d,e,f,g,h,i,j,k,l,m,n,o,p;return d=function(){return e(this)||f(this)},e=function(b){var c,d,e,f;return c=b.pos,b.inside?null:b.getStringMatch("<")?(d={type:a.TAG},b.getStringMatch("!")&&(d.doctype=!0),d.name=g(b),d.name?(e=h(b),e&&(d.attrs=e),b.allowWhitespace(),b.getStringMatch("/")&&(d.selfClosing=!0),b.getStringMatch(">")?(f=d.name.toLowerCase(),("script"===f||"style"===f)&&(b.inside=f),d):(b.pos=c,null)):(b.pos=c,null)):null},f=function(b){var c,d,e;if(c=b.pos,e=function(a){throw new Error("Unexpected character "+b.remaining().charAt(0)+" (expected "+a+")")},!b.getStringMatch("<"))return null;if(d={type:a.TAG,closing:!0},b.getStringMatch("/")||e('"/"'),d.name=g(b),d.name||e("tag name"),b.getStringMatch(">")||e('">"'),b.inside){if(d.name.toLowerCase()!==b.inside)return b.pos=c,null;b.inside=null}return d},g=b(/^[a-zA-Z]{1,}:?[a-zA-Z0-9\-]*/),h=function(a){var b,c,d;if(b=a.pos,a.allowWhitespace(),d=i(a),!d)return a.pos=b,null;for(c=[];null!==d;)c[c.length]=d,a.allowWhitespace(),d=i(a);return c},i=function(a){var b,c,d;return(c=j(a))?(b={name:c},d=k(a),d&&(b.value=d),b):null},j=b(/^[^\s"'>\/=]+/),k=function(a){var b,c;return b=a.pos,a.allowWhitespace(),a.getStringMatch("=")?(a.allowWhitespace(),c=p(a,"'")||p(a,'"')||l(a),null===c?(a.pos=b,null):c):(a.pos=b,null)},n=b(/^[^\s"'=<>`]+/),m=function(b){var c,d,e;return c=b.pos,(d=n(b))?(-1!==(e=d.indexOf(b.delimiters[0]))&&(d=d.substr(0,e),b.pos=c+d.length),{type:a.TEXT,value:d}):null},l=function(a){var b,c;for(b=[],c=a.getMustache()||m(a);null!==c;)b[b.length]=c,c=a.getMustache()||m(a);return b.length?b:null},p=function(a,b){var c,d,e;if(c=a.pos,!a.getStringMatch(b))return null;for(d=[],e=a.getMustache()||o(a,b);null!==e;)d[d.length]=e,e=a.getMustache()||o(a,b);return a.getStringMatch(b)?d:(a.pos=c,null)},o=function(b,d){var e,f,g;if(e=b.pos,g=b.remaining(),f=c(g,[d,b.delimiters[0],b.delimiters[1]]),-1===f)throw new Error("Quoted attribute value must have a closing quote");return f?(b.pos+=f,{type:a.TEXT,value:g.substr(0,f)}):null},d}(k,Qb,Hc),Jc=function(a,b){return function(){var c,d,e;return d=this.remaining(),e=this.inside?"</"+this.inside:"<",(c=b(d,[e,this.delimiters[0],this.tripleDelimiters[0]]))?(-1===c&&(c=d.length),this.pos+=c,{type:a.TEXT,value:d.substr(0,c)}):null}}(k,Hc),Kc=function(a){return function(b){var c=b.remaining();return"true"===c.substr(0,4)?(b.pos+=4,{t:a.BOOLEAN_LITERAL,v:"true"}):"false"===c.substr(0,5)?(b.pos+=5,{t:a.BOOLEAN_LITERAL,v:"false"}):null}}(k),Lc=function(a,b){return function(c){var d,e,f;return d=c.pos,c.allowWhitespace(),e=b(c),null===e?(c.pos=d,null):(c.allowWhitespace(),c.getStringMatch(":")?(c.allowWhitespace(),f=c.getExpression(),null===f?(c.pos=d,null):{t:a.KEY_VALUE_PAIR,k:e,v:f}):(c.pos=d,null))}}(k,Wb),Mc=function(a){return function b(c){var d,e,f,g;return d=c.pos,f=a(c),null===f?null:(e=[f],c.getStringMatch(",")?(g=b(c),g?e.concat(g):(c.pos=d,null)):e)}}(Lc),Nc=function(a,b){return function(c){var d,e;return d=c.pos,c.allowWhitespace(),c.getStringMatch("{")?(e=b(c),c.allowWhitespace(),c.getStringMatch("}")?{t:a.OBJECT_LITERAL,m:e}:(c.pos=d,null)):(c.pos=d,null)}}(k,Mc),Oc=function(){return function a(b){var c,d,e,f;if(c=b.pos,b.allowWhitespace(),e=b.getExpression(),null===e)return null;if(d=[e],b.allowWhitespace(),b.getStringMatch(",")){if(f=a(b),null===f)return b.pos=c,null;d=d.concat(f)}return d}}(),Pc=function(a,b){return function(c){var d,e;return d=c.pos,c.allowWhitespace(),c.getStringMatch("[")?(e=b(c),c.getStringMatch("]")?{t:a.ARRAY_LITERAL,m:e}:(c.pos=d,null)):(c.pos=d,null)}}(k,Oc),Qc=function(a,b,c,d,e){return function(f){var g=a(f)||b(f)||c(f)||d(f)||e(f);return g}}(Ub,Kc,Tb,Nc,Pc),Rc=function(a,b,c){var d,e,f,g;return d=b(/^\.[a-zA-Z_$0-9]+/),e=function(a){var b=f(a);return b?"."+b:null},f=b(/^\[(0|[1-9][0-9]*)\]/),g=/^(?:Array|Date|RegExp|decodeURIComponent|decodeURI|encodeURIComponent|encodeURI|isFinite|isNaN|parseFloat|parseInt|JSON|Math|NaN|undefined|null)$/,function(b){var f,h,i,j,k,l,m;for(f=b.pos,h="";b.getStringMatch("../");)h+="../";if(h||(j=b.getStringMatch(".")||""),i=c(b)||"",!h&&!j&&g.test(i))return{t:a.GLOBAL,v:i};if("this"!==i||h||j||(i=".",f+=3),k=(h||j)+i,!k)return null;for(;l=d(b)||e(b);)k+=l;return b.getStringMatch("(")&&(m=k.lastIndexOf("."),-1!==m?(k=k.substr(0,m),b.pos=f+k.length):b.pos-=1),{t:a.REFERENCE,n:k}}}(k,Qb,Vb),Sc=function(a){return function(b){var c,d;return c=b.pos,b.getStringMatch("(")?(b.allowWhitespace(),(d=b.getExpression())?(b.allowWhitespace(),b.getStringMatch(")")?{t:a.BRACKETED,x:d}:(b.pos=c,null)):(b.pos=c,null)):null}}(k),Tc=function(a,b,c){return function(d){return a(d)||b(d)||c(d)}}(Qc,Rc,Sc),Uc=function(a,b){return function(c){var d,e,f;if(d=c.pos,c.allowWhitespace(),c.getStringMatch(".")){if(c.allowWhitespace(),e=b(c))return{t:a.REFINEMENT,n:e};c.expected("a property name")}return c.getStringMatch("[")?(c.allowWhitespace(),f=c.getExpression(),f||c.expected("an expression"),c.allowWhitespace(),c.getStringMatch("]")||c.expected('"]"'),{t:a.REFINEMENT,x:f}):null}}(k,Vb),Vc=function(a,b,c,d){return function(e){var f,g,h,i;if(g=b(e),!g)return null;for(;g;)if(f=e.pos,h=d(e))g={t:a.MEMBER,x:g,r:h};else{if(!e.getStringMatch("("))break;if(e.allowWhitespace(),i=c(e),e.allowWhitespace(),!e.getStringMatch(")")){e.pos=f;break}g={t:a.INVOCATION,x:g},i&&(g.o=i)}return g}}(k,Tc,Oc,Uc),Wc=function(a,b){var c,d;return d=function(b,c){return function(d){var e,f;return d.getStringMatch(b)?(e=d.pos,d.allowWhitespace(),f=d.getExpression(),f||d.expected("an expression"),{s:b,o:f,t:a.PREFIX_OPERATOR}):c(d)}},function(){var a,e,f,g,h;for(g="! ~ + - typeof".split(" "),h=b,a=0,e=g.length;e>a;a+=1)f=d(g[a],h),h=f;c=h}(),c}(k,Vc),Xc=function(a,b){var c,d;return d=function(b,c){return function(d){var e,f,g;return(f=c(d))?(e=d.pos,d.allowWhitespace(),d.getStringMatch(b)?"in"===b&&/[a-zA-Z_$0-9]/.test(d.remaining().charAt(0))?(d.pos=e,f):(d.allowWhitespace(),g=d.getExpression(),g?{t:a.INFIX_OPERATOR,s:b,o:[f,g]}:(d.pos=e,f)):(d.pos=e,f)):null}},function(){var a,e,f,g,h;for(g="* / % + - << >> >>> < <= > >= in instanceof == != === !== & ^ | && ||".split(" "),h=b,a=0,e=g.length;e>a;a+=1)f=d(g[a],h),h=f;c=h}(),c}(k,Wc),Yc=function(a,b){return function(c){var d,e,f,g;return(e=b(c))?(d=c.pos,c.allowWhitespace(),c.getStringMatch("?")?(c.allowWhitespace(),(f=c.getExpression())?(c.allowWhitespace(),c.getStringMatch(":")?(c.allowWhitespace(),g=c.getExpression(),g?{t:a.CONDITIONAL,o:[e,f,g]}:(c.pos=d,e)):(c.pos=d,e)):(c.pos=d,e)):(c.pos=d,e)):null}}(k,Xc),Zc=function(a){return function(){return a(this)}}(Yc),$c=function(a,b,c,d,e,f,g){var h;return h=function(a,b){var c;for(this.str=a,this.pos=0,this.delimiters=b.delimiters,this.tripleDelimiters=b.tripleDelimiters,this.tokens=[];this.pos<this.str.length;)c=this.getToken(),null===c&&this.remaining()&&this.fail(),this.tokens.push(c)},h.prototype={getToken:function(){var a=this.getMustache()||this.getComment()||this.getTag()||this.getText();return a},getMustache:a,getComment:b,getTag:c,getText:d,getExpression:e,allowWhitespace:f,getStringMatch:g,remaining:function(){return this.str.substring(this.pos)},fail:function(){var a,b;throw a=this.str.substr(0,this.pos).substr(-20),20===a.length&&(a="..."+a),b=this.remaining().substr(0,20),20===b.length&&(b+="..."),new Error("Could not parse template: "+(a?a+"<- ":"")+"failed at character "+this.pos+" ->"+b)},expected:function(a){var b=this.remaining().substr(0,40);throw 40===b.length&&(b+="..."),new Error('Tokenizer failed: unexpected string "'+b+'" (expected '+a+")")}},h}(Fc,Gc,Ic,Jc,Zc,Pb,Ob),_c=function(a,b,c,d,e){var f,g;return e.push(function(){g=e.Ractive}),f=function(e,f){var h,i;return f=f||{},f.stripComments!==!1&&(e=a(e)),h=new d(e,{delimiters:f.delimiters||(g?g.delimiters:["{{","}}"]),tripleDelimiters:f.tripleDelimiters||(g?g.tripleDelimiters:["{{{","}}}"])}),i=h.tokens,b(i),c(i),i}}(zc,Ac,Bc,$c,Eb),ad=function(a){var b,c,d,e,f,g,h,i,j;return b=function(a,b){this.text=b?a.value:a.value.replace(j," ")},b.prototype={type:a.TEXT,toJSON:function(){return this.decoded||(this.decoded=i(this.text))},toString:function(){return this.text}},c={quot:34,amp:38,apos:39,lt:60,gt:62,nbsp:160,iexcl:161,cent:162,pound:163,curren:164,yen:165,brvbar:166,sect:167,uml:168,copy:169,ordf:170,laquo:171,not:172,shy:173,reg:174,macr:175,deg:176,plusmn:177,sup2:178,sup3:179,acute:180,micro:181,para:182,middot:183,cedil:184,sup1:185,ordm:186,raquo:187,frac14:188,frac12:189,frac34:190,iquest:191,Agrave:192,Aacute:193,Acirc:194,Atilde:195,Auml:196,Aring:197,AElig:198,Ccedil:199,Egrave:200,Eacute:201,Ecirc:202,Euml:203,Igrave:204,Iacute:205,Icirc:206,Iuml:207,ETH:208,Ntilde:209,Ograve:210,Oacute:211,Ocirc:212,Otilde:213,Ouml:214,times:215,Oslash:216,Ugrave:217,Uacute:218,Ucirc:219,Uuml:220,Yacute:221,THORN:222,szlig:223,agrave:224,aacute:225,acirc:226,atilde:227,auml:228,aring:229,aelig:230,ccedil:231,egrave:232,eacute:233,ecirc:234,euml:235,igrave:236,iacute:237,icirc:238,iuml:239,eth:240,ntilde:241,ograve:242,oacute:243,ocirc:244,otilde:245,ouml:246,divide:247,oslash:248,ugrave:249,uacute:250,ucirc:251,uuml:252,yacute:253,thorn:254,yuml:255,OElig:338,oelig:339,Scaron:352,scaron:353,Yuml:376,fnof:402,circ:710,tilde:732,Alpha:913,Beta:914,Gamma:915,Delta:916,Epsilon:917,Zeta:918,Eta:919,Theta:920,Iota:921,Kappa:922,Lambda:923,Mu:924,Nu:925,Xi:926,Omicron:927,Pi:928,Rho:929,Sigma:931,Tau:932,Upsilon:933,Phi:934,Chi:935,Psi:936,Omega:937,alpha:945,beta:946,gamma:947,delta:948,epsilon:949,zeta:950,eta:951,theta:952,iota:953,kappa:954,lambda:955,mu:956,nu:957,xi:958,omicron:959,pi:960,rho:961,sigmaf:962,sigma:963,tau:964,upsilon:965,phi:966,chi:967,psi:968,omega:969,thetasym:977,upsih:978,piv:982,ensp:8194,emsp:8195,thinsp:8201,zwnj:8204,zwj:8205,lrm:8206,rlm:8207,ndash:8211,mdash:8212,lsquo:8216,rsquo:8217,sbquo:8218,ldquo:8220,rdquo:8221,bdquo:8222,dagger:8224,Dagger:8225,bull:8226,hellip:8230,permil:8240,prime:8242,Prime:8243,lsaquo:8249,rsaquo:8250,oline:8254,frasl:8260,euro:8364,image:8465,weierp:8472,real:8476,trade:8482,alefsym:8501,larr:8592,uarr:8593,rarr:8594,darr:8595,harr:8596,crarr:8629,lArr:8656,uArr:8657,rArr:8658,dArr:8659,hArr:8660,forall:8704,part:8706,exist:8707,empty:8709,nabla:8711,isin:8712,notin:8713,ni:8715,prod:8719,sum:8721,minus:8722,lowast:8727,radic:8730,prop:8733,infin:8734,ang:8736,and:8743,or:8744,cap:8745,cup:8746,"int":8747,there4:8756,sim:8764,cong:8773,asymp:8776,ne:8800,equiv:8801,le:8804,ge:8805,sub:8834,sup:8835,nsub:8836,sube:8838,supe:8839,oplus:8853,otimes:8855,perp:8869,sdot:8901,lceil:8968,rceil:8969,lfloor:8970,rfloor:8971,lang:9001,rang:9002,loz:9674,spades:9824,clubs:9827,hearts:9829,diams:9830},d=[8364,129,8218,402,8222,8230,8224,8225,710,8240,352,8249,338,141,381,143,144,8216,8217,8220,8221,8226,8211,8212,732,8482,353,8250,339,157,382,376],e=new RegExp("&("+Object.keys(c).join("|")+");?","g"),f=/&#x([0-9]+);?/g,g=/&#([0-9]+);?/g,h=function(a){return a?10===a?32:128>a?a:159>=a?d[a-128]:55296>a?a:57343>=a?65533:65535>=a?a:65533:65533},i=function(a){var b;return b=a.replace(e,function(a,b){return c[b]?String.fromCharCode(c[b]):a}),b=b.replace(f,function(a,b){return String.fromCharCode(h(parseInt(b,16)))}),b=b.replace(g,function(a,b){return String.fromCharCode(h(b))})},j=/\s+/g,b}(k),bd=function(a,b){return function(c){return c.type===a.TEXT?(this.pos+=1,new b(c,this.preserveWhitespace)):null}}(k,ad),cd=function(a){var b;return b=function(a){this.content=a.content},b.prototype={toJSON:function(){return{t:a.COMMENT,f:this.content}},toString:function(){return"<!--"+this.content+"-->"}},b}(k),dd=function(a,b){return function(c){return c.type===a.COMMENT?(this.pos+=1,new b(c,this.preserveWhitespace)):null}}(k,cd),ed=function(a,b){var c,d,e;return c=function(a){this.refs=[],d(a,this.refs),this.str=e(a,this.refs)},c.prototype={toJSON:function(){return this.json?this.json:(this.json={r:this.refs,s:this.str},this.json)}},d=function(c,e){var f,g;if(c.t===a.REFERENCE&&-1===e.indexOf(c.n)&&e.unshift(c.n),g=c.o||c.m)if(b(g))d(g,e);else for(f=g.length;f--;)d(g[f],e);c.x&&d(c.x,e),c.r&&d(c.r,e),c.v&&d(c.v,e)},e=function(b,c){var d=function(a){return e(a,c)};switch(b.t){case a.BOOLEAN_LITERAL:case a.GLOBAL:case a.NUMBER_LITERAL:return b.v;case a.STRING_LITERAL:return"'"+b.v.replace(/'/g,"\\'")+"'";case a.ARRAY_LITERAL:return"["+(b.m?b.m.map(d).join(","):"")+"]";case a.OBJECT_LITERAL:return"{"+(b.m?b.m.map(d).join(","):"")+"}";case a.KEY_VALUE_PAIR:return b.k+":"+e(b.v,c);case a.PREFIX_OPERATOR:return("typeof"===b.s?"typeof ":b.s)+e(b.o,c);case a.INFIX_OPERATOR:return e(b.o[0],c)+("in"===b.s.substr(0,2)?" "+b.s+" ":b.s)+e(b.o[1],c);case a.INVOCATION:return e(b.x,c)+"("+(b.o?b.o.map(d).join(","):"")+")";case a.BRACKETED:return"("+e(b.x,c)+")";case a.MEMBER:return e(b.x,c)+e(b.r,c);case a.REFINEMENT:return b.n?"."+b.n:"["+e(b.x,c)+"]";case a.CONDITIONAL:return e(b.o[0],c)+"?"+e(b.o[1],c)+":"+e(b.o[2],c);case a.REFERENCE:return"${"+c.indexOf(b.n)+"}";default:throw new Error("Could not stringify expression token. This error is unexpected")}},c}(k,w),fd=function(a,b){var c=function(c,d){this.type=c.type===a.TRIPLE?a.TRIPLE:c.mustacheType,c.ref&&(this.ref=c.ref),c.expression&&(this.expr=new b(c.expression)),d.pos+=1};return c.prototype={toJSON:function(){var a;return this.json?this.json:(a={t:this.type},this.ref&&(a.r=this.ref),this.expr&&(a.x=this.expr.toJSON()),this.json=a,a)},toString:function(){return!1}},c}(k,ed),gd=function(){return function(a){var b,c,d,e="";if(!a)return"";for(c=0,d=a.length;d>c;c+=1){if(b=a[c].toString(),b===!1)return!1;e+=b}return e}}(),hd=function(a){return function(b,c){var d,e;return c||(d=a(b),d===!1)?e=b.map(function(a){return a.toJSON(c)}):d}}(gd),id=function(a,b,c){var d=function(b,d){var e;for(this.ref=b.ref,this.indexRef=b.indexRef,this.inverted=b.mustacheType===a.INVERTED,b.expression&&(this.expr=new c(b.expression)),d.pos+=1,this.items=[],e=d.next();e;){if(e.mustacheType===a.CLOSING){if(e.ref.trim()===this.ref||this.expr){d.pos+=1;break}throw new Error("Could not parse template: Illegal closing section")}this.items[this.items.length]=d.getStub(),e=d.next()}};return d.prototype={toJSON:function(c){var d;return this.json?this.json:(d={t:a.SECTION},this.ref&&(d.r=this.ref),this.indexRef&&(d.i=this.indexRef),this.inverted&&(d.n=!0),this.expr&&(d.x=this.expr.toJSON()),this.items.length&&(d.f=b(this.items,c)),this.json=d,d)},toString:function(){return!1}},d}(k,hd,ed),jd=function(a,b,c){return function(d){return d.type===a.MUSTACHE||d.type===a.TRIPLE?d.mustacheType===a.SECTION||d.mustacheType===a.INVERTED?new c(d,this):new b(d,this):void 0}}(k,fd,id),kd=function(){return{li:["li"],dt:["dt","dd"],dd:["dt","dd"],p:"address article aside blockquote dir div dl fieldset footer form h1 h2 h3 h4 h5 h6 header hgroup hr menu nav ol p pre section table ul".split(" "),rt:["rt","rp"],rp:["rp","rt"],optgroup:["optgroup"],option:["option","optgroup"],thead:["tbody","tfoot"],tbody:["tbody","tfoot"],tr:["tr"],td:["td","th"],th:["td","th"]}}(),ld=function(a){function b(c){var d,e;if("object"!=typeof c)return c;if(a(c))return c.map(b);d={};for(e in c)c.hasOwnProperty(e)&&(d[e]=b(c[e]));return d}return function(a){var c,d,e,f,g,h;for(e={},c=[],d=[],g=a.length,f=0;g>f;f+=1)if(h=a[f],"intro"===h.name){if(e.intro)throw new Error("An element can only have one intro transition");
e.intro=h}else if("outro"===h.name){if(e.outro)throw new Error("An element can only have one outro transition");e.outro=h}else if("intro-outro"===h.name){if(e.intro||e.outro)throw new Error("An element can only have one intro and one outro transition");e.intro=h,e.outro=b(h)}else"proxy-"===h.name.substr(0,6)?(h.name=h.name.substring(6),d[d.length]=h):"on-"===h.name.substr(0,3)?(h.name=h.name.substring(3),d[d.length]=h):"decorator"===h.name?e.decorator=h:c[c.length]=h;return e.attrs=c,e.proxies=d,e}}(l),md=function(a,b){return function(c){var d,e,f,g,h,i,j,k;for(h=function(){throw new Error("Illegal directive")},c.name&&c.value||h(),d={directiveType:c.name},e=c.value,i=[],j=[];e.length;)if(f=e.shift(),f.type===a.TEXT){if(g=f.value.indexOf(":"),-1!==g){g&&(i[i.length]={type:a.TEXT,value:f.value.substr(0,g)}),f.value.length>g+1&&(j[0]={type:a.TEXT,value:f.value.substring(g+1)});break}i[i.length]=f}else i[i.length]=f;return j=j.concat(e),d.name=1===i.length&&i[0].type===a.TEXT?i[0].value:i,j.length&&(1===j.length&&j[0].type===a.TEXT?(k=b("["+j[0].value+"]"),d.args=k?k.value:j[0].value):d.dynamicArgs=j),d}}(k,Xb),nd=function(a,b){var c;return c=function(a,b){var c;for(this.tokens=a||[],this.pos=0,this.options=b,this.result=[];c=this.getStub();)this.result.push(c)},c.prototype={getStub:function(){var a=this.next();return a?this.getText(a)||this.getMustache(a):null},getText:a,getMustache:b,next:function(){return this.tokens[this.pos]}},c}(bd,jd),od=function(a,b,c){var d;return d=function(b){var c=new a(b);this.stubs=c.result},d.prototype={toJSON:function(a){var b;return this["json_"+a]?this["json_"+a]:b=this["json_"+a]=c(this.stubs,a)},toString:function(){return void 0!==this.str?this.str:(this.str=b(this.stubs),this.str)}},d}(nd,gd,hd),pd=function(a){return function(b){var c,d;if("string"==typeof b.name){if(!b.args&&!b.dynamicArgs)return b.name;d=b.name}else d=new a(b.name).toJSON();return c={n:d},b.args?(c.a=b.args,c):(b.dynamicArgs&&(c.d=new a(b.dynamicArgs).toJSON()),c)}}(od),qd=function(a,b,c){return function(d){var e,f,g,h,i,j,k;if(this["json_"+d])return this["json_"+d];if(e=this.component?{t:a.COMPONENT,e:this.component}:{t:a.ELEMENT,e:this.tag},this.doctype&&(e.y=1),this.attributes&&this.attributes.length)for(e.a={},j=this.attributes.length,i=0;j>i;i+=1){if(k=this.attributes[i],f=k.name,e.a[f])throw new Error("You cannot have multiple attributes with the same name");g=null===k.value?null:k.value.toJSON(d),e.a[f]=g}if(this.items&&this.items.length&&(e.f=b(this.items,d)),this.proxies&&this.proxies.length)for(e.v={},j=this.proxies.length,i=0;j>i;i+=1)h=this.proxies[i],e.v[h.directiveType]=c(h);return this.intro&&(e.t1=c(this.intro)),this.outro&&(e.t2=c(this.outro)),this.decorator&&(e.o=c(this.decorator)),this["json_"+d]=e,e}}(k,hd,pd),rd=function(a,b){var c;return c="a abbr acronym address applet area b base basefont bdo big blockquote body br button caption center cite code col colgroup dd del dfn dir div dl dt em fieldset font form frame frameset h1 h2 h3 h4 h5 h6 head hr html i iframe img input ins isindex kbd label legend li link map menu meta noframes noscript object ol p param pre q s samp script select small span strike strong style sub sup textarea title tt u ul var article aside audio bdi canvas command data datagrid datalist details embed eventsource figcaption figure footer header hgroup keygen mark meter nav output progress ruby rp rt section source summary time track video wbr".split(" "),function(){var d,e,f,g,h,i,j,k;if(void 0!==this.str)return this.str;if(this.component)return this.str=!1;if(-1===c.indexOf(this.tag.toLowerCase()))return this.str=!1;if(this.proxies||this.intro||this.outro||this.decorator)return this.str=!1;if(j=a(this.items),j===!1)return this.str=!1;if(k=-1!==b.indexOf(this.tag.toLowerCase()),d="<"+this.tag,this.attributes)for(e=0,f=this.attributes.length;f>e;e+=1){if(h=this.attributes[e].name,-1!==h.indexOf(":"))return this.str=!1;if("id"===h||"intro"===h||"outro"===h)return this.str=!1;if(g=" "+h,null!==this.attributes[e].value){if(i=this.attributes[e].value.toString(),i===!1)return this.str=!1;""!==i&&(g+="=",g+=/[\s"'=<>`]/.test(i)?'"'+i.replace(/"/g,"&quot;")+'"':i)}d+=g}return this.selfClosing&&!k?(d+="/>",this.str=d):(d+=">",k?this.str=d:(d+=j,d+="</"+this.tag+">",this.str=d))}}(gd,pc),sd=function(a,b,c,d,e,f,g,h,i,j,k){var l,m,n,o,p,q=/^\s+/,r=/\s+$/;return l=function(d,e,i){var j,l,m,n,o,s,t;if(e.pos+=1,s=function(a){return{name:a.name,value:a.value?new k(a.value):null}},this.tag=d.name,t=d.name.toLowerCase(),"rv-"===t.substr(0,3)&&(c('The "rv-" prefix for components has been deprecated. Support will be removed in a future version'),this.tag=this.tag.substring(3)),i=i||"pre"===t,d.attrs&&(m=g(d.attrs),l=m.attrs,n=m.proxies,e.options.sanitize&&e.options.sanitize.eventAttributes&&(l=l.filter(p)),l.length&&(this.attributes=l.map(s)),n.length&&(this.proxies=n.map(h)),m.intro&&(this.intro=h(m.intro)),m.outro&&(this.outro=h(m.outro)),m.decorator&&(this.decorator=h(m.decorator))),d.doctype&&(this.doctype=!0),d.selfClosing&&(this.selfClosing=!0),-1!==b.indexOf(t)&&(this.isVoid=!0),!this.selfClosing&&!this.isVoid){for(this.siblings=f[t],this.items=[],j=e.next();j&&j.mustacheType!==a.CLOSING;){if(j.type===a.TAG){if(j.closing){j.name.toLowerCase()===t&&(e.pos+=1);break}if(this.siblings&&-1!==this.siblings.indexOf(j.name.toLowerCase()))break}this.items[this.items.length]=e.getStub(),j=e.next()}i||(o=this.items[0],o&&o.type===a.TEXT&&(o.text=o.text.replace(q,""),o.text||this.items.shift()),o=this.items[this.items.length-1],o&&o.type===a.TEXT&&(o.text=o.text.replace(r,""),o.text||this.items.pop()))}},l.prototype={toJSON:i,toString:j},m="a abbr acronym address applet area b base basefont bdo big blockquote body br button caption center cite code col colgroup dd del dfn dir div dl dt em fieldset font form frame frameset h1 h2 h3 h4 h5 h6 head hr html i iframe img input ins isindex kbd label legend li link map menu meta noframes noscript object ol p param pre q s samp script select small span strike strong style sub sup textarea title tt u ul var article aside audio bdi canvas command data datagrid datalist details embed eventsource figcaption figure footer header hgroup keygen mark meter nav output progress ruby rp rt section source summary time track video wbr".split(" "),n="li dd rt rp optgroup option tbody tfoot tr td th".split(" "),o=/^on[a-zA-Z]/,p=function(a){var b=!o.test(a.name);return b},l}(k,pc,I,jc,gd,kd,ld,md,qd,rd,od),td=function(a,b){return function(a){return this.options.sanitize&&this.options.sanitize.elements&&-1!==this.options.sanitize.elements.indexOf(a.name.toLowerCase())?null:new b(a,this)}}(k,sd),ud=function(a,b,c,d,e){var f;return f=function(a,b){var c,d;for(this.tokens=a||[],this.pos=0,this.options=b,this.preserveWhitespace=b.preserveWhitespace,d=[];c=this.getStub();)d.push(c);this.result=e(d)},f.prototype={getStub:function(){var a=this.next();return a?this.getText(a)||this.getComment(a)||this.getMustache(a)||this.getElement(a):null},getText:a,getComment:b,getMustache:c,getElement:d,next:function(){return this.tokens[this.pos]}},f}(bd,dd,jd,td,hd),vd=function(a,b,c){var d,e,f,g,h;return e=/^\s*$/,f=/<!--\s*\{\{\s*>\s*([a-zA-Z_$][a-zA-Z_$0-9]*)\s*}\}\s*-->/,g=/<!--\s*\{\{\s*\/\s*([a-zA-Z_$][a-zA-Z_$0-9]*)\s*}\}\s*-->/,d=function(d,g){var i,j,k;return g=g||{},f.test(d)?h(d,g):(g.sanitize===!0&&(g.sanitize={elements:"applet base basefont body frame frameset head html isindex link meta noframes noscript object param script style title".split(" "),eventAttributes:!0}),i=a(d,g),g.preserveWhitespace||(k=i[0],k&&k.type===b.TEXT&&e.test(k.value)&&i.shift(),k=i[i.length-1],k&&k.type===b.TEXT&&e.test(k.value)&&i.pop()),j=new c(i,g).result,"string"==typeof j?[j]:j)},h=function(a,b){var c,e,h,i,j,k;for(h={},c="",e=a;j=f.exec(e);){if(i=j[1],c+=e.substr(0,j.index),e=e.substring(j.index+j[0].length),k=g.exec(e),!k||k[1]!==i)throw new Error("Inline partials must have a closing delimiter, and cannot be nested");h[i]=d(e.substr(0,k.index),b),e=e.substring(k.index+k[0].length)}return{main:d(c,b),partials:h}},d}(_c,k,ud),wd=function(a,b,c,d,e,f){var g,h,i,j;return g=function(d,g){var k,l,m;if(l=i(d,g))return l;if(b&&(k=document.getElementById(g),k&&"SCRIPT"===k.tagName)){if(!f)throw new Error(a.missingParser);h(f(k.innerHTML),g,e)}if(l=e[g],!l){if(m='Could not find descriptor for partial "'+g+'"',d.debug)throw new Error(m);return c(m),[]}return j(l)},i=function(b,c){var d;if(b.partials[c]){if("string"==typeof b.partials[c]){if(!f)throw new Error(a.missingParser);d=f(b.partials[c],b.parseOptions),h(d,c,b.partials)}return j(b.partials[c])}},h=function(a,b,c){var e;if(d(a)){c[b]=a.main;for(e in a.partials)a.partials.hasOwnProperty(e)&&(c[e]=a.partials[e])}else c[b]=a},j=function(a){return 1===a.length&&"string"==typeof a[0]?a[0]:a},g}(xc,f,I,w,yc,vd),xd=function(a,b,c){var d,e;return c.push(function(){e=c.DomFragment}),d=function(c,d){var f,g=this.parentFragment=c.parentFragment;if(this.type=a.PARTIAL,this.name=c.descriptor.r,this.index=c.index,!c.descriptor.r)throw new Error("Partials must have a static reference (no expressions). This may change in a future version of Ractive.");f=b(g.root,c.descriptor.r),this.fragment=new e({descriptor:f,root:g.root,pNode:g.pNode,contextStack:g.contextStack,owner:this}),d&&d.appendChild(this.fragment.docFrag)},d.prototype={firstNode:function(){return this.fragment.firstNode()},findNextNode:function(){return this.parentFragment.findNextNode(this)},detach:function(){return this.fragment.detach()},teardown:function(a){this.fragment.teardown(a)},toString:function(){return this.fragment.toString()},find:function(a){return this.fragment.find(a)},findAll:function(a,b){return this.fragment.findAll(a,b)},findComponent:function(a){return this.fragment.findComponent(a)},findAllComponents:function(a,b){return this.fragment.findAllComponents(a,b)}},d}(k,wd,Eb),yd=function(a){var b=function(b,c,d){this.parentFragment=b.parentFragment,this.component=b,this.key=c,this.fragment=new a({descriptor:d,root:b.root,owner:this,contextStack:b.parentFragment.contextStack}),this.selfUpdating=this.fragment.isSimple(),this.value=this.fragment.getValue()};return b.prototype={bubble:function(){this.selfUpdating?this.update():!this.deferred&&this.ready&&(this.root._deferred.attrs.push(this),this.deferred=!0)},update:function(){var a=this.fragment.getValue();this.component.instance.set(this.key,a),this.value=a},teardown:function(){this.fragment.teardown()}},b}(ac),zd=function(a,b,c,d){function e(e,f,g,h){var i,j,k,l,m;return k=e.root,l=e.parentFragment,"string"==typeof g?(j=b(g),j?j.value:g):null===g?!0:1===g.length&&g[0].t===a.INTERPOLATOR&&g[0].r?l.indexRefs&&void 0!==l.indexRefs[g[0].r]?l.indexRefs[g[0].r]:(m=c(k,g[0].r,l.contextStack)||g[0].r,h.push({childKeypath:f,parentKeypath:m}),k.get(m)):(i=new d(e,f,g),e.complexParameters.push(i),i.value)}return function(a,b,c){var d,f,g;d={},a.complexParameters=[];for(f in b)b.hasOwnProperty(f)&&(g=e(a,f,b[f],c),void 0!==g&&(d[f]=g));return d}}(k,Xb,y,yd),Ad=function(){return function(a,b,c,d,e){var f,g,h,i;return g=a.parentFragment,i=a.root,h={content:e||[]},f=new b({el:g.pNode.cloneNode(!1),data:c,partials:h,_parent:i,adaptors:i.adaptors}),f.component=a,a.instance=f,f.insert(d),f.fragment.pNode=g.pNode,f}}(),Bd=function(){function a(a,c,d){var e,f,g,h,i,j,k;e=a.root,f=a.instance,i=a.observers,j=e.observe(c,function(a){g||e._wrapped[c]||(h=!0,f.set(d,a),h=!1)},b),i.push(j),f.twoway&&(j=f.observe(d,function(a){h||(g=!0,e.set(c,a),g=!1)},b),i.push(j),k=f.get(d),void 0!==k&&e.set(c,k))}var b={init:!1,debug:!0};return function(b,c){var d,e;for(b.observers=[],e=c.length;e--;)d=c[e],a(b,d.parentKeypath,d.childKeypath)}}(),Cd=function(a){function b(b,d,e,f){if("string"!=typeof f){if(d.debug)throw new Error(c);return a(c),void 0}b.on(e,function(){var a=Array.prototype.slice.call(arguments);a.unshift(f),d.fire.apply(d,a)})}var c="Components currently only support simple events - you cannot include arguments. Sorry!";return function(a,c){var d;for(d in c)c.hasOwnProperty(d)&&b(a.instance,a.root,d,c[d])}}(I),Dd=function(){return function(a){var b,c;for(b=a.root;b;)(c=b._liveComponentQueries[a.name])&&c.push(a.instance),b=b._parent}}(),Ed=function(a,b,c,d,e,f,g){return function(h,i,j){var k,l,m,n,o;if(k=h.parentFragment=i.parentFragment,l=k.root,h.root=l,h.type=a.COMPONENT,h.name=i.descriptor.e,h.index=i.index,h.observers=[],m=l.components[i.descriptor.e],!m)throw new Error('Component "'+i.descriptor.e+'" not found');o=[],n=c(h,i.descriptor.a,o),d(h,m,n,j,i.descriptor.f),e(h,o),f(h,i.descriptor.v),(i.descriptor.t1||i.descriptor.t2||i.descriptor.o)&&b('The "intro", "outro" and "decorator" directives have no effect on components'),g(h)}}(k,I,zd,Ad,Bd,Cd,Dd),Fd=function(a){var b=function(b,c){a(this,b,c)};return b.prototype={firstNode:function(){return this.instance.fragment.firstNode()},findNextNode:function(){return this.parentFragment.findNextNode(this)},detach:function(){return this.instance.fragment.detach()},teardown:function(){for(var a;this.complexParameters.length;)this.complexParameters.pop().teardown();for(;this.observers.length;)this.observers.pop().cancel();(a=this.root._liveComponentQueries[this.name])&&a._remove(this),this.instance.teardown()},toString:function(){return this.instance.fragment.toString()},find:function(a){return this.instance.fragment.find(a)},findAll:function(a,b){return this.instance.fragment.findAll(a,b)},findComponent:function(a){return a&&a!==this.name?null:this.instance},findAllComponents:function(a,b){b._test(this,!0),this.instance.fragment&&this.instance.fragment.findAllComponents(a,b)}},b}(Ed),Gd=function(a){var b=function(b,c){this.type=a.COMMENT,this.descriptor=b.descriptor,c&&(this.node=document.createComment(b.descriptor.f),c.appendChild(this.node))};return b.prototype={detach:function(){return this.node.parentNode.removeChild(this.node),this.node},teardown:function(a){a&&this.detach()},firstNode:function(){return this.node},toString:function(){return"<!--"+this.descriptor.f+"-->"}},b}(k),Hd=function(a,b,c,d,e,f,g,h,i,j,k,l,m){var n=function(a){a.pNode&&(this.docFrag=document.createDocumentFragment()),"string"==typeof a.descriptor?(this.html=a.descriptor,this.docFrag&&(this.nodes=d(this.html,a.pNode.tagName,this.docFrag))):c(this,a)};return n.prototype={detach:function(){var a,b;if(this.nodes)for(b=this.nodes.length;b--;)this.docFrag.appendChild(this.nodes[b]);else if(this.items)for(a=this.items.length,b=0;a>b;b+=1)this.docFrag.appendChild(this.items[b].detach());return this.docFrag},createItem:function(b){if("string"==typeof b.descriptor)return new e(b,this.docFrag);switch(b.descriptor.t){case a.INTERPOLATOR:return new f(b,this.docFrag);case a.SECTION:return new g(b,this.docFrag);case a.TRIPLE:return new h(b,this.docFrag);case a.ELEMENT:return this.root.components[b.descriptor.e]?new k(b,this.docFrag):new i(b,this.docFrag);case a.PARTIAL:return new j(b,this.docFrag);case a.COMMENT:return new l(b,this.docFrag);default:throw new Error("Something very strange happened. Please file an issue at https://github.com/RactiveJS/Ractive/issues. Thanks!")}},teardown:function(a){var b;if(this.nodes&&a)for(;b=this.nodes.pop();)b.parentNode.removeChild(b);else if(this.items)for(;this.items.length;)this.items.pop().teardown(a);this.nodes=this.items=this.docFrag=null},firstNode:function(){return this.items&&this.items[0]?this.items[0].firstNode():this.nodes?this.nodes[0]||null:null},findNextNode:function(a){var b=a.index;return this.items[b+1]?this.items[b+1].firstNode():this.owner===this.root?this.owner.component?this.owner.component.findNextNode():null:this.owner.findNextNode(this)},toString:function(){var a,b,c,d;if(this.html)return this.html;if(a="",!this.items)return a;for(c=this.items.length,b=0;c>b;b+=1)d=this.items[b],a+=d.toString();return a},find:function(a){var c,d,e,f,g;if(this.nodes){for(d=this.nodes.length,c=0;d>c;c+=1)if(f=this.nodes[c],1===f.nodeType){if(b(f,a))return f;if(g=f.querySelector(a))return g}return null}if(this.items){for(d=this.items.length,c=0;d>c;c+=1)if(e=this.items[c],e.find&&(g=e.find(a)))return g;return null}},findAll:function(a,c){var d,e,f,g,h,i,j;if(this.nodes){for(e=this.nodes.length,d=0;e>d;d+=1)if(g=this.nodes[d],1===g.nodeType&&(b(g,a)&&c.push(g),h=g.querySelectorAll(a)))for(i=h.length,j=0;i>j;j+=1)c.push(h[j])}else if(this.items)for(e=this.items.length,d=0;e>d;d+=1)f=this.items[d],f.findAll&&f.findAll(a,c);return c},findComponent:function(a){var b,c,d,e;if(this.items){for(b=this.items.length,c=0;b>c;c+=1)if(d=this.items[c],d.findComponent&&(e=d.findComponent(a)))return e;return null}},findAllComponents:function(a,b){var c,d,e;if(this.items)for(d=this.items.length,c=0;d>c;c+=1)e=this.items[c],e.findAllComponents&&e.findAllComponents(a,b);return b}},m.DomFragment=n,n}(k,Z,kb,lb,mb,zb,Fb,Gb,wc,xd,Fd,Gd,Eb),Id=function(a,b,c,d,e){return function(a,f){var g;if(!this._initing)throw new Error("You cannot call ractive.render() directly!");this._transitionManager=g=b(this,f),this.fragment=new e({descriptor:this.template,root:this,owner:this,pNode:a}),c(this),a&&a.appendChild(this.fragment.docFrag),d(this),this._transitionManager=null,g.ready(),this.rendered=!0}}(jb,q,o,p,Hd),Jd=function(a){return function(){return a("renderHTML() has been deprecated and will be removed in a future version. Please use toHTML() instead"),this.toHTML()}}(I),Kd=function(){return function(){return this.fragment.toString()}}(),Ld=function(a,b){return function(c){var d,e,f;for(this.fire("teardown"),f=this._transitionManager,this._transitionManager=e=a(this,c),this.fragment.teardown(!0);this._animations[0];)this._animations[0].stop();for(d in this._cache)b(this,d);this._transitionManager=f,e.ready()}}(q,m),Md=function(a){return function(b,c,d){var e;if("string"==typeof c&&a(d)){if(e=b.get(c),void 0===e&&(e=0),a(e))b.set(c,e+d);else if(b.debug)throw new Error("Cannot add to a non-numeric value")}else if(b.debug)throw new Error("Bad arguments")}}(J),Nd=function(a){return function(b,c){a(this,b,void 0===c?1:c)}}(Md),Od=function(a){return function(b,c){a(this,b,void 0===c?-1:-c)}}(Md),Pd=function(){return function(a){var b;if("string"==typeof a)b=this.get(a),this.set(a,!b);else if(this.debug)throw new Error("Bad arguments")}}(),Qd=function(){return function(a,b){var c,d,e,f,g;return c={},e=0,d=function(a,d){var f,h,i;h=e,i=b.length;do{if(f=b.indexOf(a,h),-1===f)return g=!0,-1;h=f+1}while(c[f]&&i>h);return f===e&&(e+=1),f!==d&&(g=!0),c[f]=!0,f},f=a.map(d),f.unchanged=!g,f}}(),Rd=function(a){return function(b,c,d,e){var f,g;for(f=c.length;f--;)g=c[f],g.type===a.REFERENCE?g.update():g.keypath===b&&g.type===a.SECTION&&!g.inverted&&g.docFrag?d[d.length]=g:e[e.length]=g}}(k),Sd=function(a,b,c,d,e,f,g,h,i,j){function k(a){return JSON.stringify(a)}function l(a){return m[a]||(m[a]=function(b){return b[a]}),m[a]}var m={};return function(m,n,o){var p,q,r,s,t,u,v,w,x,y,z,A,B,C,D;if(p=this.get(m),!b(p)||!b(n))return this.set(m,n,o&&o.complete);if(t=p.length===n.length,o&&o.compare){if(o.compare===!0)s=k;else if("string"==typeof o.compare)s=l(o.compare);else{if("function"!=typeof o.compare)throw new Error("The `compare` option must be a function, or a string representing an identifying field (or `true` to use JSON.stringify)");s=o.compare}try{q=p.map(s),r=n.map(s)}catch(E){if(this.debug)throw E;a("Merge operation: comparison failed. Falling back to identity checking"),q=p,r=n}}else q=p,r=n;if(v=i(q,r),c(this,m),h(this,m,n),!v.unchanged||!t){for(B=this._transitionManager,this._transitionManager=A=f(this,o&&o.complete),w=[],x=[],u=0;u<this._deps.length;u+=1)if(y=this._deps[u],y&&(z=y[m])){for(j(m,z,w,x),d(this);w.length;)w.pop().merge(v);for(;x.length;)x.pop().update()}for(e(this),C=[],D=m.split(".");D.length;)D.pop(),C[C.length]=D.join(".");g.multiple(this,C,!0),q.length!==r.length&&g(this,m+".length",!0),this._transitionManager=B,A.ready()}}}(I,l,m,o,A,q,r,B,Qd,Rd),Td=function(){return function(){return this.fragment.detach()}}(),Ud=function(a){return function(b,c){if(b=a(b),c=a(c)||null,!b)throw new Error("You must specify a valid target to insert into");b.insertBefore(this.detach(),c),this.fragment.pNode=b}}(jb),Vd=function(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w){return{get:a,set:b,update:c,updateModel:d,animate:e,on:f,off:g,observe:h,fire:i,find:j,findAll:k,findComponent:l,findAllComponents:m,renderHTML:o,toHTML:p,render:n,teardown:q,add:r,subtract:s,toggle:t,merge:u,detach:v,insert:w}}(v,C,D,F,N,O,P,W,X,Y,gb,hb,ib,Id,Jd,Kd,Ld,Nd,Od,Pd,Sd,Td,Ud),Wd=function(){return["partials","transitions","events","components","decorators","data"]}(),Xd=function(){return["el","template","complete","modifyArrays","magic","twoway","lazy","append","preserveWhitespace","sanitize","stripComments","noIntro","transitionsEnabled","adaptors"]}(),Yd=function(a,b,c){return function(d,e){a.forEach(function(a){e[a]&&(d[a]=c(e[a]))}),b.forEach(function(a){d[a]=e[a]})}}(Wd,Xd,c),Zd=function(){return function(a,b){return/_super/.test(a)?function(){var c,d=this._super;return this._super=b,c=a.apply(this,arguments),this._super=d,c}:a}}(),$d=function(){return function(a,b){var c;for(c in b)b.hasOwnProperty(c)&&(a[c]=b[c]);return a}}(),_d=function(a,b,c,d){var e,f;return e=a.concat(b),f={},e.forEach(function(a){f[a]=!0}),function(e,g){var h,i;a.forEach(function(a){var b=g[a];b&&(e[a]?d(e[a],b):e[a]=b)}),b.forEach(function(a){var b=g[a];void 0!==b&&(e[a]="function"==typeof b&&"function"==typeof e[a]?c(b,e[a]):g[a])});for(h in g)g.hasOwnProperty(h)&&!f[h]&&(i=g[h],e.prototype[h]="function"==typeof i&&"function"==typeof e.prototype[h]?c(i,e.prototype[h]):i)}}(Wd,Xd,Zd,$d),ae=function(a,b){return function(c,d){a(c.template)&&(c.partials||(c.partials={}),b(c.partials,c.template.partials),d.partials&&b(c.partials,d.partials),c.template=c.template.main)}}(w,$d),be=function(a,b,c){return function(d){var e;if("string"==typeof d.template){if(!c)throw new Error(a.missingParser);if("#"===d.template.charAt(0)&&b){if(e=document.getElementById(d.template.substring(1)),!e||"SCRIPT"!==e.tagName)throw new Error("Could not find template element ("+d.template+")");d.template=c(e.innerHTML,d)}else d.template=c(d.template,d)}}}(xc,f,vd),ce=function(a,b){return function(c){var d;if(c.partials)for(d in c.partials)if(c.partials.hasOwnProperty(d)&&"string"==typeof c.partials[d]){if(!b)throw new Error(a.missingParser);c.partials[d]=b(c.partials[d],c)}}}(xc,vd),de=function(){return function(a){var b,c={};for(b in a)a.hasOwnProperty(b)&&(c[b]=a[b]);return c}}(),ee=function(){return function(a){for(var b,c,d=Array.prototype.slice.call(arguments,1);c=d.shift();)for(b in c)c.hasOwnProperty(b)&&(a[b]=c[b]);return a}}(),fe=function(a,b,c,d,e,f,g,h,i,j,k){var l,m,n,o;return l=function(){return{}},m=function(){return[]},n=d(null),g(n,{preserveWhitespace:{enumerable:!0,value:!1},append:{enumerable:!0,value:!1},twoway:{enumerable:!0,value:!0},modifyArrays:{enumerable:!0,value:!0},data:{enumerable:!0,value:l},lazy:{enumerable:!0,value:!1},debug:{enumerable:!0,value:!1},transitions:{enumerable:!0,value:l},decorators:{enumerable:!0,value:l},events:{enumerable:!0,value:l},noIntro:{enumerable:!0,value:!1},transitionsEnabled:{enumerable:!0,value:!0},magic:{enumerable:!0,value:!1},adaptors:{enumerable:!0,value:m}}),o=["components","decorators","events","partials","transitions","data"],function(l,m){var p,q,r,s;for(p in n)void 0===m[p]&&(m[p]="function"==typeof n[p]?n[p]():n[p]);if(g(l,{_initing:{value:!0,writable:!0},_guid:{value:"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(a){var b,c;return b=16*Math.random()|0,c="x"==a?b:3&b|8,c.toString(16)})},_subs:{value:d(null),configurable:!0},_cache:{value:{}},_cacheMap:{value:d(null)},_deps:{value:[]},_depsMap:{value:d(null)},_patternObservers:{value:[]},_pendingResolution:{value:[]},_deferred:{value:{}},_evaluators:{value:d(null)},_twowayBindings:{value:{}},_transitionManager:{value:null,writable:!0},_animations:{value:[]},nodes:{value:{}},_wrapped:{value:d(null)},_liveQueries:{value:[]},_liveComponentQueries:{value:[]}}),g(l._deferred,{attrs:{value:[]},evals:{value:[]},selectValues:{value:[]},checkboxes:{value:[]},radios:{value:[]},observers:{value:[]},transitions:{value:[]},liveQueries:{value:[]},decorators:{value:[]},focusable:{value:null,writable:!0}}),l.adaptors=m.adaptors,l.modifyArrays=m.modifyArrays,l.magic=m.magic,l.twoway=m.twoway,l.lazy=m.lazy,l.debug=m.debug,l.magic&&!j)throw new Error("Getters and setters (magic mode) are not supported in this browser");if(m._parent&&f(l,"_parent",{value:m._parent}),m.el&&(l.el=h(m.el),!l.el&&l.debug))throw new Error("Could not find container element");if(m.eventDefinitions&&(c("ractive.eventDefinitions has been deprecated in favour of ractive.events. Support will be removed in future versions"),m.events=m.eventDefinitions),o.forEach(function(a){l.constructor[a]?l[a]=e(d(l.constructor[a]||{}),m[a]):m[a]&&(l[a]=m[a])}),q=m.template,"string"==typeof q){if(!k)throw new Error(b.missingParser);if("#"===q.charAt(0)&&a){if(r=document.getElementById(q.substring(1)),!r)throw new Error("Could not find template element ("+q+")");s=k(r.innerHTML,m)}else s=k(q,m)}else s=q;i(s)&&(e(l.partials,s.partials),s=s.main),s&&1===s.length&&"string"==typeof s[0]&&(s=s[0]),l.template=s,e(l.partials,m.partials),l.parseOptions={preserveWhitespace:m.preserveWhitespace,sanitize:m.sanitize,stripComments:m.stripComments},l.transitionsEnabled=m.noIntro?!1:m.transitionsEnabled,a&&!l.el&&(l.el=document.createDocumentFragment()),l.el&&!m.append&&(l.el.innerHTML=""),l.render(l.el,m.complete),l.transitionsEnabled=m.transitionsEnabled,l._initing=!1}}(f,xc,I,c,ee,g,h,jb,w,t,vd),ge=function(a,b,c,d,e){return function(a,c,f){b.forEach(function(a){var b=f[a],e=c[a];"function"==typeof b&&"function"==typeof e?f[a]=d(b,e):void 0===b&&void 0!==e&&(f[a]=e)}),a.beforeInit&&a.beforeInit(f),e(a,f),a.init&&a.init(f)}}(kc,Xd,de,Zd,fe),he=function(a,b,c,d,e,f,g,h){var i;return h.push(function(){i=h.Ractive}),function(h){var i,j=this;return i=function(a){g(this,i,a||{})},i.prototype=a(j.prototype),i.prototype.constructor=i,b(i,j),c(i,h),e(i),d(i,h),f(i),i.extend=j.extend,i}}(c,Yd,_d,ae,be,ce,ge,Eb),ie=function(a,b,c,d,e,f,g,h,i,j,k){var l=function(a){j(this,a)};return c(l,{prototype:{value:d},partials:{value:e},adaptors:{value:f},easing:{value:g},transitions:{value:{}},events:{value:{}},components:{value:{}},decorators:{value:{}},svg:{value:a},VERSION:{value:"0.3.9"}}),l.eventDefinitions=l.events,l.prototype.constructor=l,l.delimiters=["{{","}}"],l.tripleDelimiters=["{{{","}}}"],l.extend=h,l.parse=i,k.Ractive=l,l}(b,c,h,Vd,yc,j,M,he,vd,fe,Eb),je=function(a,b){for("undefined"!=typeof window&&window.Node&&!window.Node.prototype.contains&&window.HTMLElement&&window.HTMLElement.prototype.contains&&(window.Node.prototype.contains=window.HTMLElement.prototype.contains);b.length;)b.pop()();return a}(ie,Eb);"undefined"!=typeof module&&module.exports?module.exports=je:"function"==typeof define&&define.amd?define(function(){return je}):a.Ractive=je}("undefined"!=typeof window?window:this);;

!function(a,b){"use strict";if("undefined"!=typeof module&&module.exports&&"function"==typeof require)b(require("ractive"));else if("function"==typeof define&&define.amd)define(["Ractive"],b);else{if(!a.Ractive)throw new Error("Could not find Ractive! It must be loaded before the Ractive-events-tap plugin");b(a.Ractive)}}("undefined"!=typeof window?window:this,function(a){"use strict";var b=function(a,b){var c,d,e,f,g;return f=5,g=400,c=function(c){var d,e,h,i,j,k,l;(void 0===c.which||1===c.which)&&(e=c.clientX,h=c.clientY,d=this,i=c.pointerId,j=function(a){a.pointerId==i&&(b({node:d,original:a}),l())},k=function(a){a.pointerId==i&&(Math.abs(a.clientX-e)>=f||Math.abs(a.clientY-h)>=f)&&l()},l=function(){a.removeEventListener("MSPointerUp",j,!1),document.removeEventListener("MSPointerMove",k,!1),document.removeEventListener("MSPointerCancel",l,!1),a.removeEventListener("pointerup",j,!1),document.removeEventListener("pointermove",k,!1),document.removeEventListener("pointercancel",l,!1),a.removeEventListener("click",j,!1),document.removeEventListener("mousemove",k,!1)},window.navigator.pointerEnabled?(a.addEventListener("pointerup",j,!1),document.addEventListener("pointermove",k,!1),document.addEventListener("pointercancel",l,!1)):window.navigator.msPointerEnabled?(a.addEventListener("MSPointerUp",j,!1),document.addEventListener("MSPointerMove",k,!1),document.addEventListener("MSPointerCancel",l,!1)):(a.addEventListener("click",j,!1),document.addEventListener("mousemove",k,!1)),setTimeout(l,g))},window.navigator.pointerEnabled?a.addEventListener("pointerdown",c,!1):window.navigator.msPointerEnabled?a.addEventListener("MSPointerDown",c,!1):a.addEventListener("mousedown",c,!1),d=function(c){var d,e,h,i,j,k,l,m;1===c.touches.length&&(i=c.touches[0],e=i.clientX,h=i.clientY,d=this,j=i.identifier,l=function(a){var c;c=a.changedTouches[0],c.identifier!==j&&m(),a.preventDefault(),b({node:d,original:a}),m()},k=function(a){var b;(1!==a.touches.length||a.touches[0].identifier!==j)&&m(),b=a.touches[0],(Math.abs(b.clientX-e)>=f||Math.abs(b.clientY-h)>=f)&&m()},m=function(){a.removeEventListener("touchend",l,!1),window.removeEventListener("touchmove",k,!1),window.removeEventListener("touchcancel",m,!1)},a.addEventListener("touchend",l,!1),window.addEventListener("touchmove",k,!1),window.addEventListener("touchcancel",m,!1),setTimeout(m,g))},a.addEventListener("touchstart",d,!1),("BUTTON"===a.tagName||"button"===a.type)&&(e=function(){var c,d;d=function(c){32===c.which&&b({node:a,original:c})},c=function(){a.removeEventListener("keydown",d,!1),a.removeEventListener("blur",c,!1)},a.addEventListener("keydown",d,!1),a.addEventListener("blur",c,!1)},a.addEventListener("focus",e,!1)),{teardown:function(){a.removeEventListener("pointerdown",c,!1),a.removeEventListener("MSPointerDown",c,!1),a.removeEventListener("mousedown",c,!1),a.removeEventListener("touchstart",d,!1),a.removeEventListener("focus",e,!1)}}};a.events.tap=b});