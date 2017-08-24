"use strict";
/**
 * @module utils
 */

 const Promise = require('BlueBird')
const {htmlEncode, htmlDecode, queryEscape} = require('./html');
const EventEmitter = require('eventemitter2').EventEmitter2;
const debug = require('./debug');
var _required = {};

var xhrLib = {
	ajax: function(data) {
		return new Promise(function(resolve, reject) {
			var xhr = new XMLHttpRequest();

			if ( typeof data == "string" ) {
				data = {
					url: data
				}
			}

			if ( data.type === undefined ) {
				data.type = "GET";
			}

			if ( data.onprogress ) {
				if ( typeof data.onprogress.dispense == 'function' ) {
					data.onprogress = data.onprogress.dispense();
				}
			}

			xhr.open(data.type, data.url);

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

						if ( data.onprogress && data.onprogress.constructor == Progress ) {
							data.onprogress.ondone();
						}

						resolve({ body: response, xhr: xhr});
					}
					else {
						reject({ status: xhr.status, xhr: xhr});
					}
			};


			xhr.addEventListener("progress", function(evt) {
				var contentLength;

				if ( evt.lengthComputable ) {
						contentLength = evt.total;
				} else {
					contentLength = evt.target.getResponseHeader('x-decompressed-content-length');
				}

				if ( !contentLength ) {
					contentLength = evt.loaded * 2;
				}

				var percentComplete = evt.loaded / contentLength;

				if ( data.onprogress ) {
					if ( typeof data.onprogress.onprogress == 'function' ) {
						data.onprogress.onprogress(percentComplete, evt.loaded, contentLength);
					} else if (typeof data.onprogress == 'function' ){
						data.onprogress(percentComplete, evt.loaded, contentLength);
					}
				}

			}, false);

			if ( data.data === undefined ) {
				xhr.send();
			} else if ( typeof data.data == 'object') {
				xhr.send(JSON.stringify(data.data));
			} else {
				xhr.send(encodeURI(data.data));
			}

			return null;
		})
	},

	get: function(data) {
		if ( typeof data == "string" ) {
			data = {
				url: data
			}
		}

		data.type = "GET";
		return xhrLib.ajax(data);
	},

	post: function(data) {
		if ( typeof data == "string" ) {
			data = {
				url: data
			}
		}
		if ( !data.headers ) { data.headers = {} }
		if ( !('Content-Type' in data.headers) ) {
			data.headers['Content-Type'] = 'application/x-www-form-urlencoded';
		}

		data.type = "POST";
		return xhrLib.ajax(data);
	}

}

class Progress extends EventEmitter {
	constructor(tracker) {
		super();

		this.tracker = tracker;
		this.loaded = 0;
		this.total = 0;
		this.percent = 0;
	}

	onprogress(percent, loaded, total) {
		this.percent = percent;
		this.loaded = loaded;
		this.total = total;
		this.emit("progress", this, percent, loaded, total);
	}

	ondone() {
		this.percent = 1;
		this.loaded = this.total;
		this.emit("done", this, this.percent, this.loaded, this.total);
	}
}

class ProgressTracker extends EventEmitter {
	constructor() {
		super();
		this.children = [];
		this.isDone = false;
	}

	_onChildProgress() {
		var averageComplete=0;
		var allTotal = 0;
		var allLoaded = 0;
		for(var i=0; i < this.children.length; i++) {
			var child = this.children[i];
			averageComplete += child.percent;
			allTotal = child.total;
			allLoaded = child.loaded;
		}
		averageComplete /= this.children.length;

		this.percent = averageComplete;
		this.loaded = allLoaded;
		this.total = allTotal;

		this.emit("progress", this, this.percent, this.loaded, this.total);

		if ( this.percent >= 1 ) {
			this.isDone = true;
			this.emit("done", this, this.percent, this.loaded, this.total);
		} else {
			this.isDone = false;
		}
	}

	dispense() {
		var p = new Progress(this);
		this.children.push(p);
		p.on('progress', this._onChildProgress.bind(this));
		p.on('done', this._onChildProgress.bind(this));
		this.isDone = false;

		return p;
	}
}

module.exports = {
	xhr: xhrLib,

	ProgressTracker: ProgressTracker,

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

  /**
	 * Helper utility to wrap an existing function with a before and after fn.
	 * The before fn takes the same arguments as fn.
	 * The after fn takes the fn's result and arguments(as an array) and MUST
	 * return a result value to override the fn's own result value.
	 */
	wrap: function(base, before, fn, after) {
		if ( !fn ) {
			fn = function() {};
		}

		return function() {
			if ( before ) {
				before.apply(base, arguments);
			}

			var result = fn.apply(base, arguments);

			if ( after ) {
				result = after.apply(base, result, arguments);
			}
			return result;
		};
	},

	require: function(url) {

		var requestData = null;
		if ( typeof url == "object" ) {
			requestData = url;
			url = requestData.url;
		} else {
			requestData = { url: url };
		}

		if ( url in _required ) {
			return _required[url];
		}

		_required[url] = xhrLib.get(requestData)
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
