'use strict';

const Plugins = require('./plugins/'),
    _ = require('lodash'),
    Graphite = require('./clients/graphite/client'),
    DataDog = require('./clients/datadog/client'),
    util = require('util'),
    metrics = require('metrics'),
    debug = require('debug')('cnn-metrics');

let Metrics;


Metrics = function (opts) {
    opts = opts || {};

    this.opts = {};

    this.httpRequest = new Plugins.HttpRequest();
    this.httpResponse = new Plugins.HttpResponse();

    this.system = new Plugins.System();
    this.fetch = new Plugins.Fetch();
    this.aggregators = [];

    // arbitrary counters
    this.customCounters = {};
    this.customHistograms = {};
};

Metrics.prototype.init = function (opts) {
    debug(`Options passed to Metrics ${JSON.stringify(opts)}`);

    const platform = (process.env.KUBERNETES_PORT) ? 'kubernetes' : 'local',
        isProduction = (process.env.ENVIRONMENT === 'production' || process.env.NODE_ENV === 'production') ||
            (process.env.ENVIRONMENT === 'prod' || process.env.NODE_ENV === 'prod') ;

    let self = this,
        hostname,
        environment,
        customer,
        product,
        project,
        appType,
        options,
        isLogging = (process.env.DEBUGMETRICS === '1');

    this.datadogKeys= {
        api_key: (process.env.DATADOG_APIKEY) ? process.env.DATADOG_APIKEY : null,
        app_key: (process.env.DATADOG_APPKEY) ? process.env.DATADOG_APPKEY : null
    };

    if (this.datadogKeys.api_key && this.datadogKeys.app_key){
        console.log(`Datadog Keys Found for Logging`)
    } else {
        console.log(`Datadog Keys NOT Found for Logging`)
    }

    this.hostedGraphiteKey ={
        hostedGraphiteApiKey: process.env.HOSTEDGRAPHITE_APIKEY ? process.env.HOSTEDGRAPHITE_APIKEY: null,
    };

    if (this.hostedGraphiteKey.hostedGraphiteApiKey){
        console.log(`HostedGraphiteKey Found for Logging`)
    } else {
        console.log(`HostedGraphiteKey NOT Found for Logging`)
    }

    this.opts = opts;
    isLogging = isLogging || isProduction;
    environment = process.env.ENVIRONMENT || process.env.NODE_ENV || 'unknown-environment';

    if (platform === 'kubernetes') {
        hostname = process.env.HOSTNAME.toLowerCase() || 'unknown-kub';
    } else {
        hostname = 'localhost';
    }

    //If product is passed in. Lets use that
    if (opts.customer) {
        customer = opts.customer.toLowerCase();
    } else {
        customer = process.env.CUSTOMER ? process.env.CUSTOMER.toLowerCase() :undefined;
    }
    //If product is passed in. Lets use that
    if (opts.product) {
        product = opts.product.toLowerCase();
    } else {
        product = process.env.PRODUCT ? process.env.PRODUCT.toLowerCase() :undefined;
    }

    //If project is passed in. Lets use that
    if (opts.project) {
        project = opts.project;
    } else {
        project = process.env.PROJECT ? process.env.PROJECT.toLowerCase() :undefined;
    }

    //If appType is passed in. Lets use that
    if (opts.appType) {
        appType = opts.appType;
    } else {
        appType = process.env.APPTYPE ? process.env.APPTYPE.toLowerCase() :undefined;
    }


    if (this.graphite) {
        console.warn('Graphite Metrics already configured, not re-initialising');
        return;
    }
    if (this.datadog) {
        console.warn('Datadog Metrics already configured, not re-initialising');
        return;
    }

    if (!this.opts.appName) {
        throw 'You need to specify an application name(appName) in the configuration options or set an environment var.';
    }
    if (isLogging && !customer) {
        throw 'You need to specify an customer name(customer) in the configuration options or set an environment var';
    }

    options = {
        appName: this.opts.appName.toLowerCase(),   //Give the app a name
        hostname: hostname,           //What host it is running on
        platform: platform,           //is it docker/kub/localhost
        customer: customer,           //is it cnn, coredev, mss
        project: project,                            //The top level  (dynaimage)
        appType: appType,             //the type of app (fe or api)
        product: product,                          // top+type (dynaimage_fe)
        environment: environment.toLowerCase(),     //dev
        applicationOptions: this.opts
    };
    console.log(`Is Logging- ${isLogging}`);

    this.graphite = new Graphite({
        prefix: util.format('%s.%s.%s.%s.%s.', platform, hostname,  product, environment, this.opts.app),
        options: options,
        keys: this.hostedGraphiteKey,
        isLogging: isLogging
    });

    this.datadog = new DataDog({
        options: options,
        keys: this.datadogKeys,
        isLogging: isLogging
    });


    if (parseInt(this.opts.flushEvery) === 'NaN') {
        throw new Error('flushEvery must be an integer');
    }

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
    debug(`Count - ${metric}`);
    this.customCounters[metric].inc(value || 1);
};

// Allow arbitrary Histograms
Metrics.prototype.histogram = function (metric, value) {
    if (!this.customHistograms.hasOwnProperty(metric)) {
        this.customHistograms[metric] = new metrics.Histogram.createUniformHistogram();
    }
    this.customHistograms[metric].update(value);
};

Metrics.prototype.flushCustomCounters = function () {
    return _.mapValues(this.customCounters, function (counter) {
        let val = counter.count;
        counter.clear();
        return val;
    });
};

Metrics.prototype.flushCustomHistograms = function () {
    let obj = {};

    _.each(this.customHistograms, function (value, key) {
        obj[`${key}.min`] = value.min;
        obj[`${key}.max`] = value.max;
        obj[`${key}.mean`] = value.mean();
        obj[`${key}.count`] = value.count;
    });

    return obj;
};

Metrics.prototype.flushRate = function () {
    let obj = {};

    obj['flush.rate'] = this.opts.flushEvery / 1000;

    return obj;
};

Metrics.prototype.setupDefaultAggregators = function () {
    debug(this.opts);

    if (this.opts.hasOwnProperty('plugins')) {
        if (this.opts.plugins.indexOf('customCounters') >= 0) {
            this.registerAggregator(this.flushCustomCounters.bind(this));
            this.registerAggregator(this.flushCustomHistograms.bind(this));
        }
    } else {
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
    if (this.hostedGraphiteKey.hostedGraphiteApiKey){
        this.graphite.log(_.merge.apply(this, this.aggregators.map(function (aggregator) {
            return aggregator();
        })));
    }
    if (this.datadogKeys.api_key && this.datadogKeys.app_key){
        this.datadog.log(_.merge.apply(this, this.aggregators.map(function (aggregator) {
            return aggregator();
        })));
    }
};

Metrics.prototype.instrument = function (obj, opts) {
    opts = opts || {};

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
