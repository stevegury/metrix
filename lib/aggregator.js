'use strict';

const assert = require('assert-plus');
const _ = require('lodash');

const DefaultConfig = require('./config/default.js');

/**
 * Aggregator
 *
 * The aggregator listen to the aggregator events (counter/timer) and aggregates
 * those events into respectively values/histograms.
 *
 * This abstraction reflect the "separation of concern" strategy used in this
 * library, the aggregator decides how it want to aggregate the values. It may
 * be interested in specific metrics and decide to aggregate them with an higher
 * precision.
 *
 * @param {Object} recorder Recorder the aggregator listen to.
 * @param {Object} _config Config object.
 * @param {Function} [_config.histogram] the function used to create an
 *                   histogram.
 * @param {Function} [_config.composites] the function used to create new
 *                   metrics from existing metrics.
 * @returns {Aggregator}
 */
function Aggregator(recorder, _config) {
    const config = _config || DefaultConfig.aggregator;
    assert.object(recorder, 'recorder');
    assert.object(config, 'config');
    assert.optionalFunc(config.timer, 'config.timer');
    assert.optionalFunc(config.counter, 'config.counter');
    assert.optionalArray(config.composites, 'config.composites');

    const timerEventHandler = config.timer ||
        DefaultConfig.aggregator.timer;
    const counterEventHandler = config.counter ||
        DefaultConfig.aggregator.counter;
    const histogramEventHandler = config.histogram ||
        DefaultConfig.aggregator.histogram;

    this._composites = config.composites;
    this._counters = {};
    this._histograms = {};

    const self = this;
    recorder.on('timer', function onTimer(event) {
        timerEventHandler(event, self._histograms, self._counters);
    });
    recorder.on('counter', function onCounter(event) {
        counterEventHandler(event, self._histograms, self._counters);
    });
    recorder.on('histogram', function onHistogram(event) {
        histogramEventHandler(event, self._histograms, self._counters);
    });
}

module.exports = Aggregator;

/// API

/**
 * Generate a report
 *
 * e.g.
 * {
 *   counters: {
 *     my_counter1: 12,
 *     my_counter2: 64,
 *   },
 *   histograms: {
 *     request_latency_ms: {
 *       min: 1,
 *       max: 19,
 *       p50: 4.56,
 *       p90: 14.6,
 *       p99: 18.133,
 *     }
 *   }
 * }
 *
 * @returns {Object} the report object.
 */
Aggregator.prototype.report = function report() {
    const self = this;
    const result = {
        counters: self._counters,
        histograms: _.mapValues(self._histograms, function histoSnapshot(h) {
            return h.snapshot();
        })
    };

    // optionally create new composite metrics based on the current ones.
    if (self._composites) {
        _.forEach(self._composites, function(fn) {
            const res = fn(result.counters, result.histograms);

            if (res) {
                for (let i = 0; i < res.length; i += 2) {
                    const name = res[i];
                    const value = res[i + 1];
                    self._counters[name] = value;
                }
            }
        });
    }

    return result;
};

/**
 * Clear the aggregator of histogram states.
 *
 * @returns {null}.
 */
Aggregator.prototype.clearHistograms = function clearHistograms() {
    const self = this;
    self._histograms = {};
};


/**
 * Clear the aggregator of counter states.
 *
 * @returns {null}.
 */
Aggregator.prototype.clearCounters = function clearCounters() {
    const self = this;
    self._counters = {};
};

/**
 * Clear the aggregator of any state.
 *
 * @returns {null}.
 */
Aggregator.prototype.clear = function clear() {
    const self = this;
    self._counters = {};
    self._histograms = {};
};
