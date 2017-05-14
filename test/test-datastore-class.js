require('jsdom-global')()
var should = require("chai").should()
var awc = require("../src/main")

var data = []
for(var i=0; i<10; i++) {
	data.push({ id: i, data: "This is row " + i });
}

describe("DataStore class tests", () => {

	it("DataStore is defined", () => {
		should.exist(awc.DataStore);
	});

	describe("#constructor", () => {

		it("Instantiate without arguments", () => {
			(function() {
				new awc.DataStore();
			}).should.not.Throw()
		});

		it("#constructor with static data", () => {
			var ds = new awc.DataStore(data.slice());

			// make sure we have our array size intact
			ds._data.length.should.equal(10);

			// make sure each item is in order
			for(var i=0; i<10; i++) {
				ds._data[i].id.should.equal(i);
			}
		});

	});

	describe("Data Query and Manipulation", () => {

		it("#find", () => {
			var ds = new awc.DataStore(data.slice());
			// make sure we can find rows by ids
			ds.find({ id: 5}).id.should.equal(5);
		});

		it("#update - modify", () => {
			var ds = new awc.DataStore(data.slice());
			// prove we haven't modified our record yet
			ds.find({id: 1}).data.should.not.equal("modified");
			// modify record and check data changed
			ds.update({ id: 1, data: "modified"})
				.find({id: 1}).data.should.equal("modified");
		});

		it("#update - update event", (done) => {
			var ds = new awc.DataStore(data.slice());

			// prepare update event listener
			ds.on("update", function(datastore, row) {
				// returned data store should match our ds instance
				datastore.should.equal(ds)
				// upon receiving event we should have our record
				row.id.should.equal(1);
				row.data.should.equal("modified");
				done()
			});
			// modify record
			ds.update({ id: 1, data: "modified"})
		});

		it("#update - insert", () => {
			var ds = new awc.DataStore(data.slice());
			// prove we do not have an 11th record
			should.not.exist(ds.find({id: 11}))
			// insert record and check it
			ds.update({ id: 11, data: "I am new"})
				.find({id: 11}).data.should.equal("I am new");
		});

		it("#update - insert event", (done) => {
			var ds = new awc.DataStore(data.slice());

			// prepare update event listener
			ds.on("insert", function(datastore, row) {
				// returned data store should match our ds instance
				datastore.should.equal(ds)
				// upon receiving event we should have our record
				row.id.should.equal(11);
				row.data.should.equal("I am new");
				done()
			});
			// modify record
			ds.update({ id: 11, data: "I am new"})
		});

		it("#remove - one record", () => {
			var ds = new awc.DataStore(data.slice());
			// prove we have an 8th record
			should.exist(ds.find({id: 8}))
			// remove it
			var removedRecords = ds.remove({ id: 8})
			removedRecords.length.should.equal(1);
			// prove record was removed
			should.not.exist(ds.find({id: 8}));
		});


		it("#remove - one record - remove event", (done) => {
			var ds = new awc.DataStore(data.slice());

			// prepare update event listener
			ds.on("remove", function(datastore, rows) {
				// returned data store should match our ds instance
				datastore.should.equal(ds)
				// upon receiving event we should have our record
				rows.length.should.equal(1);
				rows[0].id.should.equal(1);

				// next we'll make sure the records doesn't exist
				should.not.exist(ds.find({id: 1}));
				done()
			});
			// remove record
			ds.remove({ id: 1})
		});

		it("#remove - multiple records", () => {
			var ds = new awc.DataStore(data.slice());
			// prove we have an 8th record
			should.exist(ds.find({id: 7}))
			should.exist(ds.find({id: 8}))
			should.exist(ds.find({id: 9}))
			// remove them
			var removedRecords = ds.remove((row) => { return [7, 8, 9].indexOf(row.id) > -1; });
			removedRecords.length.should.equal(3);
			// prove record was removed
			should.not.exist(ds.find({id: 7}));
			should.not.exist(ds.find({id: 8}));
			should.not.exist(ds.find({id: 9}));
		});

		it("#remove - multiple records - remove event", (done) => {
			var ds = new awc.DataStore(data.slice());

			// prepare update event listener
			ds.on("remove", function(datastore, rows) {
				// returned data store should match our ds instance
				datastore.should.equal(ds)
				// upon receiving event we should have our record
				rows.length.should.equal(3);
				rows[0].id.should.equal(7);
				rows[1].id.should.equal(8);
				rows[2].id.should.equal(9);

				// prove record was removed
				should.not.exist(ds.find({id: 7}));
				should.not.exist(ds.find({id: 8}));
				should.not.exist(ds.find({id: 9}));
				done()
			});
			// remove records
			ds.remove((row) => { return [7, 8, 9].indexOf(row.id) > -1; });
		});

	});

});
