'use strict';

var assert = require('assert-plus');
var _ = require('lodash');

var limitsCache = {};

/**
 * BucketedHistogram
 *
 * Histogram implementation using a bucketing algorithm.
 * The widths of the buckets follow a exponential increase respecting the
 * constraint on the maximum error.
 * The memory footprint for an instance (default configuration) is about ~4kB.
 *
 * @param {Object} _opts Options object
 * @param {array} [opts.quantiles] array of quantiles that needs to be computed.
 *                This parameter impact the speed of the snapshot method, but
 *                doesn't increase the memory footprint.
 * @param {number} [opts.error] Maximum error allowed for the estimation.
 *                 A 5% precision over a quantile means that a quantile of real
 *                 value 1, will be estimated between [0.95, 1.05] and a
 *                 quantile of value 1000 will be estimated between [950, 1050].
 *                 This parameter doesn't impact the speed of the snapshot
 *                 method, but increase the memory footprint.
 * @param {number} [opts.max] Maximum value you expect to insert in the
 *                 histogram. This is a soft limit, higher values are still
 *                 possible, but at the price of decreasing the precision.
 *                 This parameter doesn't impact the speed of the snapshot
 *                 method, but increase the memory footprint.
 * @returns {BucketedHistogram}
 */
function BucketedHistogram(_opts) {
    var opts = _opts || {};
    assert.object(opts, 'opts');
    assert.optionalArrayOfNumber(opts.quantiles, 'opts.quantiles');
    assert.optionalNumber(opts.error, 'opts.error');
    assert.optionalNumber(opts.max, 'opts.max');
    var self = this;

    this._maxValue = opts.max || 60 * 60 * 1000; // 1 hour
    this._quantiles = opts.quantiles || [0.5, 0.9, 0.99];
    self._quantiles.sort();
    this._percentiles = _.map(self._quantiles, function (q) {
        return 'p' + parseFloat((100 * q).toFixed(2));
    });
    this._entries = 0;

    this._limits = [];
    var error = opts.error || 0.005;

    // caching the limits to improve memory footprint of the histogram.
    var key = error + ':' + self._maxValue;

    if (limitsCache[key]) {
        this._limits = limitsCache[key];
    } else {
        var right = 0;
        var width = 1.0;
        var ratio = 1 + error * 2;

        while (right < self._maxValue) {
            right = right + width;
            self._limits.push(right);
            width *= ratio;
        }
        limitsCache[key] = self._limits;
    }

    this._buckets = new Array(self._limits.length);
    _.fill(self._buckets, 0);
    this._maxBucketId = 0;
    this._overflow = 0;

    this._min = Number.MAX_VALUE;
    this._max = Number.MIN_VALUE;
}

module.exports = BucketedHistogram;

/// API

/**
 * Add a value into the histogram.
 * @param {number} [x] The value to add in the histogram.
 *
 * @returns {null}.
 */
BucketedHistogram.prototype.add = function add(x) {
    var self = this;
    self._entries++;
    self._min = Math.min(x, self._min);
    self._max = Math.max(x, self._max);

    if (x > self._maxValue) {
        self._overflow++;
    } else {
        var i = self._binarySearch(x, self._limits, 0, self._limits.length - 1);
        self._maxBucketId = Math.max(self._maxBucketId, i);
        self._buckets[i]++;
    }
};

/**
 * Create a snapshot of the histogram
 * (i.e. compute all the required quantiles, special case for min/max which can
 * be seen as the 0th and 100th percentiles).
 *
 * If the histogram has overflowed (you tried to insert values bigger than the
 * `opts.maxValue`), the output will contains an `overflow` property containing
 * the number of overflowed values.
 *
 * Example of output:
 * {
 *   min: 10,
 *   max: 107,
 *   p50: 46.1,
 *   p90: 89.123,
 *   p99: 105.5,
 * }
 *
 * @returns {object} the object containing the quantiles.
 */
BucketedHistogram.prototype.snapshot = function snapshot() {
    // Note: this method is a bottleneck, and readability has been traded in
    // favor of performance.
    var self = this;

    if (self._entries === 0) {
        return {};
    }

    var targets = _.map(self._quantiles, function (q) {
        return (1.0 - q) * self._entries;
    });
    var results = new Array(self._quantiles.length);
    _.fill(results, 0);
    var resultIndex = results.length - 1;
    var n = self._overflow;

    // this sum all buckets, starting from the last one (non empty).
    // Starting from the last one offer better performance when most of the
    // quantiles are above the 50th one.
    for (var i = self._maxBucketId; i >= 0; i--) {
        n += self._buckets[i];

        // compute the result in backward order for the same reason.
        for (var j = resultIndex; j >= 0 ; j--) {
            if (n > targets[j]) {
                if (i === 0) {
                    results[j] = self._limits[0];
                } else {
                    results[j] = (self._limits[i] + self._limits[i - 1]) / 2;
                }

                if (resultIndex === 0) {
                    // all quantiles computed, break both for loops.
                    i = 0;
                    break;
                }
                resultIndex--;
            } else {
                break;
            }
        }
    }

    var snap = {
        min: self._min,
        max: self._max
    };

    if (self._overflow !== 0) {
        snap.overflow = self._overflow;
    }

    for (var k = 0; k < self._quantiles.length; k++) {
        var percentile = self._percentiles[k];

        if (results[k]) {
            snap[percentile] = results[k];
        } else {
            snap[percentile] = _.last(self._limits);
        }
    }
    return snap;
};

/**
 * Clear the histogram
 *
 * @returns {null}.
 */
BucketedHistogram.prototype.clear = function clear() {
    var self = this;
    self._entries = 0;
    self._maxBucketId = 0;
    self._overflow = 0;
    self._min = Number.MAX_VALUE;
    self._max = Number.MIN_VALUE;
    _.fill(self._buckets, 0);
};

/// Privates

BucketedHistogram.prototype._binarySearch =
    function _binarySearch(x, array, min, max) {
        var self = this;
        assert(x <= array[max]);

        if (max - min <= 1) {
            if (x <= array[min]) {
                return min;
            } else {
                return max;
            }
        }

        var midpoint = Math.floor((min + max) / 2);
        var y = array[midpoint];

        if (x === y) {
            return midpoint;
        } else if (x < y) {
            return self._binarySearch(x, array, min, midpoint);
        } else {
            return self._binarySearch(x, array, midpoint, max);
        }
    };
