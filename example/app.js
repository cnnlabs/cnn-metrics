'use strict';

const Metrics = require('../lib/metrics');

let interval = 0,
    start,
    stop;

Metrics.init({
    app: 'example',
    flushEvery: 1000 * 2,
    plugins: [
        'customCounters'
    ]
});

console.log('Start');

start = setInterval(() => {
    interval++;
    if (interval === 11) {
        stop();
    } else {
        console.log('count');
        Metrics.count('hit.counter');
    }
}, 1000 * 1);

stop = function () {
    process.exit(0);
};