'use strict';

const Metrics = require('../lib/metrics');

Metrics.init({
    app: 'example',
    flushEvery: 1000 * 20,
    plugins: [
        'customCounters'
    ]
});

console.log('Start');

setInterval(() => {
    console.log('count');
    Metrics.count('example.counter');
}, 1000 * 4);
