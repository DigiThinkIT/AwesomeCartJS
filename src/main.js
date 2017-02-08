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
const _ = require('lodash')
xhr.get = Promise.promisify(xhr.get)
xhr.post = Promise.promisify(xhr.post)

/**
 * The base store adapter class. All adapters are required to extend from this class.
 */
class StoreAdapter extends EventEmitter {
  constructor() {
    super()
  }

  init() {
    return new Promise((resolve, reject) => {
      resolve({data: [], success: true})
    })
  }

  getCurrency() { return null; }

  getCurrencySymbol() { return null; }

  formatCurrency(currency) { return null; }

  fetchProducts() { return null; }

  fetchCartSession() {
    return null;
  }

  sessionAction(action, data) {
    return null;
  }

}

/**
 * A demo store adapter with hardcoded products to demonstrate how adapters work.
 */
class DemoStoreaAdapter extends StoreAdapter {
  constructor(catalog, sessionHandler, sessionActionHandler) {
    super()
    this._products = catalog || []
    this._sessionHandler = sessionHandler
    this._sessionActionHandler = sessionActionHandler
  }

  init() {
    return new Promise((resolve, reject) => {
      if ( this._products.length == 0 ) {
        for(var i=1; i < 11; i++) {
          this._products.push({
            sku: `sku00${i}`,
            name: `Demo Item ${i}`,
            min: 1,
            imageUrl: `http://placehold.it/400x250/?text400x250`,
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras congue, erat vel molestie pharetra, enim risus euismod libero, et aliquet neque libero ac dui.',
            price: Math.floor(Math.random()*10)+10,
            tags: ['demo']
          })

        }
      }

      resolve(this.fetchCartSession())
    })
  }

  getCurrency() { return "USD"; }

  getCurrencySymbol() { return "$"; }

  formatCurrency(currency, decimals) { return `$${currency.toFixed(decimals)}`; }

  fetchCartSession() {
    return new Promise((resolve, reject) => {
      if ( this._sessionHandler ) {
        this._sessionHandler(resolve, reject);
      } else {
        resolve({data: [], success: true})
      }
    })
  }

  sessionAction(action, data) {
    return new Promise((resolve, reject) => {
      if ( this._sessionActionHandler ) {
        this._sessionActionHandler(action , data, resolve, reject)
      } else {
        resolve({data: null, success: true})
      }
    })
  }

  getProductBySKU(sku) {
    return new Promise((resolve, reject) => {
      var result = this._products.filter((p) => {
        return p.sku == sku;
      })

      resolve(( result.length > 0 )?result[0]:false)
    })
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

        var html = tpl({items: this.items, is_empty: count == 0, cart: this.cart })
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

    if ( !container ) {
      throw new Error('Invalid container')
    }

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
    this._lastTotalCount = 0
    this._lastTotalItems = 0

    let { options: options } = sargs(arguments, { arg: 'options', default: {}})
    this.options = sargs(options,
      { arg: 'storeAdapter', default: module.exports.default_store_adapter || new DemoStoreaAdapter(), required: 1 },
      { arg: 'currencyDecimals', default: 2 },
      { arg: 'feeds', default: {} },
      { arg: 'sessionStoreUrl', default: false }
    )

    this.storeAdapter = this.options.storeAdapter;
    window.addEventListener('hashchange', (e) => {
      this.emit('hashchange', e)
    })
  }

  /**
   * Returns total line items in the cart.
   * @return int
   */
  get totalItems() {
    return this._cart.length
  }

  get lastTotalItems() {
    return this._lastTotalItems
  }

  /**
  * Returns sum of all qty values in cart.
  * @return int
  */
  get totalCount() {
    var count = 0;
    for(var i in this._cart) {
      count += this._cart[i].qty || 0
    }

    return count
  }

  get lastTotalCount() {
    return this._lastTotalCount
  }

  /**
   * Returns the list of line items in the cart.
   * @return Array
   */
  get items() {
    return this._cart
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
    var addToCartElems = document.querySelectorAll('[data-awc-addtocart]');
    for(var i = 0; i < addToCartElems.length; i++) {
      var btn = addToCartElems[i]
      if ( !hasClass(btn, 'awc-bound') ) {
        btn.addEventListener('click', this._onAddToCartClick.bind(this))
        addClass(btn, 'awc-bound')
      }
    }

    var removeFromCartElems = document.querySelectorAll('[data-awc-removefromcart]');
    for(var i = 0; i < removeFromCartElems.length; i++) {
      var btn = removeFromCartElems[i]
      if ( !hasClass(btn, 'awc-bound') ) {
        btn.addEventListener('click', this._onRemoveFromCartClick.bind(this))
        addClass(btn, 'awc-bound')
      }
    }
  }

  _onAddToCartClick(e) {
    var btn = e.target;
    var sku = btn.dataset.id;
    var qty = btn.dataset.qty || 1;
    var options = btn.dataset.options;
    if ( options && options instanceof String ) {
      options = queryString.parse(options)
    }
    this.addToCart(sku, qty, options)
  }

