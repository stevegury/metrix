'use strict';

var assert = require('assert-plus');
var _ = require('lodash');

/**
 * StreamingHistogram
 *
 * Histogram implementation using the frugal quantile algorithm described in:
 *    Ma, Qiang, S. Muthukrishnan, and Mark Sandler. "Frugal Streaming for
 *    Estimating Quantiles." Space-Efficient Data Structures, Streams, and
 *    Algorithms. Springer Berlin Heidelberg, 2013. 77-96.
 *
 * This algorithm has multiple benefits, it is fast, it automatically deals with
 * data recency (more recent data have more weight) and its memory footprint is
 * negligable (in the order of 10s of bytes).
 * The drawback being its precision.
 *
 * @param {Object} _opts Options object
 * @param {array} [opts.quantiles] array of quantiles that needs to be computed.
 * @returns {BucketedHistogram}
 */
function StreamingHistogram(_opts) {
    var opts = _opts || {};
    assert.object(opts, 'opts');
    assert.optionalArrayOfNumber(opts.quantiles, 'opts.quantiles');
    var self = this;

    this._quantiles = opts.quantiles || [0.5, 0.9, 0.99];
    this._percentiles = _.map(self._quantiles, function (q) {
        return 'p' + parseFloat((100 * q).toFixed(2));
    });
    this._estimates = new Array(self._quantiles.length);
    _.fill(self._estimates, 0);
    this._steps = new Array(self._quantiles.length);
    _.fill(self._steps, 1);
    this._signs = new Array(self._quantiles.length);
    _.fill(self._signs, 0);

    this._snap = {
        min: Number.MAX_VALUE,
        max: Number.MIN_VALUE
    };
    this._entries = 0;
}

module.exports = StreamingHistogram;


/// API

/**
 * Add a value into the histogram
 * @param {number} [x] The value to add in the histogram.
 *
 * @returns {null}.
 */
StreamingHistogram.prototype.add = function add(x) {
    var self = this;

    self._entries++;
    self._snap.min = Math.min(self._snap.min, x);
    self._snap.max = Math.max(self._snap.max, x);

    for (var i = 0; i < self._quantiles.length; i++) {
        if (self._signs[i] === 0) {
            self._estimates[i] = x;
            self._signs[i] = 1;
            continue;
        }

        var quantile = self._quantiles[i];

        if (x > self._estimates[i]) {
            if (quantile !== 0.5 && Math.random() <= (1 - quantile)) {
                continue;
            }

            self._steps[i] += self._signs[i];

            if (self._steps[i] > 0) {
                self._estimates[i] += self._steps[i];
            } else {
                self._estimates[i] += 1;
            }

            if (self._estimates[i] > x) {
                self._steps[i] += (x - self._estimates[i]);
                self._estimates[i] = x;
            }

            if (self._signs[i] < 0) {
                self._steps[i] = 1;
            }

            self._signs[i] = 1;
        } else if (x < self._estimates[i]) {
            if (quantile !== 0.5 && Math.random() <= quantile) {
                continue;
            }

            self._steps[i] -= self._signs[i];

            if (self._steps[i] > 0) {
                self._estimates[i] -= self._steps[i];
            } else {
                self._estimates[i] -= 1;
            }

            if (self._estimates[i] < x) {
                self._steps[i] += (self._estimates[i] - x);
                self._estimates[i] = x;
            }

            if (self._signs[i] > 0) {
                self._steps[i] = 1;
            }

            self._signs[i] = -1;
        }
    }
};

/**
 * Create a snapshot of the histogram
 * (i.e. compute all the required quantiles, special case for min/max which can
 * be seen as the 0th and 100th percentiles).
 *
 * Example of output:
 * {
 *   min: 10,
 *   max: 107,
 *   p50: 46.1,
 *   p90: 89.123,
 *   p99: 105.5,
 *   p99.99: 106.7,
 * }
 *
 * @returns {object} the object containing the quantiles.
 */
StreamingHistogram.prototype.snapshot = function snapshot() {
    var self = this;

    if (self._entries === 0) {
        return {};
    }

    for (var i = 0; i < self._quantiles.length; i++) {
        var percentile = self._percentiles[i];
        self._snap[percentile] = self._estimates[i];
    }
    return self._snap;
};
