"use strict";
/**
 * @module awc
 */

const {log, error} = require('./debug');
const {sargs, hasClass, addClass, hasAttr, setAttr, getAttr, debug, xhr, uuid} = require('./utils');
const EventEmitter = require('eventemitter2').EventEmitter2;
const Promise = require('BlueBird')
const Handlebars = require('handlebars')
const queryString = require('query-string')
//const uuid = require('node-uuid')
const _ = require('lodash')

xhr.get = Promise.promisify(xhr.get)
xhr.post = Promise.promisify(xhr.post)

/**
 * The base store adapter class. All adapters are required to extend from this class.
 */
class StoreAdapter extends EventEmitter {
  constructor() {
    super()
    this._totals = {
      grand_total: 0
    }
  }

  init() {
    return new Promise((resolve, reject) => {
      resolve({data: [], success: true})
    })
  }

  getTotals() { return this._totals; }
  getCurrency() { return null; }
  getCurrencySymbol() { return null; }
  formatCurrency(currency) { return null; }
  getProductBySKU(sku, detailed) { return null; }

  /**
   * Implements feting products from a backend.
   */
  fetchProducts(tags, terms, start, limit) { return null; }

  /**
   * Implements session fetching from a backend
   */
  fetchCartSession() { return null; }
  /**
   * Session actions sent to a backend.
   * Expected actions are:
   *  - addToCart
   *  - removeFromCart
   */
  sessionAction(action, data) { return null; }
  /**
   * This is an optional method to implement js based templates from your own
   * backend. The returning value should be a BlueBird promise.
   */
  loadTemplate(name) { return null; }
  /**
   * Used when the cart needs to be validate before checkout.
   * This method can be used as an opportunity to further modify cart data and
   * submit checkout request to the server on validation.
   * Return null on success or any other object with error information.
   */
  validate() {}
}

/**
 * Handlebars wrapper to add custom features to our templates
 */
class Template extends EventEmitter {

  constructor(tpl, cart) {
    super();

    this._cart = cart;
    this._waitFor = [];
    this.resource = tpl;
  }

  promiseReady() {
    return new Promise((resolve, reject) => {
      this.resource.then(() => {
        resolve(this);
        return true;
      })
      .catch((err) => {
        reject(err);
        return false;
      })
    })
  }

  updateWaitFor(prm) {
    this._waitFor.push(prm)
  }

  beginRender(context) {
    var tpl = this.resource.value();
    this.emit('tpl-start-render');

    return tpl(Object.assign({
      $cart: this._cart,
      $parent: this
    },context))
  }

  endRender() {
    if ( this._waitFor.length > 0 ) {
      return Promise.join.apply(Promise, this._waitFor)
        .then(() => {
          this._waitFor = [] // reset wait list
          this.emit('tpl-end-render');
          this.emit('tpl-ready')
          return true;
        })
    }

    return new Promise((resolve, reject) => {
      this.emit('tpl-end-render');
      this.emit('tpl-ready')
      resolve(true);
    });

  }

