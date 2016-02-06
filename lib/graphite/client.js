"use strict";
var _ = require('lodash');
var net = require('net');
var util = require('util');
var debug = require('debug')('graphite');

var Graphite = function(opts) {
	this.apiKey = opts.apiKey;
	this.host = opts.host || "carbon.hostedgraphite.com";
	this.port = opts.port || 2003;
	this.prefix = opts.prefix;
	this.noLog = opts.noLog;

	if (!this.prefix) throw "No opts.prefix specified";
};

// Sends a set of metrics to Graphite
Graphite.prototype.log = function(metrics) {
	var self = this;

	// Remove nulls
	// http://stackoverflow.com/questions/14058193/remove-empty-properties-falsy-values-from-object-with-underscore-js
	//debug(metrics)
	//var noNulls = _.pick(metrics, _.identity);
	var noNulls = metrics;
	var data = _.map(noNulls, function(value, k) {
		return util.format('%s%s%s %s %d', self.apiKey, self.prefix, k, value, new Date() / 1000);
	});

	// Send data in chunks of 20 metrics (maximum allowed by hosted graphite)
	var dataChunks = _.groupBy(data, function(element, index){
		return Math.floor(index / 20);
	});

	// We don't want Graphite filling up with junk data from localhost
	// so we disabled it when this flag is set, which is current by the
	// NODE_ENV environment flag.

	if (this.noLog) {
		console.warn('Logging to Graphite is disabled by default on non-production environments. To enable is set NODE_ENV to "production". Or set DEBUGMETRICS=1 to debug metric counters');
		return;
	}

	// update the specified hosted graphite
	debug(this.port + '-' + this.host + ' Is connection' )
	var socket = net.createConnection(this.port, this.host, function() {
		_.forEach(dataChunks, function(chunk) {
			debug(chunk);
			socket.write(chunk.join("\n") + "\n"); // trailing \n to ensure the last metric is registered
		});
		socket.end();
	});

	socket.on('end', function() {
		debug('metrics client disconnected');
	});

	socket.on('error', function(err) {
		console.error('metrics client error', err);
	});

	socket.on('close', function(err) {
		debug('metrics client closed', err);
	});

	socket.on('timeout', function() {
		console.error('metrics client timeout');
	});

};

module.exports = Graphite;