"use strict";
/**
 * @module utils
 */

const {htmlEncode, htmlDecode, queryEscape} = require('./html');
const debug = require('./debug');
var _required = {};

var xhrLib = {
  get: function(data, callback) {
    var xhr = new XMLHttpRequest();

    if ( typeof data == "string" ) {
      data = {
        url: data
      }
    }

    xhr.open('GET', data.url);

    if ( data.headers ) {
      for(var k in data.headers) {
        xhr.setRequestHeader(k, data.headers[k]);
      }
    }
    xhr.onload = function() {
        if (xhr.status === 200) {
          var response = xhr.responseText;
          if ( data.type && data.type.toLowerCase() == 'json' ) {
            response = JSON.parse(xhr.responseText);
          }
          callback(null, { body: response, xhr: xhr});
        }
        else {
          callback(xhr.status, null, xhr);
        }
    };
    xhr.send();
  },
  post: function(data, callback) {
    var xhr = new XMLHttpRequest();

    if ( typeof data == "string" ) {
      data = {
        url: data
      }
    }

    xhr.open('POST', data.url);
    if ( !data.headers ) { data.headers = {} }
    if ( 'Content-Type' in data.headers ) {
      data.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    for(var k in data.headers) {
      xhr.setRequestHeader(k, data.headers[k]);
    }

    xhr.onload = function() {
      if (xhr.status === 200) {
        var response = xhr.responseText;
        if ( data.type && data.type.toLowerCase() == 'json' ) {
          response = JSON.parse(xhr.responseText);
        }
        callback(null, { body: response, xhr: xhr });
      }
      else {
        callback(xhr.status, null, xhr);
      }
    };

    if ( typeof data.data == 'object') {
      xhr.send(JSON.stringify(data.data));
    } else {
      xhr.send(encodeURI(data.data));
    }
  }

}

module.exports = {
  xhr: xhrLib,

  /**
   * Low quality guid using Math.random.
   * Only use if you are sure you don't need high quality randomness
   */
  uuid: function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  },

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

	require: function(url) {
		 if ( url in _required ) {
			 return _required[url];
		 }

		_required[url] = module.exports.get(url)
			.then((data) => {
				var el, ext = url.split('.').splice(-1);
				if ( ext == "js" ) {
					el = document.createElement('script');
				} else if ( ext == "css" ) {
					el = document.createElement('style');
				} else if ( ext == "json" ) {
					data = JSON.parse(data.body);
				}

				if ( el ) {
					el.appendChild(document.createTextNode(data.body));
					document.getElementsByTagName('head')[0].appendChild(el);
				}
				return data;
			});
		 return _required[url];
	}
}
