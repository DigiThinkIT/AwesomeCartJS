(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
/**
 * @module awc
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('./debug'),
    log = _require.log,
    error = _require.error;

var _require2 = require('./utils'),
    optionals = _require2.optionals,
    requiredOptions = _require2.requiredOptions,
    merge = _require2.merge;

var EventEmitter = require('events').EventEmitter;

/**
 * The base store adapter class. All adapters are required to extend from this class.
 */

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

/**
 * A demo store adapter with hardcoded products to demonstrate how adapters work.
 */


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

/**
 * ProductFeed manages updating product listing elements on the live webpage.
 */


var ProductFeed = function (_EventEmitter2) {
  _inherits(ProductFeed, _EventEmitter2);

  function ProductFeed() {
    _classCallCheck(this, ProductFeed);

    var _this3 = _possibleConstructorReturn(this, (ProductFeed.__proto__ || Object.getPrototypeOf(ProductFeed)).call(this));

    var args = optionals(arguments, undefined, {});
    _this3.name = args[0];
    _this3.options = merge({
      filters: []
    }, args[1]);

    if (_this3.name === undefined) {
      throw new Error('ProductFeed requires a name');
    }

    var error = requiredOptions({
      'container': '"container" option is required.',
      'cart': '"cart" instance option is required.'
    });

    if (error) {
      throw error;
    }

    return _this3;
  }

  return ProductFeed;
}(EventEmitter);

/**
 * The main cart class. All managing of shopping cart happens here.
 */


var AwesomeCart = function (_EventEmitter3) {
  _inherits(AwesomeCart, _EventEmitter3);

  function AwesomeCart() {
    _classCallCheck(this, AwesomeCart);

    var _this4 = _possibleConstructorReturn(this, (AwesomeCart.__proto__ || Object.getPrototypeOf(AwesomeCart)).call(this));

    var args = optionals(arguments, {});
    var options = args[0];

    _this4.options = merge({
      storeAdapter: module.exports.default_store_adapter || new DemoStoreaAdapter(),
      currency_decimals: 2
    }, options);
    _this4.cart = [];

    _this4.storeAdapter = _this4.options.storeAdapter;
    return _this4;
  }

  _createClass(AwesomeCart, [{
    key: 'defineFeed',
    value: function defineFeed(name, options) {
      this.options.feeds[name] = options;
    }
  }, {
    key: 'listProducts',
    value: function listProducts() {
      return new Promise(function (resolve, reject) {});
    }

    /**
     * Adds a product to the cart by its sku and qty amount.
     * @param sku string  The product sku to track in the cart.
     * @param qty int     The product qty to add to cart.
     */

  }, {
    key: 'addToCart',
    value: function addToCart(sku, qty) {
      return new Promise(function (resolve, reject) {
        this.cart.push({ sku: sku, qty: qty });
      }.bind(this));
    }

    /**
     * Removes a qty of skus in the cart
     * @param sku string  The product sku to remove in the cart.
     * @param qty int     The product qty to remove to cart.
     */

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
/**
 * @module utils
 */

module.exports = {
  optionals: function optionals() {
    var args = arguments[0];
    var ops = Array.from(arguments).splice(1);
    var ret = [];
    for (var i = 0; i < ops.length; i++) {
      ret.push(args.length <= i ? args[i] : ops[i]);
    }
    return ret;
  },

  merge: function merge(a, b) {
    for (var i in b) {
      a[i] = b[i];
    }

    return a;
  },

  requiredOptions: function requiredOptions(options, required) {
    var error = [];
    for (var n in required) {
      if (!(n in options)) {
        error.push(required[n]);
      }
    }

    if (error.length > 0) {
      return new Error(error.join('\n'));
    }

    return false;
  }
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

},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9kZWJ1Zy5qcyIsInNyYy9tYWluLmpzIiwic3JjL3V0aWxzLmpzIiwiLi4vLi4vLi4vLi4vdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQUVBLE9BQU8sT0FBUCxHQUFpQjtBQUNmLE9BQUssZUFBVztBQUNkLFlBQVEsR0FBUixDQUFZLEtBQVosQ0FBa0IsT0FBbEIsRUFBMkIsU0FBM0I7QUFDRCxHQUhjO0FBSWYsU0FBTyxpQkFBVztBQUNoQixZQUFRLEtBQVIsQ0FBYyxLQUFkLENBQW9CLE9BQXBCLEVBQTZCLFNBQTdCO0FBQ0Q7O0FBTmMsQ0FBakI7OztBQ0ZBO0FBQ0E7Ozs7Ozs7Ozs7OztlQUltQixRQUFRLFNBQVIsQztJQUFkLEcsWUFBQSxHO0lBQUssSyxZQUFBLEs7O2dCQUNnQyxRQUFRLFNBQVIsQztJQUFyQyxTLGFBQUEsUztJQUFXLGUsYUFBQSxlO0lBQWlCLEssYUFBQSxLOztBQUNqQyxJQUFJLGVBQWUsUUFBUSxRQUFSLEVBQWtCLFlBQXJDOztBQUVBOzs7O0lBR00sWTs7O0FBQ0osMEJBQWM7QUFBQTs7QUFBQTtBQUViOzs7O2tDQUVhO0FBQUUsYUFBTyxJQUFQO0FBQWM7Ozt3Q0FFVjtBQUFFLGFBQU8sSUFBUDtBQUFjOzs7bUNBRXJCLFEsRUFBVTtBQUFFLGFBQU8sSUFBUDtBQUFjOzs7a0NBRTNCLEksRUFBTTtBQUFFLGFBQU8sSUFBUDtBQUFjOzs7dUNBRWpCO0FBQUUsYUFBTyxJQUFQO0FBQWM7Ozt1Q0FFaEIsRyxFQUFLO0FBQUUsYUFBTyxJQUFQO0FBQWM7Ozs7RUFmZixZOztBQW1CM0I7Ozs7O0lBR00saUI7OztBQUNKLCtCQUFjO0FBQUE7O0FBQUE7O0FBRVosV0FBSyxTQUFMLEdBQWlCO0FBQ2YsZ0JBQVU7QUFDUixjQUFNLFlBREU7QUFFUixlQUFPO0FBRkM7QUFESyxLQUFqQjtBQUZZO0FBUWI7Ozs7a0NBRWE7QUFBRSxhQUFPLEtBQVA7QUFBZTs7O3dDQUVYO0FBQUUsYUFBTyxHQUFQO0FBQWE7OzttQ0FFcEIsUSxFQUFVLFEsRUFBVTtBQUFFLG1CQUFXLFNBQVMsT0FBVCxDQUFpQixRQUFqQixDQUFYO0FBQTBDOzs7a0NBRWpFLEksRUFBTTtBQUFFLGFBQU8sSUFBUDtBQUFjOzs7a0NBRXRCLEksRUFBTTtBQUNsQixhQUFPLElBQUksT0FBSixDQUFhLFVBQVMsT0FBVCxFQUFrQixNQUFsQixFQUEwQjtBQUM1QyxZQUFJLFdBQVcsRUFBZjtBQUNBLGFBQUksSUFBSSxDQUFSLElBQWEsS0FBSyxTQUFsQixFQUE2QjtBQUMzQixjQUFJLE9BQU8sS0FBSyxTQUFMLENBQWUsQ0FBZixDQUFYO0FBQ0EsY0FBSyxLQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLFVBQVMsSUFBVCxFQUFlO0FBQUUsbUJBQU8sS0FBSyxPQUFMLENBQWEsSUFBYixLQUFzQixDQUFDLENBQTlCO0FBQWtDLFdBQW5FLENBQUwsRUFBNEU7QUFDeEUscUJBQVMsSUFBVCxDQUFjLElBQWQ7QUFDSDtBQUNGO0FBQ0QsZ0JBQVEsUUFBUjtBQUNELE9BVGtCLENBU2hCLElBVGdCLENBU1gsSUFUVyxDQUFaLENBQVA7QUFVRDs7O3VDQUVrQixHLEVBQUs7QUFBRSxhQUFPLElBQVA7QUFBYzs7OztFQWhDVixZOztBQW1DaEM7Ozs7O0lBR00sVzs7O0FBQ0oseUJBQWM7QUFBQTs7QUFBQTs7QUFFWixRQUFJLE9BQU8sVUFBVSxTQUFWLEVBQXFCLFNBQXJCLEVBQWdDLEVBQWhDLENBQVg7QUFDQSxXQUFLLElBQUwsR0FBWSxLQUFLLENBQUwsQ0FBWjtBQUNBLFdBQUssT0FBTCxHQUFlLE1BQU07QUFDbkIsZUFBUztBQURVLEtBQU4sRUFFWixLQUFLLENBQUwsQ0FGWSxDQUFmOztBQUlBLFFBQUssT0FBSyxJQUFMLEtBQWMsU0FBbkIsRUFBK0I7QUFDN0IsWUFBTSxJQUFJLEtBQUosQ0FBVSw2QkFBVixDQUFOO0FBQ0Q7O0FBRUQsUUFBSSxRQUFRLGdCQUFnQjtBQUMxQixtQkFBYSxpQ0FEYTtBQUUxQixjQUFRO0FBRmtCLEtBQWhCLENBQVo7O0FBS0EsUUFBSyxLQUFMLEVBQWE7QUFDWCxZQUFNLEtBQU47QUFDRDs7QUFuQlc7QUFxQmI7OztFQXRCdUIsWTs7QUF5QjFCOzs7OztJQUdNLFc7OztBQUNKLHlCQUFjO0FBQUE7O0FBQUE7O0FBRVosUUFBSSxPQUFPLFVBQVUsU0FBVixFQUFxQixFQUFyQixDQUFYO0FBQ0EsUUFBSSxVQUFVLEtBQUssQ0FBTCxDQUFkOztBQUVBLFdBQUssT0FBTCxHQUFlLE1BQU07QUFDbkIsb0JBQWMsT0FBTyxPQUFQLENBQWUscUJBQWYsSUFBd0MsSUFBSSxpQkFBSixFQURuQztBQUVuQix5QkFBbUI7QUFGQSxLQUFOLEVBR1osT0FIWSxDQUFmO0FBSUEsV0FBSyxJQUFMLEdBQVksRUFBWjs7QUFFQSxXQUFLLFlBQUwsR0FBb0IsT0FBSyxPQUFMLENBQWEsWUFBakM7QUFYWTtBQVliOzs7OytCQUVVLEksRUFBTSxPLEVBQVM7QUFDeEIsV0FBSyxPQUFMLENBQWEsS0FBYixDQUFtQixJQUFuQixJQUEyQixPQUEzQjtBQUNEOzs7bUNBRWM7QUFDYixhQUFPLElBQUksT0FBSixDQUFZLFVBQVMsT0FBVCxFQUFrQixNQUFsQixFQUEwQixDQUU1QyxDQUZNLENBQVA7QUFHRDs7QUFFRDs7Ozs7Ozs7OEJBS1UsRyxFQUFLLEcsRUFBSztBQUNsQixhQUFPLElBQUksT0FBSixDQUFhLFVBQVMsT0FBVCxFQUFrQixNQUFsQixFQUEwQjtBQUM1QyxhQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsRUFBRSxLQUFLLEdBQVAsRUFBWSxLQUFLLEdBQWpCLEVBQWY7QUFDRCxPQUZrQixDQUVoQixJQUZnQixDQUVYLElBRlcsQ0FBWixDQUFQO0FBR0Q7O0FBRUQ7Ozs7Ozs7O21DQUtlLEcsRUFBSyxHLEVBQUs7QUFDdkIsYUFBTyxJQUFJLE9BQUosQ0FBWSxVQUFTLE9BQVQsRUFBa0IsTUFBbEIsRUFBMEIsQ0FFNUMsQ0FGTSxDQUFQO0FBR0Q7Ozs7RUE3Q3VCLFk7O0FBaUQxQixPQUFPLE9BQVAsR0FBaUI7QUFDZixlQUFhLFdBREU7QUFFZixxQkFBbUIsaUJBRko7QUFHZixnQkFBYztBQUhDLENBQWpCOzs7QUNySkE7QUFDQTs7OztBQUlBLE9BQU8sT0FBUCxHQUFpQjtBQUNmLGFBQVcscUJBQVc7QUFDcEIsUUFBSSxPQUFPLFVBQVUsQ0FBVixDQUFYO0FBQ0EsUUFBSSxNQUFNLE1BQU0sSUFBTixDQUFXLFNBQVgsRUFBc0IsTUFBdEIsQ0FBNkIsQ0FBN0IsQ0FBVjtBQUNBLFFBQUksTUFBTSxFQUFWO0FBQ0EsU0FBSSxJQUFJLElBQUksQ0FBWixFQUFlLElBQUksSUFBSSxNQUF2QixFQUErQixHQUEvQixFQUFxQztBQUNuQyxVQUFJLElBQUosQ0FBVSxLQUFLLE1BQUwsSUFBZSxDQUFoQixHQUFtQixLQUFLLENBQUwsQ0FBbkIsR0FBMkIsSUFBSSxDQUFKLENBQXBDO0FBQ0Q7QUFDRCxXQUFPLEdBQVA7QUFDRCxHQVRjOztBQVdmLFNBQU8sZUFBUyxDQUFULEVBQVksQ0FBWixFQUFlO0FBQ3BCLFNBQUksSUFBSSxDQUFSLElBQWEsQ0FBYixFQUFnQjtBQUNkLFFBQUUsQ0FBRixJQUFPLEVBQUUsQ0FBRixDQUFQO0FBQ0Q7O0FBRUQsV0FBTyxDQUFQO0FBQ0QsR0FqQmM7O0FBbUJmLG1CQUFpQix5QkFBUyxPQUFULEVBQWtCLFFBQWxCLEVBQTRCO0FBQzNDLFFBQUksUUFBUSxFQUFaO0FBQ0EsU0FBSSxJQUFJLENBQVIsSUFBYSxRQUFiLEVBQXVCO0FBQ3JCLFVBQUssRUFBRSxLQUFLLE9BQVAsQ0FBTCxFQUF1QjtBQUNyQixjQUFNLElBQU4sQ0FBVyxTQUFTLENBQVQsQ0FBWDtBQUNEO0FBQ0Y7O0FBRUQsUUFBSyxNQUFNLE1BQU4sR0FBZSxDQUFwQixFQUF3QjtBQUN0QixhQUFPLElBQUksS0FBSixDQUFVLE1BQU0sSUFBTixDQUFXLElBQVgsQ0FBVixDQUFQO0FBQ0Q7O0FBRUQsV0FBTyxLQUFQO0FBQ0Q7QUFoQ2MsQ0FBakI7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGxvZzogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKTtcbiAgfSxcbiAgZXJyb3I6IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUuZXJyb3IuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKTtcbiAgfVxuXG59XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qKlxuICogQG1vZHVsZSBhd2NcbiAqL1xuXG52YXIge2xvZywgZXJyb3J9ID0gcmVxdWlyZSgnLi9kZWJ1ZycpO1xudmFyIHtvcHRpb25hbHMsIHJlcXVpcmVkT3B0aW9ucywgbWVyZ2V9ID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcblxuLyoqXG4gKiBUaGUgYmFzZSBzdG9yZSBhZGFwdGVyIGNsYXNzLiBBbGwgYWRhcHRlcnMgYXJlIHJlcXVpcmVkIHRvIGV4dGVuZCBmcm9tIHRoaXMgY2xhc3MuXG4gKi9cbmNsYXNzIFN0b3JlQWRhcHRlciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKClcbiAgfVxuXG4gIGdldEN1cnJlbmN5KCkgeyByZXR1cm4gbnVsbDsgfVxuXG4gIGdldEN1cnJlbmN5U3ltYm9sKCkgeyByZXR1cm4gbnVsbDsgfVxuXG4gIGZvcm1hdEN1cnJlbmN5KGN1cnJlbmN5KSB7IHJldHVybiBudWxsOyB9XG5cbiAgc2VhcmNoUHJvZHVjdCh0ZXJtKSB7IHJldHVybiBudWxsOyB9XG5cbiAgZmV0Y2hQcm9kdWN0U0tVcygpIHsgcmV0dXJuIG51bGw7IH1cblxuICBmZXRjaFByb2R1Y3REZXRhaWwoc2t1KSB7IHJldHVybiBudWxsOyB9XG5cbn1cblxuLyoqXG4gKiBBIGRlbW8gc3RvcmUgYWRhcHRlciB3aXRoIGhhcmRjb2RlZCBwcm9kdWN0cyB0byBkZW1vbnN0cmF0ZSBob3cgYWRhcHRlcnMgd29yay5cbiAqL1xuY2xhc3MgRGVtb1N0b3JlYUFkYXB0ZXIgZXh0ZW5kcyBTdG9yZUFkYXB0ZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5fcHJvZHVjdHMgPSB7XG4gICAgICBcInNrdTAwMVwiOiB7XG4gICAgICAgIG5hbWU6IFwiRGVtbyBJdGVtMVwiLFxuICAgICAgICBwcmljZTogMTBcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXRDdXJyZW5jeSgpIHsgcmV0dXJuIFwiVVNEXCI7IH1cblxuICBnZXRDdXJyZW5jeVN5bWJvbCgpIHsgcmV0dXJuIFwiJFwiOyB9XG5cbiAgZm9ybWF0Q3VycmVuY3koY3VycmVuY3ksIGRlY2ltYWxzKSB7IHJldHVybiBgJCR7Y3VycmVuY3kudG9GaXhlZChkZWNpbWFscyl9YDsgfVxuXG4gIHNlYXJjaFByb2R1Y3QodGVybSkgeyByZXR1cm4gbnVsbDsgfVxuXG4gIGZldGNoUHJvZHVjdHModGFncykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB2YXIgcHJvZHVjdHMgPSBbXTtcbiAgICAgIGZvcih2YXIgaSBpbiB0aGlzLl9wcm9kdWN0cykge1xuICAgICAgICB2YXIgcHJvZCA9IHRoaXMuX3Byb2R1Y3RzW2ldO1xuICAgICAgICBpZiAoIHByb2QudGFncy5ldmVyeShmdW5jdGlvbihlbGVtKSB7IHJldHVybiB0YWdzLmluZGV4T2YoZWxlbSkgPj0gLTE7IH0pICkge1xuICAgICAgICAgICAgcHJvZHVjdHMucHVzaChwcm9kKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVzb2x2ZShwcm9kdWN0cyk7XG4gICAgfSkuYmluZCh0aGlzKSk7XG4gIH1cblxuICBmZXRjaFByb2R1Y3REZXRhaWwoc2t1KSB7IHJldHVybiBudWxsOyB9XG59XG5cbi8qKlxuICogUHJvZHVjdEZlZWQgbWFuYWdlcyB1cGRhdGluZyBwcm9kdWN0IGxpc3RpbmcgZWxlbWVudHMgb24gdGhlIGxpdmUgd2VicGFnZS5cbiAqL1xuY2xhc3MgUHJvZHVjdEZlZWQgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHZhciBhcmdzID0gb3B0aW9uYWxzKGFyZ3VtZW50cywgdW5kZWZpbmVkLCB7fSlcbiAgICB0aGlzLm5hbWUgPSBhcmdzWzBdO1xuICAgIHRoaXMub3B0aW9ucyA9IG1lcmdlKHtcbiAgICAgIGZpbHRlcnM6IFtdXG4gICAgfSwgYXJnc1sxXSlcblxuICAgIGlmICggdGhpcy5uYW1lID09PSB1bmRlZmluZWQgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb2R1Y3RGZWVkIHJlcXVpcmVzIGEgbmFtZScpXG4gICAgfVxuXG4gICAgdmFyIGVycm9yID0gcmVxdWlyZWRPcHRpb25zKHtcbiAgICAgICdjb250YWluZXInOiAnXCJjb250YWluZXJcIiBvcHRpb24gaXMgcmVxdWlyZWQuJyxcbiAgICAgICdjYXJ0JzogJ1wiY2FydFwiIGluc3RhbmNlIG9wdGlvbiBpcyByZXF1aXJlZC4nXG4gICAgfSk7XG5cbiAgICBpZiAoIGVycm9yICkge1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuXG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgbWFpbiBjYXJ0IGNsYXNzLiBBbGwgbWFuYWdpbmcgb2Ygc2hvcHBpbmcgY2FydCBoYXBwZW5zIGhlcmUuXG4gKi9cbmNsYXNzIEF3ZXNvbWVDYXJ0IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKVxuICAgIHZhciBhcmdzID0gb3B0aW9uYWxzKGFyZ3VtZW50cywge30pO1xuICAgIHZhciBvcHRpb25zID0gYXJnc1swXVxuXG4gICAgdGhpcy5vcHRpb25zID0gbWVyZ2Uoe1xuICAgICAgc3RvcmVBZGFwdGVyOiBtb2R1bGUuZXhwb3J0cy5kZWZhdWx0X3N0b3JlX2FkYXB0ZXIgfHwgbmV3IERlbW9TdG9yZWFBZGFwdGVyKCksXG4gICAgICBjdXJyZW5jeV9kZWNpbWFsczogMlxuICAgIH0sIG9wdGlvbnMpO1xuICAgIHRoaXMuY2FydCA9IFtdO1xuXG4gICAgdGhpcy5zdG9yZUFkYXB0ZXIgPSB0aGlzLm9wdGlvbnMuc3RvcmVBZGFwdGVyO1xuICB9XG5cbiAgZGVmaW5lRmVlZChuYW1lLCBvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zLmZlZWRzW25hbWVdID0gb3B0aW9ucztcbiAgfVxuXG4gIGxpc3RQcm9kdWN0cygpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgcHJvZHVjdCB0byB0aGUgY2FydCBieSBpdHMgc2t1IGFuZCBxdHkgYW1vdW50LlxuICAgKiBAcGFyYW0gc2t1IHN0cmluZyAgVGhlIHByb2R1Y3Qgc2t1IHRvIHRyYWNrIGluIHRoZSBjYXJ0LlxuICAgKiBAcGFyYW0gcXR5IGludCAgICAgVGhlIHByb2R1Y3QgcXR5IHRvIGFkZCB0byBjYXJ0LlxuICAgKi9cbiAgYWRkVG9DYXJ0KHNrdSwgcXR5KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHRoaXMuY2FydC5wdXNoKHsgc2t1OiBza3UsIHF0eTogcXR5IH0pXG4gICAgfSkuYmluZCh0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhIHF0eSBvZiBza3VzIGluIHRoZSBjYXJ0XG4gICAqIEBwYXJhbSBza3Ugc3RyaW5nICBUaGUgcHJvZHVjdCBza3UgdG8gcmVtb3ZlIGluIHRoZSBjYXJ0LlxuICAgKiBAcGFyYW0gcXR5IGludCAgICAgVGhlIHByb2R1Y3QgcXR5IHRvIHJlbW92ZSB0byBjYXJ0LlxuICAgKi9cbiAgcmVtb3ZlRnJvbUNhcnQoc2t1LCBxdHkpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICB9KTtcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBBd2Vzb21lQ2FydDogQXdlc29tZUNhcnQsXG4gIERlbW9TdG9yZWFBZGFwdGVyOiBEZW1vU3RvcmVhQWRhcHRlcixcbiAgU3RvcmVBZGFwdGVyOiBTdG9yZUFkYXB0ZXJcbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuLyoqXG4gKiBAbW9kdWxlIHV0aWxzXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG9wdGlvbmFsczogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHNbMF07XG4gICAgdmFyIG9wcyA9IEFycmF5LmZyb20oYXJndW1lbnRzKS5zcGxpY2UoMSk7XG4gICAgdmFyIHJldCA9IFtdO1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBvcHMubGVuZ3RoOyBpKysgKSB7XG4gICAgICByZXQucHVzaCgoYXJncy5sZW5ndGggPD0gaSk/YXJnc1tpXTpvcHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9LFxuXG4gIG1lcmdlOiBmdW5jdGlvbihhLCBiKSB7XG4gICAgZm9yKHZhciBpIGluIGIpIHtcbiAgICAgIGFbaV0gPSBiW2ldO1xuICAgIH1cblxuICAgIHJldHVybiBhO1xuICB9LFxuXG4gIHJlcXVpcmVkT3B0aW9uczogZnVuY3Rpb24ob3B0aW9ucywgcmVxdWlyZWQpIHtcbiAgICB2YXIgZXJyb3IgPSBbXTtcbiAgICBmb3IodmFyIG4gaW4gcmVxdWlyZWQpIHtcbiAgICAgIGlmICggIShuIGluIG9wdGlvbnMpICkge1xuICAgICAgICBlcnJvci5wdXNoKHJlcXVpcmVkW25dKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICggZXJyb3IubGVuZ3RoID4gMCApIHtcbiAgICAgIHJldHVybiBuZXcgRXJyb3IoZXJyb3Iuam9pbignXFxuJykpO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEF0IGxlYXN0IGdpdmUgc29tZSBraW5kIG9mIGNvbnRleHQgdG8gdGhlIHVzZXJcbiAgICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4gKCcgKyBlciArICcpJyk7XG4gICAgICAgIGVyci5jb250ZXh0ID0gZXI7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIGlmIChsaXN0ZW5lcnMpIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmICh0aGlzLl9ldmVudHMpIHtcbiAgICB2YXIgZXZsaXN0ZW5lciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICAgIGlmIChpc0Z1bmN0aW9uKGV2bGlzdGVuZXIpKVxuICAgICAgcmV0dXJuIDE7XG4gICAgZWxzZSBpZiAoZXZsaXN0ZW5lcilcbiAgICAgIHJldHVybiBldmxpc3RlbmVyLmxlbmd0aDtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICByZXR1cm4gZW1pdHRlci5saXN0ZW5lckNvdW50KHR5cGUpO1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIl19
