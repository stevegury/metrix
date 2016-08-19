'use strict';

var BucketedHistogram = require('../stats/bucketedhistogram.js');
var DefaultCounter = require('../counter/counter.js');
var DefaultTimer = require('../timer/timer.js');

/**
 * Default configuration.
 * Capture and aggregate all events.
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
                    max: 60 * 60 * 1000,        // 1 hour
                    error: 5 / 100,             // 5% precision
                    quantiles: [0.5, 0.9, 0.99] // default quantiles
                });
            }

            if (event.startTs) {
                var duration = event.stopTs - event.startTs;
                var histo = histograms[event.name];
                histo.add(duration);
            }
        },
        counter: function (event, histograms, counters) {
            counters[event.name] = event.value;
        },
        composites: null
    }
};

module.exports = config;