  _onRemoveFromCartClick(e) {
    var btn = e.target;
    var id = btn.dataset.id;
    this.removeFromCart(id)
      .catch((err) => {
        console.dir(btn, id, btn.dataset)
        console.error(err)
      })
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

    return this.storeAdapter.getProductBySKU(args.sku)
      .then((product) => {
        if ( product ) {

          var item = {
            product: product,
            qty: args.qty,
            options: args.options,
            id: uuid.v1(),
            unit: product.price,
            total: product.price * args.qty
          }

          this._cart.push(item)
          return item;
        }

        return false
      })
      .then((item) => {
        if (item) {
          return this.storeAdapter.sessionAction(
            'addToCart',
            { id: item.id, qty: item.qty, sku: item.product.sku, options: item.options }
          )
        }

        return false
      })
      .then(() => {
        this._emitUpdated()
      })
      /*
      .then((item) => {
        if ( item ) {
          return xhr.post({
            url: this.options.sessionStoreUrl,
            json: {
              action: 'addToCart',
              data: { id: item.id, qty: item.qty, sku: item.product.sku, options: item.options }
            }
          }).then((resp) => {
            if ( resp.statusCode != 200 ) {
              throw new error(resp.statusCode)
            } else {
              if ( resp.body.success ) {
                this._cart.push(item)
                this._emitUpdated()
                return item;
              } else {
                throw new error(resp.message)
              }
            }
          })
        } else {
            this._cart.push(item)
            this._emitUpdated()
            return item;
        }
      });*/
  }

  removeFromCart(id) {
    return new Promise((resolve, reject) => {
      if ( !id ) {
        reject("Invalid id")
      } else {
        _.remove(this._cart, (item) => {
          return item.id == id;
        })

        if ( this.options.sessionStoreUrl ) {
          xhr.post({
            url: this.options.sessionStoreUrl,
            json: {
              action: 'removeFromCart',
              data: id
            }
          }).then((resp) => {
            if ( resp.statusCode != 200 ) {
              reject(resp.statusCode)
            } else {
              if ( resp.body.success ) {
                this._emitUpdated()
                resolve()
              } else {
                reject(resp.message)
              }
            }
          })
        } else {
          this._emitUpdated()
          resolve()
        }
      }
    })
  }

  getProductBySKU(sku) {
    return this.storeAdapter.getProductBySKU(sku)
  }

  applyTpl(selector, tpl, data) {
    var template = tpl;
    return new Promise((resolve, reject) => {
      console.log(tpl)
      if ( tpl.isFulfilled() ) {
        // if template is ready just pass along data
        resolve(data);
      } else {
        // wait for template to load
        return tpl.then(() => { return data; })
      }
    })
    .then((data) => {
      var tpl = template.value();
      var html = tpl(Object.assign({cart: this.cart }, data))
      var container = (typeof selector == 'string')?document.querySelector(selector):selector;
      console.log('container', container)
      container.innerHTML = html

      return true;
    })

  }

  _emitUpdated() {
    this.emit('updated')
    this._lastTotalItems = this.totalItems
    this._lastTotalCount = this.totalCount
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

  /**
   * Kickstarts the cart logic. This causes session data to be downloaded while
   * the cart is populated from a past session. Also feeds are initialized here
   * to start consuming product listing and cart data.
   */
  bootstrap() {
    // initilize store adapter
    return this.storeAdapter.init()
      .then((resp) => {
        if ( resp.success ) {
          // rebuilding cart from session data
          var jobs = []

          for(var i in resp.data.items) {
            var itm = resp.data.items[i]

            jobs.push(function(itm) {

              return this.storeAdapter.getProductBySKU(itm.sku)
                .then((product) => {
                  if ( product ) {

                    var item = {
                      product: product,
                      qty: itm.qty,
                      options: itm.options,
                      id: itm.id,
                      unit: product.price,
                      total: product.price * itm.qty
                    }

                    this._cart.push(item)
                    return item;
                  }

                  return false;
                });

            }.bind(this, itm)())
          }

          return Promise.join.apply(Promise, jobs).then(() => {
            // we are ready to go, kick off feeds
            this.emit('init')
            // update all feeds of new data
            this._emitUpdated()
          })
        }
      }) /* eof this.storeAdapter.init().then() */
      .catch((err) => {
        console.error("Could not initialize Store Adapter!")
        console.error(err)
      }) /* eof this.storeAdapter.init().catch() */

  } /* eof bootstrap() */

}

Handlebars.registerHelper('eachEven', function(arr, scope) {
  if ( arr && arr.length > 0 ) {
    var buffer = "";
    for(var i = 0; i < arr.length; i++) {
      var item = arr[i]
      item.$index = i
      item.$is_even = (i % 2) == 0
      buffer += scope.fn(item)
    }
    return buffer;
  } else {
    return scope.inverse(this)
  }
})

Handlebars.registerHelper('is_even', function(value, scope) {
  if ( (value % 2) == 0 ) {
    return scope.fn(this)
  } else {
    return scope.inverse(this);
  }
})

Handlebars.registerHelper('is_odd', function(value, scope) {
  if ( (value % 2) == 1 ) {
    return scope.fn(this)
  } else {
    return scope.inverse(this);
  }
})

Handlebars.registerHelper('currency', function(value, ctx) {

  var context = ctx?(ctx.cart?ctx:this):this

  if ( context.cart === undefined ) {
    console.error('Contexts: ', context, this)
    throw new Error('Cart not found in current context.')
  }
  if ( value === undefined ) {
    return '';
  }

  return context.cart.storeAdapter.formatCurrency(value)
})

module.exports = {
  AwesomeCart: AwesomeCart,
  DemoStoreaAdapter: DemoStoreaAdapter,
  StoreAdapter: StoreAdapter,
  getTemplate: function(url) {
    return xhr.get(url).then((resp) => {
      // compile template and return
      return Handlebars.compile(resp.body)
    })
  },
  parseHash: function() {
    var args = {},
        pair = null,
        parts = decodeURIComponent(window.location.hash.replace('#', '')).trim().split('&')
    for(var i in parts) {
      pair = parts[i].split('=');
      if ( pair.length > 1 ) { args[pair[0].trim()] = pair[1].trim(); }
    }
    return args;
  },
  Handlebars: Handlebars,
  Promise: Promise,
  get: xhr.get,
  post: xhr.post
}
