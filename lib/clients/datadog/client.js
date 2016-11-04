'use strict';

const _ = require('lodash'),
    dogapi = require('dogapi'),
    debug = require('debug')('cnn-metrics:datadog'),
    Datadog = function (opts) {
        this.apiKey = opts.apiKey;
        this.options = opts.options;
        this.loggingMessageDisplayed = false;
        this.flushCounter = 0;
        this.isLogging = opts.isLogging;
        this.prefix = `${this.options.appName}`;
        let datadogKeys = opts.keys;

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
    if (self.options.platform){
        returnMetric.tags.push(`platform:${self.options.platform}`)
    }

    if (self.options.appType) {
        returnMetric.tags.push(`appType:${self.options.appType}`)
    }

    if (self.options.hostname){
        returnMetric.tags.push(`hostname:${self.options.hostname}`)
    }

    if (self.options.environment){
        returnMetric.tags.push(`environment:${self.options.environment}`)
    }

    if (self.options.product){
        returnMetric.tags.push(`product:${self.options.product}`)
    }

    debug(returnMetric);
    return [returnMetric];
};
Datadog.prototype.log = function (metrics) {

    // We don't want Datadog filling up with junk data from localhost
    // so we disabled if logging isnt set up with valid data
    if (!this.isLogging ) {
        return;
    }
    let self = this;

    _.map(metrics, function (value, name) {
        debug(`Sending Metric for ${name}`)
        let metric = self.formatMetric(value, name);
        dogapi.metric.send_all(metric);
    });


};
module.exports = Datadog;
