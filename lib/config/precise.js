'use strict';

var BucketedHistogram = require('../lib/metrics/stats/bucketedhistogram.js');
var DefaultCounter = require('./counter/counter.js');
var DefaultTimer = require('./timer/timer.js');

/**
 * Precise configuration.
 * Capture and aggregate all events (timer events are aggregated with a
 * detailed histogram).
 */
var config = {
    recorder: {
        timer: function (recorder, name, tags) {
            return DefaultTimer(recorder, name, tags);
        },
        counter: function (recorder, name, value, tags) {
            return DefaultCounter(recorder, name, value, tags);
        }
    },
    aggregator: {
        timer: function (event, histograms, counters) {
            if (!histograms[event.name]) {
                histograms[event.name] = new BucketedHistogram({
                    max: 60 * 1000 * 1000,
                    error: 1 / 100,
                    quantiles: [0.5, 0.9, 0.95, 0.99, 0.999, 0.9999]
                });
            }

            if (event.startTs) {
                var duration = event.stopTs - event.startTs;
                var histo = histograms[event.name];
                histo.add(duration);
            }
        }
    }
};

module.exports = config;
