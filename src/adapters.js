const debug = require('./debug');
const {log, error} = debug;
const utils = require('./utils')
const {sargs, xhr, uuid} = utils;
const {Feed, ProductFeed, CartFeed} = require('./feeds');
const {DataStore} = require('./DataStore');
const EventEmitter = require('eventemitter2').EventEmitter2;
const Promise = require('BlueBird')
const _ = require('lodash')


/**
 * The base store adapter class. All adapters are required to extend from this class.
 */
class StoreAdapter extends EventEmitter {
	constructor() {
		super()
		this._totals = {
			grand_total: 0
		}
		this._discounts = null;
	}

	init() {
		return new Promise((resolve, reject) => {
			resolve({data: [], success: true})
		})
	}

	getTotals() { return this._totals; }
	getDiscounts() { return this._discounts; }
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

module.exports = {
	StoreAdapter: StoreAdapter,
	DemoStoreaAdapter: DemoStoreaAdapter
}
