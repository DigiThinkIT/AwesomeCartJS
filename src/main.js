"use strict";
/**
 * @module awc
 */

const {log, error} = require('./debug');
const {sargs, hasClass, addClass} = require('./utils');
const EventEmitter = require('events').EventEmitter;
const xhr = require('xhr')
const Promise = require('BlueBird')
const Handlebars = require('handlebars')
const queryString = require('query-string')
const uuid = require('node-uuid')
xhr.get = Promise.promisify(xhr.get)

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

  fetchProducts() { return null; }

}

/**
 * A demo store adapter with hardcoded products to demonstrate how adapters work.
 */
class DemoStoreaAdapter extends StoreAdapter {
  constructor() {
    super()
    this._products = [
      {
        sku: "sku001",
        name: "Demo Item1",
        imageUrl: "https://placeholdit.imgix.net/~text?txtsize=16&txt=Item1&w=400&h=250",
        description: 'First demo item',
        price: 10,
        tags: ['demo', 'first', 'group1', 'group2']
      },
      {
        sku: "sku002",
        name: "Demo Item2",
        imageUrl: "https://placeholdit.imgix.net/~text?txtsize=16&txt=Item2&w=400&h=250",
        description: 'Second demo item',
        price: 20,
        tags: ['demo', 'second', 'group1', 'group3']
      },
      {
        sku: "sku003",
        name: "Demo Item3",
        imageUrl: "https://placeholdit.imgix.net/~text?txtsize=16&txt=Item3&w=400&h=250",
        description: 'Third demo item',
        price: 30,
        tags: ['demo', 'third', 'group2', 'group3']
      }
    ]
  }

  getCurrency() { return "USD"; }

  getCurrencySymbol() { return "$"; }

  formatCurrency(currency, decimals) { return `$${currency.toFixed(decimals)}`; }

  getProductBySKU(sku) {
    var result = this._products.filter((p) => {
      return p.sku = sku;
    })

    return ( result.length > 0 )?result[0]:false
  }

  fetchProducts() {
    //var tags, terms;
    //[tags, terms] = optionals(arguments, [])
    let { tags: tags, terms: terms } = sargs(arguments,
      { arg: 'tags', default: [] },
      { arg: 'terms'}
    )

    return new Promise((function(resolve, reject) {
      var products = [];
      for(var i in this._products) {
        var prod = this._products[i];
        if ( tags ) {
          if ( prod.tags.every(function(elem) { return tags.indexOf(elem) >= -1; }) ) {
            products.push(prod)
          }
        } else {
          products.push(prod)
        }
      }
      resolve(products);
    }).bind(this));
  }
}

class Feed extends EventEmitter {
  constructor() {
    super()
    var args = sargs(arguments,
      {arg: 'cart', required: 1},
      {arg: 'name', required: 1},
      {arg: 'options', merge: { filters: [] }}
    )

    this.cart = args.cart
    this.name = args.name
    try {
      this.options = sargs(args.options,
        { arg: 'dataSource', required: 1 },
        { arg: 'idField', default: 'id' },
        { arg: 'container', required: 1 },
        { arg: 'tpl', required: 1 }
      );
    } catch(err) {
      //Error.captureStackTrace(err, Feed);
      throw err
    }

    this.cart.on('init', this.onInit.bind(this))
  }

  onInit() {
    this.update()
  }

  update() {
    this.emit('update', this)

    this.options.dataSource(this.filters)
      .then((result) => {
        if ( this.options.tpl.isFulfilled() ) {
          // if template is ready just pass along results
          return result;
        } else {
          // wait for template to load
          return new Promise((resolve, reject) => {
            this.options.tpl
              .then(() => { resolve(result) })
              .catch((err) => { reject(err) })
          })
        }
      })
      .then((result) => {
        this.items = {}
        this.empty()

        var tpl = this.options.tpl.value();
        var count = 0;
        for(var i in result) {
          this.items[result[i][this.options.idField]] = result[i]
          count++;
        }

        var html = tpl({items: this.items, is_empty: count == 0})
        this.container.insertAdjacentHTML('beforeend', html)

        this.emit('updated', this, this.products)
      })
      .catch((err) => {
        console.error(err)
        //TODO: Handle errors
      });
  }

  get container() {
    return document.querySelector(this.options.container)
  }

  empty() {
    var container = this.container;
    while(container.hasChildNodes()) {
      container.removeChild(container.lastChild);
    }
  }

  /**
   * Array, gets the active filters for this feed.
   * @return Array
   */
  get filters() {
    return this.options.filters;
  }

  /**
   * Sets the active filters for this feed. The feed is immediately
   * refreshed with this property is changed.
   * @arg filters Array
   */
  set filters(filters) {
    this.options.filters = filters || [];
    this.refresh()
  }

}

/**
 * ProductFeed manages updating product listing elements on the live webpage.
 */
class ProductFeed extends Feed {

  /**
   * Instantiates a product feed
   * @arg cart string     The AwesomeCart instance
   * @arg name string     The feed name
   * @arg options object  Feed options
   */
  constructor(...params) {
    super(...params);
  }
}

