'use strict';

const _ = require('lodash'),
    debug = require('debug')('cnn-metrics'),
    Graphite = require('./clients/graphite/client'),
    DataDog = require('./clients/datadog/client'),
    metrics = require('metrics'),
    Plugins = require('./plugins/'),
    util = require('util');


let Metrics;


Metrics = function (opts) {
    opts = opts || {};

    let envDebug = (process.env.DEBUGMETRICS === '1' || process.env.DEBUGMETRICS === 'true'),
        env = (opts.environment || process.env.ENVIRONMENT || process.env.NODE_ENV || 'unknown').toLowerCase();

    this.opts = {
        environment: env,
        isDebugging: (envDebug || opts.debugging || opts.verbose) ? true : false,
        isLogging: ((typeof opts.enabled === 'boolean') ? opts.enabled :
            (process.env.METRICS_ENABLED ? (process.env.METRICS_ENABLED === '1' || process.env.METRICS_ENABLED === 'true') :
            (envDebug || env === 'production' || env === 'prod')))
    };

    this._isInitted = false;

    this.httpRequest = new Plugins.HttpRequest(this.opts);
    this.httpResponse = new Plugins.HttpResponse();

    this.system = new Plugins.System();
    this.fetch = new Plugins.Fetch();
    this.aggregators = [];

    // arbitrary counters
    this.customCounters = {};
    this.customHistograms = {};
};

Metrics.prototype.init = function (opts) {
    opts = opts || this.opts;

    let self = this,
        appName = (opts.appName || process.env.APPNAME || '').toLowerCase(),
        appType = (opts.appType || process.env.APPTYPE || '').toLowerCase(),
        options,
        customer = (opts.customer || process.env.CUSTOMER || '').toLowerCase(),
        environment = (typeof opts.environment === 'string' && opts.environment.length !== 0 ?
            opts.environment.toLowerCase() : self.opts.environment),
        flushEvery = parseInt(opts.flushEvery || self.opts.flushEvery || process.env.METRICS_INTERVAL || process.env.METRICS_FLUSH_FREQ),
        isDebugging = (typeof opts.debugging === 'boolean' ? opts.debugging : self.opts.isDebugging),
        isLogging = (typeof opts.enabled === 'boolean' ? opts.enabled : self.opts.isLogging),
        platform = (process.env.KUBERNETES_PORT ? 'kubernetes' : 'local'),
        hostname = (platform === 'kubernetes' ? (process.env.HOSTNAME.toLowerCase() || 'unknown-kub') : 'localhost'),
        project = (opts.project || process.env.PROJECT || '').toLowerCase(),
        product = (opts.product || process.env.PRODUCT || '').toLowerCase();

    if (self._isInitted === true) {
        console.warn('Metrics already configured, not re-initialising.');
        return;
    }
    self._isInitted = true;

    if (isDebugging === true) {
        debug(`Options passed to Metrics ${JSON.stringify(opts)}`);
    }

    self.datadogKeys = (process.env.DATADOG_APIKEY && process.env.DATADOG_APPKEY) ? {
        api_key: process.env.DATADOG_APIKEY,
        app_key: process.env.DATADOG_APPKEY
    } : null;

    self.hostedGraphiteKey = process.env.HOSTEDGRAPHITE_APIKEY ? {
        hostedGraphiteApiKey: process.env.HOSTEDGRAPHITE_APIKEY
    } : null;

    if (self.datadogKeys === null && self.hostedGraphiteKey === null) {
        if (isDebugging === true) {
            debug('No HOSTEDGRAPHITE_APIKEY and no DATADOG_APIKEY / DATADOG_APPKEY are set.\n*** Metrics will NOT be recorded! ***');
        } else {
            console.error('No HOSTEDGRAPHITE_APIKEY and no DATADOG_APIKEY / DATADOG_APPKEY are set.\nNothing more to do.');
            return;
        }
    } else if (isDebugging === true) {
        if (self.datadogKeys !== null) {
            debug('DataDog keys found for logging.');
        } else {
            debug('DataDog keys NOT found for logging.');
        }
        if (self.hostedGraphiteKey !== null) {
            debug('HostedGraphite key found for logging.');
        } else {
            debug('HostedGraphite key NOT found for logging.');
        }
    }

    _.merge(self.opts, opts);

    // Verify some options
    if (!appName) {
        throw 'You need to specify an application name (appName) in the configuration options or set an environment var (APPNAME).';
    }
    if (isLogging && !customer) {
        throw 'You need to specify a customer name (customer) in the configuration options or set an environment var (CUSTOMER).';
    }
    if (isLogging && isNaN(flushEvery)) {
        throw new Error('flushEvery must be set to an integer or set an environment var (METRICS_INTERVAL).');
    }

    options = {
        appName: appName,          // Give the app a name
        hostname: hostname,        // What host it is running on
        platform: platform,        // is it docker, kub, local
        customer: customer,        // is it cnn, coredev, mss, etc.
        project: project,          // The top level (dynaimage, michonne, fave, etc.)
        appType: appType,          // the type of app (fe or api)
        product: product,          // top+type (dynaimage_fe, fave_api, etc.)
        environment: environment,  // dev, prod, ref, etc.
        applicationOptions: self.opts
    };
    console.log(`Is Logging: ${isLogging}`);

    if (self.hostedGraphiteKey !== null) {
        self.graphite = new Graphite({
            prefix: util.format('%s.%s.%s.%s.%s.', platform, hostname,  product, environment, self.opts.app || appName),
            options: options,
            keys: self.hostedGraphiteKey,
            isLogging: isLogging
        });
    }

    if (self.datadogKeys !== null) {
        self.datadog = new DataDog({
            options: options,
            keys: self.datadogKeys,
            isLogging: isLogging
        });
    }

    self.setupDefaultAggregators();

    setInterval(function () {
        self.flush();
    }, flushEvery).unref();
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
    let i,
        m,
        mets = Object.keys(this.customHistograms),
        metsLen = mets.length,
        obj = {},
        v;

    for (i = 0; i < metsLen; i++) {
        m = mets[i];
        v = this.customHistograms[m];
        obj[`${m}.min`] = v.min;
        obj[`${m}.max`] = v.max;
        obj[`${m}.mean`] = v.mean();
        obj[`${m}.count`] = v.count;
        v.clear();
    }

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
        if (this.opts.plugins.indexOf('customCounters') !== -1) {
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
    if (this.hostedGraphiteKey !== null) {
        this.graphite.log(_.merge.apply(this, this.aggregators.map(function (aggregator) {
            return aggregator();
        })));
    }
    // transport metrics to datadog
    if (this.datadogKeys !== null) {
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
