/**
 * Core file for Legislature tracker.
 *
 * Namespaces LT and allows for no conflict function.
 */
var LT;
var originalLT;

if (typeof exports !== undefined + '') {
  LT = exports;
}
else {
  originalLT = window.LT;
  LT = {};

  LT.noConflict = function() {
    window.LT = originalLT;
    return this;
  };

  window.LT = LT;
}