const debug = require('./debug');
const {log, error} = debug;
const utils = require('./utils')
const {sargs, xhr, uuid} = utils;
const EventEmitter = require('eventemitter2').EventEmitter2;
const Promise = require('BlueBird')

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

module.exports = {
	Feed: Feed,
	ProductFeed: ProductFeed,
	CartFeed: CartFeed
}
