# CNN Metrics Changelog
### Commits

## 2017-04-14, Version 0.5.0, @drenter

### Notable changes

- Add DataDog support (mostly copied from the update-for-docker branch)
- Add support for `DATADOG_APIKEY` and `DATADOG_APPKEY` for above
- Add support for new `METRICS_ENABLED` environment variable, to explicitly control enabling and disabling metrics
- Add support for new `METRICS_INTERVAL` and `METRICS_FLUSH_FREQ` enviroment variables, either can be used to control the flush interval.
- Fixed a memory leak
- Update dependencies
- NOTE: The required parameters for configuration have slightly changed.  Where before only an `app` property was required, now both `appName` and `appType` should be used, where `appType` is something like `"api"` or `"fe"`.  Note that a corresponding `APPTYPE` environment variable is also supported.

### Known issues

See https://github.com/TurnerBroadcasting/cnn-metrics/labels/defect for complete and
current list of known issues.

### Commits

* [[`8f83411855`](https://github.com/cnnlabs/cnn-metrics/commit/8f83411855)] - Merge pull request #16 from cnnlabs/dogs-in-boxes (DrEnter)
* [[`ad3fd729da`](https://github.com/cnnlabs/cnn-metrics/commit/ad3fd729da)] - Update README with new env variables. (James Drenter)
* [[`13eeb80d3c`](https://github.com/cnnlabs/cnn-metrics/commit/13eeb80d3c)] - Fix memory leak with using Histograms.  Only output debugging output if it is asked for.  Clean-up several things. (James Drenter)


## 2016-12-09, Version 0.4.0, @adslaton

### Notable changes

- Update dependencies

### Known issues

See https://github.com/TurnerBroadcasting/cnn-metrics/labels/defect for complete and
current list of known issues.

### Commits

* [[`2fc6111caa`](https://github.com/cnnlabs/cnn-metrics/commit/2fc6111caa)] - Merge pull request #15 from cnnlabs/bugfix/graceful-shutdown (A.D. Slaton)
* [[`fadf81af93`](https://github.com/cnnlabs/cnn-metrics/commit/fadf81af93)] - Unref timers to allow graceful shutdown (Ian Patton)
* [[`4209db9974`](https://github.com/cnnlabs/cnn-metrics/commit/4209db9974)] - correcting changelog date (A.D. Slaton)


## 2016-08-03, Version 0.3.10, @adslaton

### Notable changes

- Update dependencies

### Known issues

See https://github.com/TurnerBroadcasting/cnn-metrics/labels/defect for complete and
current list of known issues.

### Commits

* [[`a2e1a6fdfe`](https://github.com/cnnlabs/cnn-metrics/commit/a2e1a6fdfe)] - Merge pull request #14 from cnnlabs/feature/dependency-update (A.D. Slaton)
* [[`2deb514564`](https://github.com/cnnlabs/cnn-metrics/commit/2deb514564)] - reverting inadvertent version bump (A.D. Slaton)
* [[`ae0011cf3e`](https://github.com/cnnlabs/cnn-metrics/commit/ae0011cf3e)] - update to lodash 4.14.1 (A.D. Slaton)


## 2016-05-17, Version 0.3.9, @adslaton

### Notable changes

- Update dependencies

### Known issues

See https://github.com/TurnerBroadcasting/cnn-metrics/labels/defect for complete and
current list of known issues.

### Commits

* [[`3f915c2025`](https://github.com/cnnlabs/cnn-metrics/commit/3f915c2025)] - Merge pull request #13 from cnnlabs/feature/dependency-update (A.D. Slaton)
* [[`01a3ed727d`](https://github.com/cnnlabs/cnn-metrics/commit/01a3ed727d)] - update latest package deps (A.D. Slaton)
* [[`08f7cceeeb`](https://github.com/cnnlabs/cnn-metrics/commit/08f7cceeeb)] - Merge branch 'master' into develop (A.D. Slaton)


## 2016-04-18, Version 0.3.8, @adslaton

### Notable changes

- Update dependencies

### Known issues

See https://github.com/TurnerBroadcasting/cnn-metrics/labels/defect for complete and
current list of known issues.

### Commits

* [[`0fe32bf7cd`](https://github.com/cnnlabs/cnn-metrics/commit/0fe32bf7cd)] - Update latest dependency versions (A.D. Slaton) [#12](https://github.com/cnnlabs/cnn-metrics/pull/12)
* [[`27e8e3dd4f`](https://github.com/cnnlabs/cnn-metrics/commit/27e8e3dd4f)] - Moved build flags to the top of the readme (A.D. Slaton) [#12](https://github.com/cnnlabs/cnn-metrics/pull/12)


## 2016-02-23, Version 0.3.7, @jamsyoung

### Notable changes

- Bug fixes

### Known issues

See https://github.com/TurnerBroadcasting/cnn-metrics/labels/defect for complete and
current list of known issues.

### Commits

* [[`cef425e2bc`](https://github.com/cnnlabs/cnn-metrics/commit/cef425e2bc)] - **ci**: add TravisCI and fix ESLint errors (James Young) [#9](https://github.com/cnnlabs/cnn-metrics/pull/9)
* [[`76daa96329`](https://github.com/cnnlabs/cnn-metrics/commit/76daa96329)] - **graphite-client**: fix error shown in error (James Young) [#10](https://github.com/cnnlabs/cnn-metrics/pull/10)



0.1.x through 0.3.6 - Initial versions - changes too numerous to list
