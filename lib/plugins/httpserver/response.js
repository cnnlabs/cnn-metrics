
'use strict';

const metrics = require('metrics'),
    validMetricURL = require('../urlhelper.js');

let HttpResponse = module.exports = function HttpResponse() {
    this.buckets = {};
    this.reporter = this.reporter.bind(this);
};

HttpResponse.prototype.measure = function (name, value) {
    let bucket = this.buckets[name] || (this.buckets[name] = {
        counter: new metrics.Counter(),
        histogram: new metrics.Histogram.createUniformHistogram()
    });

    bucket.counter.inc(1);

    if (typeof value !== 'undefined') {
        bucket.histogram.update(value);
    }
};

HttpResponse.prototype.instrument = function (request) {
    if (!request.response._Instrumented) {
        //res.writeHead = this._writeHead(res.writeHead, res.req.method, Date.now(), validMetricURL(res.req.originalUrl));
        let url = `${request.connection.info.protocol}'://${request.info.host}${request.url.path}`;

        if (validMetricURL(url)) {
//             res.render = (function () {
//                 var _render = res.render.bind(res);
//                 var httpResponse = this;
//                     return function renderProxy(template, data, callback) {
            let start = process.hrtime(),
//                         var returnValue = _render(template, data, callback);
                diff = process.hrtime(start);

//                         httpResponse.measure('express.default_route_' + res.req.method + '.res.template_render.' + template, (diff[0] * 1e9) + diff[1]);
//                         return returnValue;
//                     };

//             }.bind(this)());
            this.measure(`http.default_route_${request.response.method}.res.template_render.`, (diff[0] * 1e9) + diff[1]);
        }
        request.response._Instrumented = true;
    }
};

HttpResponse.prototype.reset = function () {
    Object.keys(this.buckets).forEach(function (key) {
        this.buckets[key].counter.clear();
        this.buckets[key].histogram.clear();
    }.bind(this));
};


HttpResponse.prototype.counts = function () {
    let metrics = {};

    Object.keys(this.buckets).forEach(function (key) {
        let safeKey = (key.indexOf('template' > -1) ? key.replace(/(!?:template_render)[\/\\\.]/g, '_') : key);

        metrics[`${safeKey}.count`] = this.buckets[key].counter.count;
        metrics[`${safeKey}.time.sum`] = this.buckets[key].histogram.sum;
        metrics[`${safeKey}.time.max`] = this.buckets[key].histogram.max;
        metrics[`${safeKey}.time.min`] = this.buckets[key].histogram.min;
        metrics[`${safeKey}.time.mean`] = this.buckets[key].histogram.mean();
        metrics[`${safeKey}.time.stdDev`] = this.buckets[key].histogram.stdDev();
    }.bind(this));

    return metrics;
};

HttpResponse.prototype.reporter = function () {
    let counts = this.counts();

    this.reset();

    return counts;
};


// proxy for res.writeHead - http://nodejs.org/api/http.html#http_response_writehead_statuscode_reasonphrase_headers
HttpResponse.prototype._writeHead = function (fn, method, dt, isReal) {
    let self = this;

    return function () {
        let statusCode = parseInt(('' + arguments[0]).toString().substr(0, 3)), // eslint-disable-line
            route = isReal ? `default_route_${method}` : 'dev';

        self.measure(`express.${route}.res.status.${statusCode}`, Date.now() - dt);

        return fn.apply(this, arguments);
    };
};