/**
 * CartFeed manages updating cart listing elements on the live webpage.
 */
class CartFeed extends Feed {

  /**
   * Instantiates a product feed
   * @arg cart string     The AwesomeCart instance
   * @arg name string     The feed name
   * @arg options object  Feed options
   */
  constructor(...params) {
    super(...params);
  }

  onInit() {
    super.onInit()
    this.cart.on('updated', this.update.bind(this))
  }
}

/**
 * The main cart class. All managing of shopping cart happens here.
 */
class AwesomeCart extends EventEmitter {
  constructor() {
    super()
    this._cart = []
    let { options: options } = sargs(arguments, { arg: 'options', default: {}})
    this.options = sargs(options,
      { arg: 'storeAdapter', default: module.exports.default_store_adapter || new DemoStoreaAdapter(), required: 1 },
      { arg: 'currencyDecimals', default: 2},
      { arg: 'feeds', default: {} }
    )

    this.storeAdapter = this.options.storeAdapter;
  }

  /**
   * Adds a new managed product feed. Product feeds automate fetching and displaying
   * product listings.
   * @arg name string     The feed name.
   * @arg options object  An object defining the feed properties and behaviour.
   */
  newProductFeed(name, options) {
    // set a few defaults for products only feed
    options = sargs(options,
      { arg: 'dataSource', default: this.storeAdapter.fetchProducts.bind(this.storeAdapter) },
      { arg: 'idField', default: 'sku' },
      { arg: 'container' },
      { arg: 'tpl' }
    )
    try {
      this.options.feeds[name] = new ProductFeed(this, name, options)
      this.options.feeds[name].on('updated', this.updateUI.bind(this))
    } catch(err) {
      // pass error to user
      //Error.captureStackTrace(err, this.newProductFeed);
      throw err
    }
  }

  newCartFeed(name, options) {
    options = sargs(options,
      { arg: 'dataSource', default: this.fetchCartItems.bind(this) },
      { arg: 'idField', default: 'id' },
      { arg: 'container' },
      { arg: 'tpl' }
    )
    this.options.feeds[name] = new CartFeed(this, name, options)
    this.options.feeds[name].on('updated', this.updateUI.bind(this))
  }

  fetchCartItems(filters) {
    return new Promise((resolve, reject) => {
      resolve(this._cart)
    })
  }

  /**
   * Updates click event references and overall UI handling
   */
  updateUI() {
    var addtocartElems = document.querySelectorAll('[data-awc-addtocart]');
    for(var i = 0; i < addtocartElems.length; i++) {
      var btn = addtocartElems[i];
      if ( !hasClass(btn, 'awc-bound') ) {
        btn.addEventListener('click', this._onAddToCartClick.bind(this))
        addClass(btn, 'awc-bound')
      }
    }
  }

  _onAddToCartClick(e) {
    log('Add to cart', e, this)
    var btn = e.target;
    var sku = btn.dataset.id;
    var qty = btn.dataset.qty || 1;
    var options = btn.dataset.options;
    if ( options && options instanceof String ) {
      options = queryString.parse(options)
    }
    this.addToCart(sku, qty, options)
  }

  listProducts() {
    //var filters;
    //[filters] = optionals(arguments, [])
    let { filters: filters } = sargs(arguments,
      { arg: 'filters', default: [] }
    )


    return new Promise(function(resolve, reject) {

    });
  }

  /**
   * Adds a product to the cart by its sku and qty amount.
   * @param sku string      The product sku to track in the cart.
   * @param qty int         The product qty to add to cart.
   * @param options object  Customization options associated with product
   */
  addToCart() {
    var args = sargs(arguments,
      { arg: 'sku', required: 1 },
      { arg: 'qty', default: 1 },
      { arg: 'options', default: {}}
    )
    return new Promise((function(resolve, reject) {
      var product = this.storeAdapter.getProductBySKU(args.sku);
      if ( product ) {
        this._cart.push({
          product: product,
          qty: args.qty,
          options: args.options,
          id: uuid.v1(),
          unit: product.price,
          total: product.price * args.qty
        })
        this.emit('updated')
      }
    }).bind(this));
  }

  /**
   * Removes a qty of skus in the cart
   * @param sku string  The product sku to remove in the cart.
   * @param qty int     The product qty to remove to cart.
   */
  removeFromCartBySKU(sku, qty) {
    var args = sargs(arguments,
      { arg: 'sku', required: 1 },
      { arg: 'qty', default: 1 }
    )
    return new Promise(function(resolve, reject) {

    });
  }

  bootstrap() {
    this.emit('init')
  }

}

module.exports = {
  AwesomeCart: AwesomeCart,
  DemoStoreaAdapter: DemoStoreaAdapter,
  StoreAdapter: StoreAdapter,
  getTemplate: function(url) {
    return xhr.get(url).then((resp) => {
      // compile template and return
      return Handlebars.compile(resp.body)
    })
  }
}
