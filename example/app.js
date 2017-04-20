'use strict';

const Metrics = require('../lib/metrics');

Metrics.init({
    appName: 'example',
    appType: 'api',  // or 'fe'
    customer: 'acme',
    flushEvery: 1000 * 2,
    plugins: [
        'customCounters'
    ]
});

console.log('Start');

setInterval(() => {
    console.log('count');
    Metrics.count('hit.counter');
}, 1000 * 1);
