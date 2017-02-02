"use strict";
/**
 * @module utils
 */

module.exports = {
  optionals: function() {
    var args = arguments[0];
    var ops = Array.from(arguments).splice(1);
    var ret = [];
    for(var i = 0; i < ops.length; i++ ) {
      ret.push((i < args.length)?args[i]:ops[i]);
    }
    return ret;
  },

  merge: function(a, b) {
    for(var i in b) {
      a[i] = b[i];
    }

    return a;
  },

  requiredOptions: function(options, required) {
    var error = [];
    for(var n in required) {
      if ( !(n in options) ) {
        error.push(required[n])
      }
    }

    if ( error.length > 0 ) {
      return new Error(error.join('\n'));
    }

    return false;
  }
}
