"use strict";
/**
 * @module awc
 */

const {log, error} = require('./debug');
const {optionals, requiredOptions, merge} = require('./utils');
const EventEmitter = require('events').EventEmitter;
const xhr = require('xhr')
const Promise = require('BlueBird')
const Handlebars = require('handlebars')
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
        imageUrl: "https://placeholdit.imgix.net/~text?txtsize=33&txt=200%C3%97150&w=200&h=150",
        description: 'First demo item',
        price: 10,
        tags: ['demo', 'first']
      },
      {
        sku: "sku001",
        name: "Demo Item2",
        imageUrl: "https://placeholdit.imgix.net/~text?txtsize=33&txt=200%C3%97150&w=200&h=150",
        description: 'Second demo item',
        price: 20,
        tags: ['demo']
      }
    ]
  }

  getCurrency() { return "USD"; }

  getCurrencySymbol() { return "$"; }

  formatCurrency(currency, decimals) { return `$${currency.toFixed(decimals)}`; }

  fetchProducts() {
    var tags, terms;
    [tags, terms] = optionals(arguments, [])

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
}

/**
 * ProductFeed manages updating product listing elements on the live webpage.
 */
class ProductFeed extends EventEmitter {

  /**
   * Instantiates a product feed
   * @arg cart string     The AwesomeCart instance
   * @arg name string     The feed name
   * @arg options object  Feed options
   */
  constructor() {
    super();
    [this.cart, this.name, this.options] = optionals(arguments, undefined, undefined, {})

    this.options = merge({
      filters: []
    }, this.options)

    if ( this.cart === undefined ) {
      throw new Error('ProductFeed requires a cart instance')
    }

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

    this.cart.on('init', this._init.bind(this))
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

  _init() {
    this.refresh()
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

  refresh() {
    this.emit('refresh', this)

    this.cart.storeAdapter
      .fetchProducts(this.filters)
      .then((result) => {
        if ( this.options.product_template.isFulfilled() ) {
          // if template is ready just pass along results
          return result;
        } else {
          // wait for template to load
          return new Promise((resolve, reject) => {
            this.options.product_template
              .then(() => { resolve(result) })
              .catch((err) => { reject(err) })
          })
        }
      })
      .then((result) => {

        this.products = {}
        this.empty()

        var tpl = this.options.product_template.value();
        result.every((p) => {
          p.addToCartBtn = this.options.cart.btnAddToCart(p)
          this.products[p.sku] = p;

          var product_html = tpl(p)
          this.emit('product-loaded', this, p, product_html)
          this.container.insertAdjacentHTML('beforeend', product_html)
          this.emit('product-added', this, p)
          return p;
        })

        this.emit('refreshed', this, this.products)
      })
      .catch((err) => {
        console.error(err)
        //TODO: Handle errors
      });
  }
}

/**
 * The main cart class. All managing of shopping cart happens here.
 */
class AwesomeCart extends EventEmitter {
  constructor() {
    super()
    var options;
    [options] = optionals(arguments, {});

    this.options = merge({
      storeAdapter: module.exports.default_store_adapter || new DemoStoreaAdapter(),
      currency_decimals: 2,
      feeds: {}
    }, options);
    this.cart = [];

    this.storeAdapter = this.options.storeAdapter;
  }

  btnAddToCart(product) {
    return `<button data-awc-addtocart data-sku="${product.sku}">Add To Cart</button>`
  }

  /**
   * Adds a new managed product feed. Product feeds automate fetching and displaying
   * product listings.
   * @arg name string     The feed name.
   * @arg options object  An object defining the feed properties and behaviour.
   */
  newProductFeed(name, options) {
    this.options.feeds[name] = new ProductFeed(this, name, options)
    this.options.feeds[name].on('refreshed', this.updateUI.bind(this))
  }

  /**
   * Updates click event references and overall UI handling
   */
  updateUI() {
    var addtocartElems = document.querySelectorAll('[data-awc-addtocart]');
    for(var i = 0; i < addtocartElems.length; i++) {
      var btn = addtocartElems[i];
      btn.addEventListener('click', this._onAddToCartClick.bind(this))
    }
  }

  _onAddToCartClick(e) {
    console.log('Add to cart', e, this)
  }

  listProducts() {
    var filters;
    [filters] = optionals(arguments, [])

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
