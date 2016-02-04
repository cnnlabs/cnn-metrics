"use strict";
var metrics = require('metrics');
var validMetricURL = require('../urlhelper.js');
var debug = require('debug')('metrics')
var HttpRequest = module.exports = function HttpRequest() {
	this.counter = new metrics.Counter();
	this.devCounter = new metrics.Counter();
	this.reporter = this.reporter.bind(this);
};

HttpRequest.prototype.instrument = function(request) {
	if (!request._Instrumented) {
		var url = request.connection.info.protocol + '://' + request.info.host + request.url.path
		debug(url);
		if(validMetricURL(url)) {
			this.counter.inc(1);
		} else {
			this.devCounter.inc(1);
		}
		request._Instrumented = true;
	}
};

HttpRequest.prototype.counts = function() {
	return {
		'http.request.count': this.counter.count,
		'http.request.check.count': this.devCounter.count
	};
};

HttpRequest.prototype.reset = function() {
	this.counter.clear();
	this.devCounter.clear();
};


HttpRequest.prototype.reporter = function() {
	var counts = this.counts();
	this.reset();
	return counts;
};