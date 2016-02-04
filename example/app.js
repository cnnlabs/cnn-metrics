var Metrics = require('../lib/metrics');



Metrics.init({ app: 'example', flushEvery: 200000, plugins:['customCounters']});

console.log('Start');


setInterval(()=>{
    console.log('count');
    Metrics.count('example.counter');
},4000);
