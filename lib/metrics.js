"use strict";

var Plugins = require('./plugins/');
var _ = require('lodash');
var Graphite = require('../lib/graphite/client');
var util = require('util');
var metrics = require('metrics');
var debug = require('debug')('metrics')

var apiKey = process.env.HOSTEDGRAPHITE_APIKEY;

if (!apiKey && (process.env.NODE_ENV === 'production' || process.env.ENVIRONMENT==='production')){
	throw "No HOSTEDGRAPHITE_APIKEY is set. Please set a false one if you are on your localhost.  ";
} 

var Metrics = function(opts) {

	opts = opts || {};

	this.opts = {};

	this.httpRequest = new Plugins.HttpRequest();
	this.httpResponse = new Plugins.HttpResponse();
	console.log(this.httpResponse)
	this.system = new Plugins.System();
	this.fetch = new Plugins.Fetch();
	this.aggregators = [];

	// arbitrary counters
	this.customCounters = {};
	this.customHistograms = {};
};

Metrics.prototype.init = function(opts) {
	console.log(opts);
	if (this.graphite) {
		console.warn("Metrics already configured, not re-initialising");
		return;
	}

	this.opts = opts;

	// Derive the keys based on the platform, Eg, <platform>.<application>.<instance>.<metric>
	var platform = (process.env.DYNO) ? 'heroku' : 'localhost';
	var instance = (platform === 'heroku') ? process.env.DYNO.replace('.', '_') : '_';
	if (process.env.NODE_APP_INSTANCE) {
		instance += '_process_' + process.env.NODE_APP_INSTANCE;
	}
	if (process.env.REGION) {
		instance += '_' + process.env.REGION;
	}
	var isProduction = (process.env.ENVIRONMENT === 'production' || process.env.NODE_ENV=== 'production');
	var isLogging = (process.env.DEBUGMETRICS === 1);
	
	if (!this.opts.app) throw "You need to specify an application name in the configuration options.";
	debug(isLogging)
	this.graphite = new Graphite({
		apiKey: apiKey,
		prefix: util.format('.%s.%s.%s.', platform, this.opts.app, instance),
		noLog: !isProduction
	});

	if (parseInt(this.opts.flushEvery) === 'NaN') {
		throw new Error('flushEvery must be an integer');
	}

	var self = this;

	this.setupDefaultAggregators();

	setInterval(function () {
		self.flush();
	}, this.opts.flushEvery);
};

// Allow arbitrary counters
Metrics.prototype.count = function (metric, value) {
	if (!this.customCounters.hasOwnProperty(metric)) {
		this.customCounters[metric] = new metrics.Counter();
	}
	debug('Count - ' + metric)
	this.customCounters[metric].inc(value || 1);
};

// Allow arbitrary Histograms
Metrics.prototype.histogram = function(metric, value){
	if (!this.customHistograms.hasOwnProperty(metric)) {
		this.customHistograms[metric] = new metrics.Histogram.createUniformHistogram();
	}
	this.customHistograms[metric].update(value);
};

Metrics.prototype.flushCustomCounters = function () {
	return _.mapValues(this.customCounters, function (counter) {
		var val = counter.count;
		counter.clear();
		return val;
	});
};

Metrics.prototype.flushCustomHistograms = function () {
	var obj = {};
	_.each(this.customHistograms, function(value, key){
		obj[key + '.min'] = value.min;
		obj[key + '.max'] = value.max;
		obj[key + '.mean'] = value.mean();
		obj[key + '.count'] = value.count;
	});
	return obj;
};

Metrics.prototype.flushRate = function () {
	var obj = {};
	obj['flush.rate'] = this.opts.flushEvery / 1000;
	return obj;
};

Metrics.prototype.setupDefaultAggregators = function () {
	debug(this.opts)
	if (this.opts.hasOwnProperty('plugins')){
		if (this.opts.plugins.indexOf('customCounters')){
			this.registerAggregator(this.flushCustomCounters.bind(this));
			this.registerAggregator(this.flushCustomHistograms.bind(this));
		};
	}else{
		this.registerAggregator(this.flushCustomCounters.bind(this));
		this.registerAggregator(this.flushCustomHistograms.bind(this));
		this.registerAggregator(this.system.counts);
		this.registerAggregator(this.flushRate.bind(this));
		this.registerAggregator(this.httpRequest.reporter);
		this.registerAggregator(this.httpResponse.reporter);
	}

};

Metrics.prototype.flush = function () {
	// transport metrics to graphite
	this.graphite.log(_.merge.apply(this, this.aggregators.map(function (aggregator) {
		return aggregator();
	})));
};

Metrics.prototype.instrument = function (obj, opts) {
	opts = opts || {};
	debug(opts);
	switch (opts.as) {
		case 'http.response':
			this.httpResponse.instrument(obj);
			break;
		case 'http.request':
			this.httpRequest.instrument(obj);
			break;
		default:
			throw new Error('No valid "opts.as" argument given. You need to specify the object you want instrumented.');
	}
};

Metrics.prototype.registerAggregator = function (func) {
	this.aggregators.push(func);
};

module.exports = new Metrics();

module.exports.knownservices = require('./services/knownservices');