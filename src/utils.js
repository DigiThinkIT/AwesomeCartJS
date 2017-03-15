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
  },

  hasAttr: function(el, attr) {
    return el.hasAttribute(attr)
  },

  getAttr: function(el, attr) {
    return el.getAttribute(attr)
  },

  setAttr: function(el, attr, value) {
    el.setAttribute(attr, value);
  },

  debug: {
    LEVEL: {
      NONE: 0,
      LOG: 1,
      INFO: 2,
      WARN: 3,
      ERROR: 4,
      DEBUG: 5
    },
    level: 0,
    group: function(label, fn) {
      var val = undefined;
      if ( console.group !== undefined ) {
        console.group(label);
        try {
          val = fn();
        } catch(ex) {
          module.exports.debug.error(ex);
          console.groupEnd();
          throw ex;
        }
        console.groupEnd();
      } else {
        try{
          val = fn();
        } catch(ex) {
          module.exports.debug.error(ex);
          console.groupEnd();
          throw ex;
        }
      }

      return val;
    },

    log: function() {
      if ( module.exports.debug.level >= module.exports.debug.LEVEL.LOG ) {
        if ( console.log !== undefined ) {
          console.log.apply(console, Array.from(arguments));
        }
      }
    },

    info: function() {
      if ( module.exports.debug.level >= module.exports.debug.LEVEL.INFO  ) {
        if ( console.log !== undefined ) {
          console.info.apply(console, Array.from(arguments));
        }
      }
    },

    error: function() {
      if ( module.exports.debug.level >= module.exports.debug.LEVEL.ERROR  ) {
        if ( console.error !== undefined ) {
          console.error.apply(console, Array.from(arguments));
        }
      }
    },

    warn: function() {
      if ( module.exports.debug.level >= module.exports.debug.LEVEL.WARN  ) {
        if ( console.warn !== undefined ) {
          console.warn.apply(console, Array.from(arguments));
        }
      }
    },

    debug: function() {
      if ( module.exports.debug.level >= module.exports.debug.LEVEL.DEBUG  ) {
        if ( console.debug !== undefined ) {
          console.debug.apply(console, Array.from(arguments));
        }
      }
    },

    table: function() {
      if ( module.exports.debug.level >= module.exports.debug.LEVEL.DEBUG  ) {
        if ( console.table !== undefined ) {
          console.table.apply(console, Array.from(arguments));
        }
      }
    }

  }

}
