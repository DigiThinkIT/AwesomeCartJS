"use strict";
/**
 * @module awc
 */

var {log, error} = require('./debug');
var {optionals, requiredOptions, merge} = require('./utils');
var EventEmitter = require('events').EventEmitter;

/**
 * The base store adapter class. All adapters are required to extend from this class.
 */
class StoreAdapter extends EventEmitter {
  constructor() {
    super()
  }

  getCurrency() { return null; }

  getCurrencySymbol() { return null; }

  formatCurrency(currency) { return null; }

  searchProduct(term) { return null; }

  fetchProductSKUs() { return null; }

  fetchProductDetail(sku) { return null; }

}

/**
 * A demo store adapter with hardcoded products to demonstrate how adapters work.
 */
class DemoStoreaAdapter extends StoreAdapter {
  constructor() {
    super()
    this._products = {
      "sku001": {
        name: "Demo Item1",
        price: 10
      }
    }
  }

  getCurrency() { return "USD"; }

  getCurrencySymbol() { return "$"; }

  formatCurrency(currency, decimals) { return `$${currency.toFixed(decimals)}`; }

  searchProduct(term) { return null; }

  fetchProducts(tags) {
    return new Promise((function(resolve, reject) {
      var products = [];
      for(var i in this._products) {
        var prod = this._products[i];
        if ( prod.tags.every(function(elem) { return tags.indexOf(elem) >= -1; }) ) {
            products.push(prod);
        }
      }
      resolve(products);
    }).bind(this));
  }

  fetchProductDetail(sku) { return null; }
}

/**
 * ProductFeed manages updating product listing elements on the live webpage.
 */
class ProductFeed extends EventEmitter {
  constructor() {
    super();
    var args = optionals(arguments, undefined, {})
    this.name = args[0];
    this.options = merge({
      filters: []
    }, args[1])

    if ( this.name === undefined ) {
      throw new Error('ProductFeed requires a name')
    }

    var error = requiredOptions({
      'container': '"container" option is required.',
      'cart': '"cart" instance option is required.'
    });

    if ( error ) {
      throw error;
    }

  }
}

/**
 * The main cart class. All managing of shopping cart happens here.
 */
class AwesomeCart extends EventEmitter {
  constructor() {
    super()
    var args = optionals(arguments, {});
    var options = args[0]

    this.options = merge({
      storeAdapter: module.exports.default_store_adapter || new DemoStoreaAdapter(),
      currency_decimals: 2
    }, options);
    this.cart = [];

    this.storeAdapter = this.options.storeAdapter;
  }

  defineFeed(name, options) {
    this.options.feeds[name] = options;
  }

  listProducts() {
    return new Promise(function(resolve, reject) {

    });
  }

  /**
   * Adds a product to the cart by its sku and qty amount.
   * @param sku string  The product sku to track in the cart.
   * @param qty int     The product qty to add to cart.
   */
  addToCart(sku, qty) {
    return new Promise((function(resolve, reject) {
      this.cart.push({ sku: sku, qty: qty })
    }).bind(this));
  }

  /**
   * Removes a qty of skus in the cart
   * @param sku string  The product sku to remove in the cart.
   * @param qty int     The product qty to remove to cart.
   */
  removeFromCart(sku, qty) {
    return new Promise(function(resolve, reject) {

    });
  }

}

module.exports = {
  AwesomeCart: AwesomeCart,
  DemoStoreaAdapter: DemoStoreaAdapter,
  StoreAdapter: StoreAdapter
}
