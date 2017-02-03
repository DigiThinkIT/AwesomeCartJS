"use strict";
/**
 * @module utils
 */

module.exports = {
  sargs: function() {
    // usage:
    //   sargs(arguments, {arg: 'arg1', default: false}, {arg: 'arg2', required: 1})
    var args = arguments[0];
    // check if we have an arguments object and make it an array
    if ( Object.prototype.toString.call( args ) === '[object Arguments]' ) {
      args = Array.from(args)
    }
    var ops = Array.from(arguments).splice(1);
    var ret = {};
    for(var i in ops) {
      var op = ops[i]
      let value
      if ( args.constructor === Array ) {
        value = (i in args)?args[i]:op.default
      } else {
        value = (op.arg in args)?args[op.arg]:op.default
      }

      // allow merging objects
      if ( op.merge ) {
        if ( value === undefined ) {
          value = {}
        }

        value = Object.assign(op.merge, value)
      }

      // test if we have a value and throw errors
      if ( value === undefined ) {
        if ( op.required !== undefined ) {
          let err
          if ( op.required instanceof String ) {
            err = new Error(op.required)
          } else if ( op.required instanceof Error ) {
            err = op.required;
          } else {
            err = new Error(`Argument "${op.arg}" is required.`);
          }
          Error.captureStackTrace(err, module.exports.sargs)
          throw err
        }
      }

      ret[op.arg] = value
    }
    return ret;
  },

  hasClass: function(el, cls) {
    return (` ${el.className} `).indexOf(` ${cls} `) > -1
  },

  addClass: function(el, cls) {
    el.className += ` ${cls}`
  }
}
