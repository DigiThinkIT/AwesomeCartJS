const debug = require('./debug');
const {log, error} = debug;
const utils = require('./utils')
const {sargs, xhr, uuid} = utils;
const EventEmitter = require('eventemitter2').EventEmitter2;
const Promise = require('BlueBird')
const _ = require('lodash')

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

module.exports = {
	DataStore: DataStore
}
