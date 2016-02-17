'use strict';

module.exports = function (path) {
    return !/^\/(__health|__gtg|__health_check)/.test(path);
};
