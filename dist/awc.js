(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.awc = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

module.exports = {
  log: function log() {
    console.log.apply(console, arguments);
  },
  error: function error() {
    console.error.apply(console, arguments);
  }

};

},{}],2:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('./debug'),
    log = _require.log,
    error = _require.error;

var _require2 = require('./utils'),
    optionals = _require2.optionals,
    merge = _require2.merge;

var EventEmitter = require('events').EventEmitter;

var StoreAdapter = function (_EventEmitter) {
  _inherits(StoreAdapter, _EventEmitter);

  function StoreAdapter() {
    _classCallCheck(this, StoreAdapter);

    return _possibleConstructorReturn(this, (StoreAdapter.__proto__ || Object.getPrototypeOf(StoreAdapter)).call(this));
  }

  _createClass(StoreAdapter, [{
    key: 'getCurrency',
    value: function getCurrency() {
      return null;
    }
  }, {
    key: 'getCurrencySymbol',
    value: function getCurrencySymbol() {
      return null;
    }
  }, {
    key: 'formatCurrency',
    value: function formatCurrency(currency) {
      return null;
    }
  }, {
    key: 'searchProduct',
    value: function searchProduct(term) {
      return null;
    }
  }, {
    key: 'fetchProductSKUs',
    value: function fetchProductSKUs() {
      return null;
    }
  }, {
    key: 'fetchProductDetail',
    value: function fetchProductDetail(sku) {
      return null;
    }
  }]);

  return StoreAdapter;
}(EventEmitter);

var DemoStoreaAdapter = function (_StoreAdapter) {
  _inherits(DemoStoreaAdapter, _StoreAdapter);

  function DemoStoreaAdapter() {
    _classCallCheck(this, DemoStoreaAdapter);

    var _this2 = _possibleConstructorReturn(this, (DemoStoreaAdapter.__proto__ || Object.getPrototypeOf(DemoStoreaAdapter)).call(this));

    _this2._products = {
      "sku001": {
        name: "Demo Item1",
        price: 10
      }
    };
    return _this2;
  }

  _createClass(DemoStoreaAdapter, [{
    key: 'getCurrency',
    value: function getCurrency() {
      return "USD";
    }
  }, {
    key: 'getCurrencySymbol',
    value: function getCurrencySymbol() {
      return "$";
    }
  }, {
    key: 'formatCurrency',
    value: function formatCurrency(currency, decimals) {
      return '$' + currency.toFixed(decimals);
    }
  }, {
    key: 'searchProduct',
    value: function searchProduct(term) {
      return null;
    }
  }, {
    key: 'fetchProducts',
    value: function fetchProducts(tags) {
      return new Promise(function (resolve, reject) {
        var products = [];
        for (var i in this._products) {
          var prod = this._products[i];
          if (prod.tags.every(function (elem) {
            return tags.indexOf(elem) >= -1;
          })) {
            products.push(prod);
          }
        }
        resolve(products);
      }.bind(this));
    }
  }, {
    key: 'fetchProductDetail',
    value: function fetchProductDetail(sku) {
      return null;
    }
  }]);

  return DemoStoreaAdapter;
}(StoreAdapter);

var AwesomeCart = function (_EventEmitter2) {
  _inherits(AwesomeCart, _EventEmitter2);

  function AwesomeCart() {
    _classCallCheck(this, AwesomeCart);

    var _this3 = _possibleConstructorReturn(this, (AwesomeCart.__proto__ || Object.getPrototypeOf(AwesomeCart)).call(this));

    var args = optionals(arguments, {});
    var options = args[0];

    _this3.options = merge({
      storeAdapter: module.exports.default_store_adapter || new DemoStoreaAdapter(),
      currency_decimals: 2
    }, options);
    _this3.cart = [];

    _this3.storeAdapter = _this3.options.storeAdapter;
    return _this3;
  }

  _createClass(AwesomeCart, [{
    key: 'listProducts',
    value: function listProducts() {
      return new Promise(function (resolve, reject) {});
    }
  }, {
    key: 'addToCart',
    value: function addToCart(sku, qty) {
      return new Promise(function (resolve, reject) {
        this.cart.push({ sku: sku, qty: qty });
      }.bind(this));
    }
  }, {
    key: 'removeFromCart',
    value: function removeFromCart(sku, qty) {
      return new Promise(function (resolve, reject) {});
    }
  }]);

  return AwesomeCart;
}(EventEmitter);

