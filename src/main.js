"use strict";
/**
 * @module awc
 */
require("babel-polyfill"); // polyfill for browsers missing features
const {log, error} = require('./debug');
const {sargs, queryAll, hasClass, addClass, removeClass, hasAttr, setAttr, getAttr, debug, xhr, uuid} = require('./utils');
const {htmlEncode, htmlDecode} = require('./html');
const EventEmitter = require('eventemitter2').EventEmitter2;
const Promise = require('BlueBird')
const Handlebars = require('handlebars')
const queryString = require('query-string')
//const uuid = require('node-uuid')
const _ = require('lodash')

// promisify ajax request type
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
		this._freezeHeight = 0;
		this._lastUnfreeze = null;

		this.cart.on('init', this.onInit.bind(this))

		if ( this.options.dataSource.constructor === DataStore ) {
			this.options.dataSource.on('updated', this.update.bind(this))
		}
	}

	onInit() {
		this.update()
	}

	updateWaitFor(prm) {
		this._waitFor.push(prm)
	}

	update() {
		this.emit('update', this)

		var dataSource = this.options.dataSource

		if ( typeof dataSource != 'function' ) {
			// assume this is a DataStore instance
			// TODO: replace the use of function data source in favor
			//       of the DataStore class instance
			dataSource = this.options.dataSource.query.bind(this.options.dataSource);
		}

		dataSource(this.filters)
			.then(this.options.tpl.isFulfilledPassthrough())
			.then((result) => {
				if ( this.options.sort ) {
					return result.sort(this.options.sort);
				}
				return result;
			})
			.then((result) => {
				this.items = [];

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
				this.freezeHeight();
				this.empty()
				this.container.insertAdjacentHTML('beforeend', html)
				this.emit('tpl-inserted')

				this.options.tpl.once('tpl-end-render', () => {
					this.emit('updated', this, this.products);
					this.unfreezeHeight();
				})

				return this.options.tpl.endRender();
			})
			.catch((err) => {
				debug.error(err)
				//TODO: Handle errors
			});
	}

	get container() {
		return document.querySelector(this.options.container)
	}

	freezeHeight() {

		if ( this._freezeHeight > 0 ) {
			return;
		}

		this._freezeHeight += 1;
		var container = this.container;

		if ( !container ) {
			throw new Error('Invalid container for feed "'+this.name+'"')
		}

		var containerHeight = container.clientHeight;
		container.style.height = containerHeight + "px";
	}

	unfreezeHeight() {
		if ( this._freezeHeight > 1 ) {
			this._freezeHeight -= 1;
			return;
		}
		this._freezeHeight -= 1;
		if ( this._freezeHeight < 0 ) {
			this._freezeHeight = 0;
		}

		var container = this.container;

		if ( !container ) {
			throw new Error('Invalid container for feed "'+this.name+'"')
		}

		// elements need time to resize after rendering(specially images)
		// allow a 200ms delay before unfreezing container height
		if ( this._lastUnfreeze ) {
			clearTimeout(this._lastUnfreeze);
		}
		this._lastUnfreeze = setTimeout(() => {
			container.style.height="";
			this._lastUnfreeze = null;
		}, 200);
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

class DataStore extends EventEmitter {
	constructor(data, queryFn, formatFn) {
		super();

		this._data = data || [];
		this._lastQueryArgs = null;
		this._lastFilter = null;
		this._queryFn = queryFn;
		this._formatFn = formatFn;
		this._lastQuery = null;
		this._eventsOff = 0;
	}

	get data() {
		return this._data;
	}

	eventsOff() {
		this._eventsOff++;
	}

	eventsOn() {
		if ( this._eventsOff > 0 ) {
			this._eventsOff--;
			if ( this._eventsOff == 0 ) {
				this.emit("refresh", this);
			}
		}
	}

	emit() {
		if ( this._eventsOff == 0 ) {
			return super.emit.apply(this, arguments);
		}
	}

	query(filter) {
		if ( this._queryFn ) {

			var hash = JSON.stringify(filter);

			if ( this._lastFilter && this._lastFilter == hash ) {
				return this._lastQuery;
			}

			this._lastFilter = hash;
			this._lastQuery = this._queryFn(filter)
				.then((resp) => {
					this._data = resp;
					this.emit("refresh", this)
					if ( this._formatFn ) {
						return this._formatFn(this._data)
					}

					return resp;
				})

			return this._lastQuery;
		} else {
			debug.warn("This DataStore has no query function");
		}

		return new Promise((resolve, reject) => {
			resolve(base._data);
		})
	}

	find(filter) {
		return _.find(this._data, filter);
	}

	update(data) {
		var row = _.find(this._data, { id: data.id });
		if ( row ) {
			_.merge(row, data);
			this.emit("update", this, row)
		} else {
			this._data.push(data)
			this.emit("insert", this, data)
		}

		return this;
	}

	remove(filter) {
		var removed = _.remove(this._data, filter )
		this.emit("remove", this, removed)
		return removed;
	}

}

/**
 * The main cart class. All managing of shopping cart happens here.
 */
class AwesomeCart extends EventEmitter {
	constructor() {
		super()
		this._cart = new DataStore([], this._queryCart.bind(this), this.fetchCartItems.bind(this))
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

		this._cart.on("update", this._onCartDataUpdate.bind(this));
		this._cart.on("insert", this._onCartDataInsert.bind(this));
		this._cart.on("remove", this._onCartDataRemove.bind(this));
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
		return this._cart.data.length
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
		for(var i in this._cart.data) {
			var consider = true;

			// don't count sub items
			if ( this._cart.data[i].options && this._cart.data[i].options.subgroup ) {
				consider = false;
			}

			if ( consider ) {
				count += this._cart.data[i].qty || 0
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
		return this._cart.data
	}

	_onCartDataUpdate(store, row) {
		debug.log("On cart update", arguments);

		var allowedFields = ["id", "qty", "sku"]
		var payload = {};
		_.each(allowedFields, (f) => {
			payload[f] = row[f];
		})

		return this.storeAdapter.sessionAction('updateItem', [payload])
			.then((result) => {
				if ( result.shipping_rates ) {
					var hash = JSON.stringify(result.shipping_rates);
					if ( this._shipping_rates_cache != hash ) {
						this._shipping_rates_cache = hash;
						this.emit("shipping_rates", result.shipping_rates);
					}
				}

				this._updateBulkCartData(result)
					.then(() => {
						this._emitUpdated();
					})

			})
	}

	_onCartDataInsert(store, row) {
		debug.log("On cart insert", arguments);
	}

	_onCartDataRemove(store, row) {
		debug.log("On cart remove", arguments);
	}

	_updateBulkCartData(data) {
		// we expect data to look like:
		// { data: [<array of items>], removed: [<array of removed ids>]}

		var jobs = []

		this._cart.eventsOff();

		if ( data.removed ) {
			this._cart.remove((item) => {
				return data.removed.indexOf(item.id) > -1;
			});
		}

		_.each(data.data, (itm) => {
			// wrap promise so we always resolve even on errors while fetching
			// product details so that we don't kill the shopping cart ui
			jobs.push((function(itm) {
				return new Promise((resolve, reject) => {
					this.storeAdapter.getProductBySKU(itm.sku)
						.then((product) => {
							if ( product ) {
								var item = {
									product: product,
									qty: itm.qty,
									id: itm.id,
									unit: itm.unit,
									total: itm.total
								}
								if ( itm.options ) {
									item.options = itm.options
								}
								// update cart item with product detail
								this._cart.update(item)
								resolve(item)
							}

							resolve(false);
						}) // eof - getProductBySKU.then
						.catch((err) => {
							debug.error("Error fetching product details during cart item update for item", itm)
							debug.error(err);
							resolve(false)
						}) // eof - getProductBySKU.catch
					}) // eof - new promise
				}).bind(this)(itm)) // eof - job.push
		});

		return Promise.all(jobs).then(() => {
			this._cart.eventsOn();
			return true;
		})
		.catch((err) => {
			this._cart.eventsOn();
			debug.error("Error while updating cart items")
			debug.error(err)
		})
	}

	formatCurrency(price) {
		return this.storeAdapter.formatCurrency(price);
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

		var tpl_instance = new Template(tpl, this);
		tpl_instance.on('tpl-end-render', this._on_tpl_end_render.bind(this));

		return tpl_instance;
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
			{ arg: 'dataSource', default: this.storeAdapter.products }, //.fetchProducts.bind(this.storeAdapter) },
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
			{ arg: 'dataSource', default: this._cart },
			{ arg: 'idField', default: 'id' },
			{ arg: 'filters' },
			{ arg: 'container' },
			{ arg: 'tpl' }
		)

		this.options.feeds[name] = new CartFeed(this, name, options)
		this.options.feeds[name].on('updated', this.updateUI.bind(this))
	}

	_queryCart(filters) {
		// dymmy query fn for now, need to implement filtering
		return new Promise((resolve) => { resolve(this._cart.data); })
	}

	fetchCartItems(filters) {
		return new Promise((resolve, reject) => {
			// build item list considering grouped items
			var cart_items = []
			var grouped_items = {}
			for(var i in this._cart.data) {
				var item = this._cart.data[i];
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

	_validateChildOptions(data, optionIdx, optionHash) {
		var optionSelector = data.selectors[optionIdx + 1];
		if ( !optionSelector ) {
			return;
		}

		var optionEl = queryAll(optionSelector);
		if ( optionEl.length > 0 ) {
			optionEl = optionEl[0];

			for(var i = 0; i < optionEl.length; i++) {
				var opEl = optionEl.options[i]
				var value = htmlDecode(opEl.value);
				optionHash[optionIdx + 1] = value;

				var hash = optionHash.join(',')
				var sku = data.hashes[hash]
				if ( sku === undefined ) {
					// option hash is not valid. We'll disable this option;
					setAttr(opEl, "disabled", "disabled")
				} else {
					opEl.removeAttribute("disabled");
				}
			}
		}
	}

	_onOptionElChange(el, data, e) {
		// build hash from selectors in the order specified
		// this does two things:
		// - Builds a hash index to fetch the sku of the selcted product
		// - Builds the first half of a similar index to later test all other
		//   options that come after to enable/dissable values.

		var optionHash = [];
		var selectorIdx = -1;
		for(var i = 0; i < data.selectors.length; i++) {
			var selector = data.selectors[i];
			var elems = queryAll(selector)
			if ( elems.length > 0 ) {
				var optionEl = elems[0];
				var value = htmlDecode(optionEl.value);
				if ( optionEl == el ) {
					selectorIdx = i;
				}
				optionHash.push(value)
			}
		}
		var hash = optionHash.join(',')
		var sku = data.hashes[hash]
		var price_selector = data.price_selector
		// update sku on add to cart button
		setAttr(data.btn, 'data-id', sku)

		if ( price_selector ) {
			var priceEls = queryAll(price_selector);
			if ( priceEls.length > 0 ) {
				var priceEl = priceEls[0];
				this.getProductBySKU(sku)
					.then((p) => {
						debug.log(p)
						priceEl.textContent = this.storeAdapter.formatCurrency(p.price);
						return p;
					})
			}
		}


		this._validateChildOptions(data, selectorIdx, optionHash);
		data.validate()

	}

	_onAdjustQtyChange(el, options, e) {
		this._cart.update({ id: options.item_id, qty: parseInt(el.value) });
	}

	_validateAddToCartBtn(btn, btn_options) {

		var sku = getAttr(btn, 'data-id');
		var valid = true;

		if ( sku === undefined ) {
			valid = false;
		}

		if ( btn_options.custom_fields ) {
			for(var i=0; i < btn_options.custom_fields.length; i++) {
				var field = btn_options.custom_fields[i];
				if ( field.required ) {
					var field_value = field.el.value;
					if ( !field_value ) {
						valid = false;
					}
				}
			}
		}

		if ( !valid ) {
			addClass(btn, 'disabled');
			addClass(btn, 'btn-disabled');
		} else {
			removeClass(btn, 'disabled');
			removeClass(btn, 'btn-disabled');
		}

	}

	/**
	 * Updates click event references and overall UI handling
	 */
	updateUI() {

		// data-awc-addtocart magic attribute
		var addToCartElems = queryAll('[data-awc-addtocart]');
		for(var i = 0; i < addToCartElems.length; i++) {
			var btn = addToCartElems[i]
			if ( !hasClass(btn, 'awc-bound') ) {
				var btn_options = {};
				addClass(btn, 'awc-bound')

				var validate_btn = this._validateAddToCartBtn.bind(this, btn, btn_options);
				btn_options.validate = validate_btn;

				// track id value from selector and update this btn data-awc-id value
				// on changes
				if ( hasAttr(btn, 'data-awc-id-from') ) {
					var fromSelector = getAttr(btn, 'data-awc-id-from');
					var fromEl = queryAll(fromSelector);
					if ( fromEl.length > 0 ) {
						fromEl = fromEl[0];
						fromEl.addEventListener('change', this._onFromIdChange.bind(this, fromEl, btn));
					}
				}

				if ( hasAttr(btn, 'data-awc-options') ) {
					var optionData = {
						price_selector: getAttr(btn, 'data-awc-price-selector'),
						selectors: getAttr(btn, 'data-awc-options-selectors').split(',').filter((n) => { return n != undefined && n != "" }),
						hashes: JSON.parse(getAttr(btn, 'data-awc-options-hashes')),
						btn: btn,
						validate: validate_btn
					}

					var firstEl = null;
					for(var i = 0; i < optionData.selectors.length; i++) {
						var selector = optionData.selectors[i];

						// find this option element
						var elems = queryAll(selector)
						if ( elems.length > 0 ) {
							var optionEl = elems[0];
							if ( firstEl == null ) {
								firstEl = optionEl;
							}
							optionEl.addEventListener('change', this._onOptionElChange.bind(this, optionEl, optionData))
						} else {
							debug.log("Could not bind to variant widget: ", selector);
						}
					}

					// trigger change event to make sure our sku ids are set for default selections
					this._onOptionElChange.bind(this, firstEl, optionData)();
				}

				if ( hasAttr(btn, 'data-awc-qty-from') ) {
					// makes sure to validate qty fields
					var qty_from = btn.dataset.awcQtyFrom; // data-awc-qty-from
					var els = [];

					try {
						els = queryAll(qty_from)
					} catch(err) {
						debug.error(err);
					}
					if ( els.length > 0 ) {
						els[0].addEventListener('change', function(e) {
							var qty = parseInt(e.target.value); // get qty from referenced element
							if ( isNaN(qty) ) {
								qty = 1;
							}
							e.target.value = qty;
						})
					}
				}

				// ex: data-awc-custom-fields="#myfields-container"
				if ( hasAttr(btn, 'data-awc-custom-fields') ) {
					var fields = btn.dataset.awcCustomFields;
					try {
						// find all custom fields inside container
						els = queryAll(fields+" [data-awc-custom-field]");
					} catch(err) {
						debug.error(err);
					}

					if ( els.length > 0 ) {
						var custom_fields = []
						for(var i=0; i < els.length; i++) {
							custom_fields.push({
								field_name: els[i].dataset.awcCustomField,
								required: els[i].dataset.awcRequired == 'yes',
								el: els[i]
							})

							els[i].addEventListener("change", validate_btn);
						}

						btn_options["custom_fields"] = custom_fields;
					}
				}

				btn.addEventListener('click', this._onAddToCartClick.bind(this, btn_options));

				validate_btn()
			}
		}

		// data-awc-removefromcart magic attribute
		var removeFromCartElems = queryAll('[data-awc-removefromcart]');
		for(var i = 0; i < removeFromCartElems.length; i++) {
			var btn = removeFromCartElems[i]
			if ( !hasClass(btn, 'awc-bound') ) {
				btn.addEventListener('click', this._onRemoveFromCartClick.bind(this))
				addClass(btn, 'awc-bound')
			}
		}

		// data-awc-adjustqty magic attribute
		var adjustQtyElems = queryAll('[data-awc-adjustqty]');
		for(var i = 0; i < adjustQtyElems.length; i++) {
			var el = adjustQtyElems[i]

			if ( !hasClass(el, 'awc-bound') ) {

				var options = {
					item_id: el.dataset.awcId || el.dataset.id
				}

				if ( options.item_id === undefined ) {
					debug.warn("data-awc-adjustqty requires to be paired with data-awc-id or data-id to function", el)
				}

				options.item_id = htmlDecode(options.item_id);
				el.addEventListener('change', this._onAdjustQtyChange.bind(this, el, options))
				addClass(el, 'awc-bound')
			}
		}

	}

	_onAddToCartClick(btn_options, e) {

		btn_options.validate(e);

		var btn = e.target;
		var sku = htmlDecode(btn.dataset.id);
		var qty = btn.dataset.qty || btn.dataset.awcQty || undefined;

		if ( qty === undefined ) {
			var qty_from = btn.dataset.awcQtyFrom; // data-awc-qty-from
			var els = [];

			try {
				els = queryAll(qty_from)
			} catch(err) {
				debug.error(err);
			}

			if ( els.length > 0 ) {
				qty = parseInt(els[0].value); // get qty from referenced element
				if ( isNaN(qty) ) {
					qty = 1;
				}
				els[0].value = qty;
			} else {
				debug.warn("Could not get qty from ", qty_from);
				qty = 1; // default to 1
			}
		}

		var options = btn.dataset.awcOptions;

		if ( hasClass(btn, 'disabled') ) {
			// ignore clicks on disabled buttons
			return;
		}

		if ( options && options instanceof String ) {
			options = queryString.parse(options)
		}


		if ( btn_options.custom_fields ) {
			if ( !options ) {
				options = { };
			}

			if ( !options.custom ) {
				options["custom"] = {};
			}

			for(var i=0; i < btn_options.custom_fields.length; i++) {
				var field = btn_options.custom_fields[i];
				var field_value = field.el.value;
				options.custom[field.field_name] = field_value;
			}
		}

		this.addToCart(sku, qty, options)
	}

	_onRemoveFromCartClick(e) {
		debug.group("On Remove From Cart", () => {
			var btn = e.target;
			var id = btn.dataset.id;
			debug.debug("Btn Element: ", btn);
			debug.debug("Data set id %s", id);
			this.removeFromCart(id)
				.catch((err) => {
					debug.debug(btn, id, btn.dataset)
					debug.error(err)
				})
		})
	}

	validate() {
		this.storeAdapter.validate.apply(this.storeAdapter, arguments);
	}

	adjustQty(id, qty) {
		this._cart.update({ id: id, qty: qty})
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
				{ arg: 'options', default: {} }
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

							base._cart.data.push(item)
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
						for(var i in resp.data) {
							var resp_item = resp.data[i];

							var itm = null;
							itm = base._cart.find({ id: resp_item.old_id })

							if ( itm ) {
								itm.id = resp_item.id;
								itm.qty = resp_item.qty;
								itm.sku = resp_item.sku;
								itm.options = resp_item.options;
								itm.unit = resp_item.unit;
								itm.total = resp_item.total;
							}

						}
						return resp
					})
					.catch((err) => {
						debug.error("Error adding items to cart", err);
					})
			})
			.then(() => {
				this._emitUpdated()
				debug.table(this._cart.data);
				this.emit("add-to-cart-completed")
				return true
			})
	}

	removeFromCart(id) {
		return new Promise((resolve, reject) => {
			if ( !id ) {
				reject("Invalid id")
			} else {
				_.remove(this._cart.data, (item) => {
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
						for(var cart_idx in this._cart.data) {
							if ( this._cart.data[cart_idx].id == id ) {
								remove_me = this._cart[cart_idx].id
								break;
							}
						}

						if ( remove_me !== null ) {
							delete this._cart.data[remove_me];
						}
					}
					debug.info("Server returned success");
					this._emitUpdated();
					debug.table(this._cart.data);
					return true;
				}).catch((err) => {
					debug.error(err);
				})

			}
		})
	}

	calculate_shipping(rate_name, address) {
		// TODO: Deprecate this method for camel case version

		return this.storeAdapter.sessionAction("calculate_shipping", { name: rate_name, address: address })
		.then((data) => {
			var hash = JSON.stringify(data.shipping_rates);
			this.emit("shipping_rates", data.shipping_rates, data);

			this._emitUpdated()
			return data;
		})
	}

	calculateShipping(rate_name, address) {
		return this.calculate_shipping(rate_name, address);
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
			//tpl.once('tpl-end-render', () => {
			//  this.emit('tpl-ready')
			//})

			return tpl.endRender()
		})

	}

	_on_tpl_end_render() {
		// called on all templates bound to this cart
		this.emit('tpl-ready');
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

					return this._updateBulkCartData({ data: resp.data.items})
						.then(() => {
							this.emit('init');
							this._emitUpdated();
							return true;
						})

				} else {
					return false;
				}
			}) /* eof this.storeAdapter.init().then() */
			.catch((err) => {
				debug.error("Could not initialize Store Adapter!")
				debug.error(err)
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

Handlebars.registerHelper("not", function(value, scope) {
	return value?false:true;
})

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

Handlebars.registerHelper('escape', function(value, scope) {
	if ( value ) {
		return value.replace(/(['"])/g, '\\$1');
	}

	return "";
})

Handlebars.registerHelper('htmlEncode', function(value, scope) {
	return htmlEncode(value);
})

Handlebars.registerHelper('htmlDecode', function(value, scope) {
	return htmlDecode(value);
})

Handlebars.registerHelper('cssEscape', function(value, scope) {
	if ( value ) {
		return value.replace(/[^a-z0-9\-]/gi, '_')
	}

	return "";
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
		debug.error('Contexts: ', context, this)
		throw new Error('Cart not found in current context.')
	}
	if ( value === undefined ) {
		return '';
	}

	return context.$cart.storeAdapter.formatCurrency(value)
})

Handlebars.registerHelper("jsinclude", function(src, scope) {
	module.exports.require(src);
	return '';
})

module.exports = {
	debug: debug,
	AwesomeCart: AwesomeCart,
	DemoStoreaAdapter: DemoStoreaAdapter,
	StoreAdapter: StoreAdapter,
	DataStore: DataStore,
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
	Template: Template,
	htmlEncode: htmlEncode,
	htmlDecode: htmlDecode,
	_: _
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