  isFulfilledPassthrough(data) {
    var base = this;
    return (result) => {
      if ( base.resource.isFulfilled() ) {
        // if template is ready just pass along results
        if ( data ) {
          return data;
        }

        return result;
      } else {
        // wait for template to load
        return new Promise((resolve, reject) => {
          base.resource
            .then(() => {
              if ( data ) {
                resolve(data);
              } else {
                resolve(result)
              }
            })
            .catch((err) => { reject(err) })
        })
      }
    }
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

  getProductBySKU(sku, detailed) {
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
    let { tags: tags, terms: terms, start: start, limit: limit } = sargs(arguments,
      { arg: 'tags', default: [] },
      { arg: 'terms'},
      { arg: 'start', default: 0},
      { arg: 'limit', default: 9}
    )

    return new Promise((function(resolve, reject) {
      var products = [];
      //for(var i in this._products) {
      for(var i = start; i < start + limit; i++) {
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
      {arg: 'options', default: {}}
    )

    this.cart = args.cart
    this.name = args.name
    try {
      this.options = sargs(args.options,
        { arg: 'dataSource', required: 1 },
        { arg: 'idField', default: 'id' },
        { arg: 'container', required: 1 },
        { arg: 'tpl', required: 1 },
        { arg: 'filters', default: []},
				{ arg: 'sort', default: null }
      );
    } catch(err) {
      //Error.captureStackTrace(err, Feed);
      throw err
    }

    this._waitFor = []

    this.cart.on('init', this.onInit.bind(this))
  }

  onInit() {
    this.update()
  }

  updateWaitFor(prm) {
    this._waitFor.push(prm)
  }

  update() {
    this.emit('update', this)

    this.options.dataSource(this.filters)
      .then(this.options.tpl.isFulfilledPassthrough())
			.then((result) => {
				if ( this.options.sort ) {
					return result.sort(this.options.sort);
				}
				return result;
			})
      .then((result) => {
        this.items = [];
        this.empty()

        var count = 0;
        for(var i in result) {
					this.items.push(result[i]);
          //this.items[result[i][this.options.idField]] = result[i]
          count++;
        }

        var obj = {
          items: this.items,
          is_empty: count == 0
        }
        var html = this.options.tpl.beginRender(obj)
        this.container.insertAdjacentHTML('beforeend', html)
        this.emit('tpl-inserted')

        this.options.tpl.once('tpl-end-render', () => {
          this.emit('updated', this, this.products);
        })

        return this.options.tpl.endRender();
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
      throw new Error('Invalid container for feed "'+this.name+'"')
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
    this.update()
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
   * Returns stored totals. These values should be set and calculated by the store adapter.
   */
  get totals() {
    return this.storeAdapter.getTotals();
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
      var consider = true;

      // don't count sub items
      if ( this._cart[i].options && this._cart[i].options.subgroup ) {
        consider = false;
      }

      if ( consider ) {
        count += this._cart[i].qty || 0
      }
    }

    return count
  }

  get feed() {
    return this.options.feeds
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

  template(name) {
    var tpl = this.storeAdapter.loadTemplate(name)
    if ( !tpl ) {
      tpl = module.exports.loadTemplate(name)
    } if ( tpl.constructor == Template ) {
      return tpl;
    } else {
      tpl = module.exports.loadTemplate(tpl)
    }

    return new Template(tpl, this);
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
      { arg: 'filters' },
      { arg: 'container' },
      { arg: 'tpl' },
			{ arg: 'sort', default: function(a, b) { return b.price - a.price; } }
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
      { arg: 'filters' },
      { arg: 'container' },
      { arg: 'tpl' }
    )

    this.options.feeds[name] = new CartFeed(this, name, options)
    this.options.feeds[name].on('updated', this.updateUI.bind(this))
  }

  fetchCartItems(filters) {
    return new Promise((resolve, reject) => {
      // build item list considering grouped items
      var cart_items = []
      var grouped_items = {}
      for(var i in this._cart) {
        var item = this._cart[i];
        var item_tmp = {
          id: item.id,
          qty: item.qty,
          unit: item.unit,
          total: item.total,
          options: item.options,
          product: {
            name: item.product.name,
            imageUrl: item.product.imageUrl
          },
          subgroups: []
        }

        // add item as master item
        if ( item.options && item.options.group && !item.options.subgroup ) {
          // copy any groups created before this master item was found
          var subgroups_list = null;
          if ( item.options.group in grouped_items ) {
            subgroups_list = grouped_items[item.options.group].subgroups;
          }

          // assign master item
          grouped_items[item.options.group] = item_tmp;

          // copy groups found before this master item was created
          if ( subgroups_list ) {
            item_tmp.subgroups = subgroups_list;
          }
        }

        // add subgroup items to master item
        if ( item.options && item.options.group && item.options.subgroup ) {
          // create the master item object if not found
          if ( !(item.options.group in grouped_items) ) {
            grouped_items[item.options.group] = { subgroups: [] }
          }

          // find subgroup by name
          var subgroup = null;
          for(var gidx in grouped_items[item.options.group].subgroups) {
            if ( grouped_items[item.options.group].subgroups[gidx].name == item.options.subgroup ) {
              subgroup = grouped_items[item.options.group].subgroups[gidx];
              break;
            }
          }

          // if no subgroup is found create it
          if ( !subgroup ) {
            subgroup = {
              name: item.options.subgroup,
              items: []
            }
            grouped_items[item.options.group].subgroups.push(subgroup);
          }

          // finaly add subgroup item into master item
          subgroup.items.push(item_tmp);

        } else {
          cart_items.push(item_tmp)
        }
      }

      resolve(cart_items)
      return null;
    })
  }

  _onFromIdChange(el, btn, e) {
    setAttr(btn, 'data-awc-id', el.value);
  }

  _onOptionElChange(el, data, e) {
    // build hash from selectors in the order specified
    var optionHash = [];
    for(var i = 0; i < data.selectors.length; i++) {
      var selector = data.selectors[i];
      var elems = document.querySelectorAll(selector)
      if ( elems.length > 0 ) {
        var optionEl = elems[0];
        optionHash.push(optionEl.value)
      }
    }
    var optionHash = optionHash.join(',')
    var sku = data.hashes[optionHash]
    // update sku on add to cart button
    setAttr(data.btn, 'data-id', sku)
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
        // track id value from selector and update this btn data-awc-id value
        // on changes
        if ( hasAttr(btn, 'data-awc-id-from') ) {
          var fromSelector = getAttr(btn, 'data-awc-id-from');
          var fromEl = document.querySelectorAll(fromSelector);
          if ( fromEl.length > 0 ) {
            fromEl = fromEl[0];
            fromEl.addEventListener('change', this._onFromIdChange.bind(this, fromEl, btn));
          }
        }

        if ( hasAttr(btn, 'data-awc-options') ) {
          var optionData = {
            selectors: getAttr(btn, 'data-awc-options-selectors').split(',').filter((n) => { return n != undefined && n != "" }),
            hashes: JSON.parse(getAttr(btn, 'data-awc-options-hashes')),
            btn: btn
          }

          for(var i = 0; i < optionData.selectors.length; i++) {
            var selector = optionData.selectors[i];

            // find this option element
            var elems = document.querySelectorAll(selector)
            if ( elems.length > 0 ) {
              var optionEl = elems[0];
              optionEl.addEventListener('change', this._onOptionElChange.bind(this, optionEl, optionData))
            }
          }

          // trigger change event to make sure our sku ids are set for default selections
          this._onOptionElChange.bind(this, optionEl, optionData)();
        }
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
    debug.group("On Remove From Cart", () => {
      var btn = e.target;
      var id = btn.dataset.id;
      debug.info("Btn Element: ", btn);
      debug.info("Data set id %s", id);
      this.removeFromCart(id)
        .catch((err) => {
          console.dir(btn, id, btn.dataset)
          console.error(err)
        })
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

  validate() {
    this.storeAdapter.validate.apply(this.storeAdapter, arguments);
  }

  /**
   * Adds a product to the cart by its sku and qty amount.
   * @param sku string      The product sku to track in the cart.
   * @param qty int         The product qty to add to cart.
   * @param options object  Customization options associated with product
   */
  addToCart() {
    var base = this;
    // check if passing an array first
    var in_args = [];
    if ( arguments[0].constructor === Array ) {
      in_args = arguments[0];
    } else {
      in_args = [Array.from(arguments)];
    }

    var items = [];
    var payload = [];
    var items_added = [];
    var get_sku_promises = [];
    for(var in_args_idx in in_args) {
      var arg_item = in_args[in_args_idx];

      var args = sargs(arg_item,
        { arg: 'sku', required: 1 },
        { arg: 'qty', default: 1 },
        { arg: 'options', default: {}}
      );

      // isolate to keep references from messing with each other
      (function(args, get_sku_promises) {
        // fetch all products info before sending to adapter
        get_sku_promises.push(base.storeAdapter.getProductBySKU(args.sku)
          .then((product) => {
            if ( product ) {

              var item;

              items.push(item = {
                product: product,
                qty: args.qty,
                options: args.options,
                id: uuid(),
                unit: product.price,
                total: product.price * args.qty
              })

              payload.push({
                id: item.id,
                qty: item.qty,
                sku: item.product.sku,
                options: item.options || {}
              })

              base._cart.push(item)
              return true;
            }

            return false
          }));
      }(args, get_sku_promises));

    }

    // wait for all sku promises to resolve
    return Promise.join.apply(Promise, get_sku_promises)
      .then(() => {
        // now send bulk action
        return this.storeAdapter.sessionAction('addToCart', payload)
          .then((resp) => {
            for(var i in resp) {
              for(var j in items) {
                if ( items[j].id == resp[i].old_id ) {
                  // update local cart info with adapter data

                  items[j].id = resp[i].id;
                  items[j].qty = resp[i].qty;
                  items[j].sku = resp[i].sku;
                  items[j].options = resp[i].options;

                  if ( items[j].id != resp[i].old_id ) {
                    items_added.push(items[j]);
                  }
                  break;
                }
              }
            }
            return resp
          })
          .catch((err) => {
            console.error("Error adding items to cart", err);
          })
      })
      .then(() => {
        this._emitUpdated()
        this.emit("after-add-to-cart", items_added)
        debug.table(this._cart);
        return true
      })
  }

  removeFromCart(id) {
    return new Promise((resolve, reject) => {
      if ( !id ) {
        reject("Invalid id")
      } else {
        _.remove(this._cart, (item) => {
          return item.id == id;
        })

        debug.info("Sending removeFromCart request");
        return this.storeAdapter.sessionAction(
          'removeFromCart',
          { id: id }
        ).then((resp) => {
          for(var resp_idx in resp) {
            var id = resp[resp_idx];
            var remove_me = null;
            for(var cart_idx in this._cart) {
              if ( this._cart[cart_idx].id == id ) {
                remove_me = this._cart[cart_idx].id
                break;
              }
            }

            if ( remove_me !== null ) {
              delete this._cart[remove_me];
            }
          }
          debug.info("Server returned success");
          this._emitUpdated();
          debug.table(this._cart);
          return true;
        }).catch((err) => {
          debug.error(err);
        })

      }
    })
  }

  getProductBySKU(sku) {
    return this.storeAdapter.getProductBySKU(sku)
  }

  applyTpl(selector, tpl, data) {
    return tpl.promiseReady()
    .then(() => {
      var wait = []
      var ev = new EventEmitter({});
      var html = tpl.beginRender(data)
      var container = (typeof selector == 'string')?document.querySelector(selector):selector;
      container.innerHTML = html
      this.emit('tpl-inserted');

      // TODO: this shoudl be deprecated once new Template class is integrated
      //       Remember to remove.
      tpl.once('tpl-end-render', () => {
        this.emit('tpl-ready')
      })

      return tpl.endRender()
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
            return true;
          })
        } else {
          return false;
        }
      }) /* eof this.storeAdapter.init().then() */
      .catch((err) => {
        console.error("Could not initialize Store Adapter!")
        console.error(err)
      }) /* eof this.storeAdapter.init().catch() */

  } /* eof bootstrap() */

}

function delayedTpl(id, tpl_name, obj) {
  var t = cart.template(tpl_name);
  var tpl_promise = t
    .promiseReady()
    .then((tpl) => {
      var html = tpl.beginRender(obj)
      var container = document.getElementById(id)
      if ( container ) {
        container.innerHTML = html
        container.className = "awc-placeholder loaded"

        return tpl.endRender();
      } else {
        return false;
      }
    })

    obj.$parent.updateWaitFor(tpl_promise)
}

Handlebars.registerHelper("eq", function(left, right, scope) {
  return left == right;
})

Handlebars.registerHelper("ne", function(left, right, scope) {
  return left != right;
})

Handlebars.registerHelper("gt", function(left, right, scope) {
  return left > right;
})

Handlebars.registerHelper("lt", function(left, right, scope) {
  return left < right;
})

Handlebars.registerHelper("ge", function(left, right, scope) {
  return left >= right;
})

Handlebars.registerHelper("le", function(left, right, scope) {
  return left <= right;
})

Handlebars.registerHelper("or", function(left, right, scope) {
  return left || right;
})

Handlebars.registerHelper("and", function(left, right, scope) {
  return left && right;
})

Handlebars.registerHelper("template", function(tpl_name, obj, scope) {
  var id = awc.uuid()
  obj.$cart = scope.data.root.$cart
  obj.$parent = scope.data.root.$parent
  delayedTpl(id, tpl_name, obj)
  return '<div id="'+id+'" class="awc-placeholder loading"></div>';
})

Handlebars.registerHelper("json", function(value, scope) {
  return JSON.stringify(value)
})

Handlebars.registerHelper('cssEscape', function(value, scope) {
  return value.replace(/\s/g, '_')
})

Handlebars.registerHelper('eachEven', function(arr, scope) {
  if ( arr && arr.length > 0 ) {
    var buffer = "";
    for(var i = 0; i < arr.length; i++) {
      var item = arr[i]
      item.$index = i
      item.$is_first = i==0?1:0;
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

Handlebars.registerHelper('currency', function(value, scope) {

  var context = scope.data.root;

  if ( context.$cart === undefined ) {
    console.error('Contexts: ', context, this)
    throw new Error('Cart not found in current context.')
  }
  if ( value === undefined ) {
    return '';
  }

  return context.$cart.storeAdapter.formatCurrency(value)
})

module.exports = {
  debug: debug,
  AwesomeCart: AwesomeCart,
  DemoStoreaAdapter: DemoStoreaAdapter,
  StoreAdapter: StoreAdapter,
  loadTemplate: function(url) {
    if ( typeof url == "string" ) {
      return xhr.get(url).then((resp) => {
        // compile template and return
        return Handlebars.compile(resp.body)
      })
    } if ( url.contructor == Template ) {
      url = url.resource;
    }

    return url.then((resp) => {
      if ( typeof resp == "string" ) {
        return Handlebars.compile(resp)
      } else {
        return resp
      }
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
  uuid: uuid,
  get: xhr.get,
  post: xhr.post,
  Template: Template
}

// To be deprecated
module.exports.getTemplate = module.exports.loadTemplate

var _required = {};
module.exports.require = function(url) {
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
    })

  return _required[url];
}
