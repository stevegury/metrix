'use strict';

const BucketedHistogram = require('../stats/bucketedhistogram.js');
const DefaultCounter = require('../counter/counter.js');
const DefaultTimer = require('../timer/timer.js');

/**
 * Default configuration.
 * Capture and aggregate all events.
 */
const config = {
    recorder: {
        timer: function(recorder, name, tags) {
            return DefaultTimer(recorder, name, tags);
        },
        counter: function(recorder, name, value, tags) {
            return DefaultCounter(recorder, name, value, tags);
        }
    },
    aggregator: {
        timer: function(event, histograms, counters) {
            if (!histograms[event.name]) {
                histograms[event.name] = new BucketedHistogram({
                    max: 60 * 60 * 1000,        // 1 hour
                    error: 5 / 1000,             // 5% precision
                    quantiles: [0.5, 0.9, 0.99, 0.999] // default quantiles
                });
            }

            if (event.startTs) {
                const duration = event.stopTs - event.startTs;
                const histo = histograms[event.name];
                histo.add(duration);
            }
        },
        counter: function(event, histograms, counters) {
            if (!counters[event.name]) {
                counters[event.name] = 0;
            }
            counters[event.name] += event.increment;
        },
        composites: null
    }
};

module.exports = config;