module.exports = {
  AwesomeCart: AwesomeCart,
  DemoStoreaAdapter: DemoStoreaAdapter,
  StoreAdapter: StoreAdapter
};

},{"./debug":1,"./utils":3,"events":4}],3:[function(require,module,exports){
"use strict";

function optionals() {
  var args = arguments[0];
  var ops = Array.from(arguments).splice(1);
  var ret = [];
  for (var i = 0; i < ops.length; i++) {
    ret.push(args.length <= i ? args[i] : ops[i]);
  }
  return ret;
}

function merge(a, b) {
  for (var i in b) {
    a[i] = b[i];
  }

  return a;
}

module.exports = {
  optionals: optionals,
  merge: merge
};

},{}],4:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZGVidWcuanMiLCJzcmMvbWFpbi5qcyIsInNyYy91dGlscy5qcyIsIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9ldmVudHMvZXZlbnRzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FBRUEsT0FBTyxPQUFQLEdBQWlCO0FBQ2YsT0FBSyxlQUFXO0FBQ2QsWUFBUSxHQUFSLENBQVksS0FBWixDQUFrQixPQUFsQixFQUEyQixTQUEzQjtBQUNELEdBSGM7QUFJZixTQUFPLGlCQUFXO0FBQ2hCLFlBQVEsS0FBUixDQUFjLEtBQWQsQ0FBb0IsT0FBcEIsRUFBNkIsU0FBN0I7QUFDRDs7QUFOYyxDQUFqQjs7O0FDRkE7Ozs7Ozs7Ozs7ZUFFbUIsUUFBUSxTQUFSLEM7SUFBZCxHLFlBQUEsRztJQUFLLEssWUFBQSxLOztnQkFDZSxRQUFRLFNBQVIsQztJQUFwQixTLGFBQUEsUztJQUFXLEssYUFBQSxLOztBQUNoQixJQUFJLGVBQWUsUUFBUSxRQUFSLEVBQWtCLFlBQXJDOztJQUVNLFk7OztBQUNKLDBCQUFjO0FBQUE7O0FBQUE7QUFFYjs7OztrQ0FFYTtBQUFFLGFBQU8sSUFBUDtBQUFjOzs7d0NBRVY7QUFBRSxhQUFPLElBQVA7QUFBYzs7O21DQUVyQixRLEVBQVU7QUFBRSxhQUFPLElBQVA7QUFBYzs7O2tDQUUzQixJLEVBQU07QUFBRSxhQUFPLElBQVA7QUFBYzs7O3VDQUVqQjtBQUFFLGFBQU8sSUFBUDtBQUFjOzs7dUNBRWhCLEcsRUFBSztBQUFFLGFBQU8sSUFBUDtBQUFjOzs7O0VBZmYsWTs7SUFtQnJCLGlCOzs7QUFDSiwrQkFBYztBQUFBOztBQUFBOztBQUVaLFdBQUssU0FBTCxHQUFpQjtBQUNm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QUFJLElBQUksQ0FBUixJQUFhLENBQWIsRUFBZ0I7QUFDZCxNQUFFLENBQUYsSUFBTyxFQUFFLENBQUYsQ0FBUDtBQUNEOztBQUVELFNBQU8sQ0FBUDtBQUNEOztBQUVELE9BQU8sT0FBUCxHQUFpQjtBQUNmLGFBQVcsU0FESTtBQUVmLFNBQU87QUFGUSxDQUFqQjs7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGxvZzogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKTtcbiAgfSxcbiAgZXJyb3I6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUuZXJyb3IuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKTtcbiAgfVxuXG59XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIHtsb2csIGVycm9yfSA9IHJlcXVpcmUoJy4vZGVidWcnKTtcbnZhciB7b3B0aW9uYWxzLCBtZXJnZX0gPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xuXG5jbGFzcyBTdG9yZUFkYXB0ZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpXG4gIH1cblxuICBnZXRDdXJyZW5jeSgpIHsgcmV0dXJuIG51bGw7IH1cblxuICBnZXRDdXJyZW5jeVN5bWJvbCgpIHsgcmV0dXJuIG51bGw7IH1cblxuICBmb3JtYXRDdXJyZW5jeShjdXJyZW5jeSkgeyByZXR1cm4gbnVsbDsgfVxuXG4gIHNlYXJjaFByb2R1Y3QodGVybSkgeyByZXR1cm4gbnVsbDsgfVxuXG4gIGZldGNoUHJvZHVjdFNLVXMoKSB7IHJldHVybiBudWxsOyB9XG5cbiAgZmV0Y2hQcm9kdWN0RGV0YWlsKHNrdSkgeyByZXR1cm4gbnVsbDsgfVxuXG59XG5cbmNsYXNzIERlbW9TdG9yZWFBZGFwdGVyIGV4dGVuZHMgU3RvcmVBZGFwdGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMuX3Byb2R1Y3RzID0ge1xuICAgICAgXCJza3UwMDFcIjoge1xuICAgICAgICBuYW1lOiBcIkRlbW8gSXRlbTFcIixcbiAgICAgICAgcHJpY2U6IDEwXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0Q3VycmVuY3koKSB7IHJldHVybiBcIlVTRFwiOyB9XG5cbiAgZ2V0Q3VycmVuY3lTeW1ib2woKSB7IHJldHVybiBcIiRcIjsgfVxuXG4gIGZvcm1hdEN1cnJlbmN5KGN1cnJlbmN5LCBkZWNpbWFscykgeyByZXR1cm4gYCQke2N1cnJlbmN5LnRvRml4ZWQoZGVjaW1hbHMpfWA7IH1cblxuICBzZWFyY2hQcm9kdWN0KHRlcm0pIHsgcmV0dXJuIG51bGw7IH1cblxuICBmZXRjaFByb2R1Y3RzKHRhZ3MpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdmFyIHByb2R1Y3RzID0gW107XG4gICAgICBmb3IodmFyIGkgaW4gdGhpcy5fcHJvZHVjdHMpIHtcbiAgICAgICAgdmFyIHByb2QgPSB0aGlzLl9wcm9kdWN0c1tpXTtcbiAgICAgICAgaWYgKCBwcm9kLnRhZ3MuZXZlcnkoZnVuY3Rpb24oZWxlbSkgeyByZXR1cm4gdGFncy5pbmRleE9mKGVsZW0pID49IC0xOyB9KSApIHtcbiAgICAgICAgICAgIHByb2R1Y3RzLnB1c2gocHJvZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlc29sdmUocHJvZHVjdHMpO1xuICAgIH0pLmJpbmQodGhpcykpO1xuICB9XG5cbiAgZmV0Y2hQcm9kdWN0RGV0YWlsKHNrdSkgeyByZXR1cm4gbnVsbDsgfVxufVxuXG5jbGFzcyBBd2Vzb21lQ2FydCBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKClcbiAgICB2YXIgYXJncyA9IG9wdGlvbmFscyhhcmd1bWVudHMsIHt9KTtcbiAgICB2YXIgb3B0aW9ucyA9IGFyZ3NbMF1cblxuICAgIHRoaXMub3B0aW9ucyA9IG1lcmdlKHtcbiAgICAgIHN0b3JlQWRhcHRlcjogbW9kdWxlLmV4cG9ydHMuZGVmYXVsdF9zdG9yZV9hZGFwdGVyIHx8IG5ldyBEZW1vU3RvcmVhQWRhcHRlcigpLFxuICAgICAgY3VycmVuY3lfZGVjaW1hbHM6IDJcbiAgICB9LCBvcHRpb25zKTtcbiAgICB0aGlzLmNhcnQgPSBbXTtcblxuICAgIHRoaXMuc3RvcmVBZGFwdGVyID0gdGhpcy5vcHRpb25zLnN0b3JlQWRhcHRlcjtcbiAgfVxuXG4gIGxpc3RQcm9kdWN0cygpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICB9KTtcbiAgfVxuXG4gIGFkZFRvQ2FydChza3UsIHF0eSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB0aGlzLmNhcnQucHVzaCh7IHNrdTogc2t1LCBxdHk6IHF0eSB9KVxuICAgIH0pLmJpbmQodGhpcykpO1xuICB9XG5cbiAgcmVtb3ZlRnJvbUNhcnQoc2t1LCBxdHkpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICB9KTtcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBBd2Vzb21lQ2FydDogQXdlc29tZUNhcnQsXG4gIERlbW9TdG9yZWFBZGFwdGVyOiBEZW1vU3RvcmVhQWRhcHRlcixcbiAgU3RvcmVBZGFwdGVyOiBTdG9yZUFkYXB0ZXJcbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBvcHRpb25hbHMoKSB7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzWzBdO1xuICB2YXIgb3BzID0gQXJyYXkuZnJvbShhcmd1bWVudHMpLnNwbGljZSgxKTtcbiAgdmFyIHJldCA9IFtdO1xuICBmb3IodmFyIGkgPSAwOyBpIDwgb3BzLmxlbmd0aDsgaSsrICkge1xuICAgIHJldC5wdXNoKChhcmdzLmxlbmd0aCA8PSBpKT9hcmdzW2ldOm9wc1tpXSk7XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gbWVyZ2UoYSwgYikge1xuICBmb3IodmFyIGkgaW4gYikge1xuICAgIGFbaV0gPSBiW2ldO1xuICB9XG5cbiAgcmV0dXJuIGE7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBvcHRpb25hbHM6IG9wdGlvbmFscyxcbiAgbWVyZ2U6IG1lcmdlXG59XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQXQgbGVhc3QgZ2l2ZSBzb21lIGtpbmQgb2YgY29udGV4dCB0byB0aGUgdXNlclxuICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LiAoJyArIGVyICsgJyknKTtcbiAgICAgICAgZXJyLmNvbnRleHQgPSBlcjtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2UgaWYgKGxpc3RlbmVycykge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKHRoaXMuX2V2ZW50cykge1xuICAgIHZhciBldmxpc3RlbmVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oZXZsaXN0ZW5lcikpXG4gICAgICByZXR1cm4gMTtcbiAgICBlbHNlIGlmIChldmxpc3RlbmVyKVxuICAgICAgcmV0dXJuIGV2bGlzdGVuZXIubGVuZ3RoO1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHJldHVybiBlbWl0dGVyLmxpc3RlbmVyQ291bnQodHlwZSk7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iXX0=
