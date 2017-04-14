'use strict';

const _ = require('lodash'),
    net = require('net'),
    util = require('util'),
    debug = require('debug')('cnn-metrics:graphite'),
    Graphite = function (opts) {
        this.keys = opts.keys;
        this.host = opts.host || 'carbon.hostedgraphite.com';
        this.port = opts.port || 2003;
        this.options = opts.options;
        this.loggingMessageDisplayed = false;
        this.flushCounter = 0;
        this.isDebugging = opts.isDebugging;
        this.isLogging = opts.isLogging;

        if (!this.options) {
            throw 'No Options';
        }
    };

// Sends a set of metrics to Graphite
Graphite.prototype.log = function (metrics) {
    let self = this;

    if (self.isDebugging === true) {
        debug(`Flush has been called ${self.flushCounter}`);
    }

    self.flushCounter++;

    if (self.flushCounter % 10 === 0) {       // show the message every 10 times
        self.loggingMessageDisplayed = false;
    }

    if (!self.loggingMessageDisplayed && !self.isLogging) {
        if (self.isDebugging === true) {
            debug('Logging to Graphite is disabled by default on non-production environments.  To enable, set ENVIRONMENT="production" or NODE_ENV="production".  Set DEBUGMETRICS=1 to debug metric counters.');
        }
        self.loggingMessageDisplayed = true;
    }

    // We don't want Graphite filling up with junk data from localhost
    // so we disable if logging is not set up with valid data.
    if (!self.isLogging) {
        return;
    }

    self.prefix = `${self.keys.hostedGraphiteApiKey}.${self.options.appName}.${self.options.environment}`;

    const noNulls = metrics,
        data = _.map(noNulls, function (value, k) {
            return util.format('%s.%s %s %d', self.prefix, k, value, new Date() / 1000);
        }),
        dataChunks = _.groupBy(data, function (element, index) {
            // Send data in chunks of 20 metrics (maximum allowed by hosted graphite)
            return Math.floor(index / 20);
        }),
        socket = net.createConnection(self.port, self.host, function () {
            _.forEach(dataChunks, function (chunk) {
                if (self.isDebugging === true) {
                    debug(chunk);
                }
                socket.write(`${chunk.join('\n')}\n`); // trailing \n to ensure the last metric is registered
            });
            socket.end();
        });

    debug(`${self.port}-${self.host} is the connection for metrics`);

    socket.on('end', function () {
        if (self.isDebugging === true) {
            debug('metrics client disconnected');
        }
    });

    socket.on('error', function (err) {
        console.error('metrics client error', err);
    });

    socket.on('close', function (err) {
        if (self.isDebugging === true) {
            debug('metrics client closed', err);
        }
    });

    socket.on('timeout', function () {
        console.error('metrics client timeout');
    });

};

module.exports = Graphite;
