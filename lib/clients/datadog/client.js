'use strict';

const _ = require('lodash'),
    dogapi = require('dogapi'),
    debug = require('debug')('cnn-metrics:datadog'),
    Datadog = function (opts) {
        let datadogKeys = opts.keys;

        this.apiKey = opts.apiKey;
        this.options = opts.options;
        this.loggingMessageDisplayed = false;
        this.flushCounter = 0;
        this.isDebugging = opts.isDebugging;
        this.isLogging = opts.isLogging;
        this.prefix = `${this.options.customer}.${this.options.appName}`;

        dogapi.initialize(datadogKeys);
    };

// Send Metrics to DataDog
Datadog.prototype.formatMetric = function (metricValue, metricName) {
    let self = this,
        returnMetric = {
            metric: `${self.prefix}.${metricName}`,
            points: metricValue,
            tags: []
        };

    if (self.options.platform) {
        returnMetric.tags.push(`platform:${self.options.platform}`);
    }

    if (self.options.appType) {
        returnMetric.tags.push(`appType:${self.options.appType}`);
    }

    if (self.options.hostname) {
        returnMetric.tags.push(`hostname:${self.options.hostname}`);
    }

    if (self.options.environment) {
        returnMetric.tags.push(`environment:${self.options.environment}`);
    }

    if (self.options.product) {
        returnMetric.tags.push(`product:${self.options.product}`);
    }

    if (self.isDebugging === true) {
        debug(returnMetric);
    }
    return [returnMetric];
};

Datadog.prototype.log = function (metrics) {
    let self = this;

    // We don't want Datadog filling up with junk data from localhost
    // so we disable if logging is not set up with valid data
    if (!self.isLogging) {
        return;
    }

    _.map(metrics, function (value, name) {
        if (self.isDebugging === true) {
            debug(`Sending Metric for ${name}`);
        }
        dogapi.metric.send_all(self.formatMetric(value, name));
    });
};

module.exports = Datadog;
