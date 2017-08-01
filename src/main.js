"use strict";
/**
 * @module awc
 */
require("babel-polyfill"); // polyfill for browsers missing features
const debug = require('./debug');
const {log, error} = debug;
const utils = require('./utils')
const {sargs, xhr, uuid} = utils;
const {htmlEncode, htmlDecode, queryAll, hasClass, addClass, removeClass, hasAttr, setAttr, getAttr} = require('./html');
const ErrorsLib = require('./errors');
const Templating = require('./templating');
const {Feed, ProductFeed, CartFeed} = require('./feeds');
const {DataStore} = require('./DataStore');
const {Template} = Templating;
const {StoreAdapter, DemoStoreaAdapter} = require('./adapters');
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
				return Templating.Handlebars.compile(resp.body)
			})
		} if ( url.contructor == Template ) {
			url = url.resource;
		}

		return url.then((resp) => {
			if ( typeof resp == "string" ) {
				return Templating.Handlebars.compile(resp)
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
	Errors: ErrorsLib,
	Handlebars: Templating.Handlebars,
	Promise: Promise,
	uuid: uuid,
	get: xhr.get,
	post: xhr.post,
	Template: Template,
	htmlEncode: htmlEncode,
	htmlDecode: htmlDecode,
	_: _,
	require: utils.require
}

// To be deprecated
module.exports.getTemplate = module.exports.loadTemplate
