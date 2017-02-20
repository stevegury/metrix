'use strict';

const BucketedHistogram = require('../stats/bucketedhistogram.js');
const DefaultCounter = require('../counter/counter.js');
const DefaultTimer = require('../timer/timer.js');
const DefaultHistogram = require('../histogram/default.js');

/**
 * Example of a more precise configuration.
 * Capture and aggregate all events (timer events are aggregated with a
 * detailed histogram).
 */
const config = {
    recorder: {
        timer: function(recorder, name, tags) {
            return DefaultTimer(recorder, name, tags);
        },
        counter: function(recorder, name, value, tags) {
            return DefaultCounter(recorder, name, value, tags);
        },
        histogram: function (recorder, name, tags) {
            return new DefaultHistogram(recorder, name, tags);
        },
    },
    aggregator: {
        timer: function (event, histograms, counters) {
            if (event.startTs) {
                event.value = event.stopTs - event.startTs;
                config.aggregator.histogram(event, histograms, counters)
            }
        },
        histogram: function (event, histograms, counters) {
            if (!histograms[event.name]) {
                histograms[event.name] = new BucketedHistogram({
                    max: 60 * 1000 * 1000,
                    error: 1 / 1000,
                    quantiles: [0.5, 0.9, 0.95, 0.99, 0.999, 0.9999]
                });
            }
            const histo = histograms[event.name];
            histo.add(event.value);
        }
    }
};

module.exports = config;
