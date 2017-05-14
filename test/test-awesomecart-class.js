require('jsdom-global')()
var should = require("chai").should()
var awc = require("../src/main")

describe("AwesomeCart class tests", () => {

	describe("Class is exposed", () => {
		it("AwesomeCart is defined", () => {
			should.exist(awc.AwesomeCart);
		});
	})

	describe("#constructor", () => {
		it("Should instantiate without arguments", () => {
			(function() {
				new awc.AwesomeCart();
			}).should.not.Throw();
		});
	});

})
