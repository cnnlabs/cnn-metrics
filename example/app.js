'use strict';

const Metrics = require('../lib/metrics');

Metrics.init({
    app: 'example',
    flushEvery: 1000 * 3,
    plugins: [
        'customCounters'
    ]
});

console.log('Start');

setInterval(() => {
    console.log('count');
    Metrics.count('hit.counter');
}, 1000 * 1);
