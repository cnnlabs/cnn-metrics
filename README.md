# CNN Metrics

[![build](https://img.shields.io/travis/cnnlabs/cnn-metrics/master.svg?style=flat-square)](https://travis-ci.org/cnnlabs/cnn-metrics)
![node](https://img.shields.io/node/v/cnn-metrics.svg?style=flat-square)
[![npm](https://img.shields.io/npm/v/cnn-metrics.svg?style=flat-square)](https://www.npmjs.com/package/cnn-metrics)
[![npm-downloads](https://img.shields.io/npm/dm/cnn-metrics.svg?style=flat-square)](https://www.npmjs.com/package/cnn-metrics)
[![dependency-status](https://gemnasium.com/cnnlabs/cnn-metrics.svg)](https://gemnasium.com/cnnlabs/cnn-metrics)


## Requirements

A current LTS or Stable version of [Node.js](https://nodejs.org).  We recommend
using [nvm](https://github.com/creationix/nvm#readme) to manage node versions.


## Installation

```shell
$ npm install
```


## Usage

See the [`example/`](./example) directory.  You can start up the example app
with the following.  Supply your own [Hosted Graphite](https://www.hostedgraphite.com)
key or [DataDog](https://datadog.com) keys.

```shell
$ NODE_ENV=production ENABLE_MTERICS=true HOSTEDGRAPHITE_APIKEY=[valid-key] DEBUG=* DEBUGMETRICS=1 PORT=5000 node example/app.js
```


## Environment variables

This package requires a few environment variable to be set.

- `NODE_ENV`

- `ENVIRONMENT`

- `METRICS_ENABLED`

- `HOSTEDGRAPHITE_APIKEY` -or- `DATADOG_APIKEY` and `DATADOG_APPKEY`

- `NODE_APP_INSTANCE`

- `METRICS_INTERVAL`

- `DEBUGMETRICS`

