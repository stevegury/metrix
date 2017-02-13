'use strict';

var metrix = require('..');
var histogram = metrix.histogram;
var timer = metrix.timer;
var counter = metrix.counter;

/**
 * Here's a template for creating your own configuration
 */
var config = {
    recorder: {
        timer: function (recorder, name, tags) {
            return timer.createDefault(recorder, name, tags);
        },
        counter: function (recorder, name, value, tags) {
            return counter.createDefault(recorder, name, value, tags);
        }
    },
    aggregator: {
        timer: function (event, histograms, counters) {
            if (!histograms[event.name]) {
                histograms[event.name] = histogram.createBucketHistogram({
                    max: 60 * 60 * 1000,        // 1 hour
                    error: 2 / 1000,            // 2% precision
                    quantiles: [0.5, 0.9, 0.99, 0.999] // default quantiles
                });
            }

            if (event.startTs) {
                var duration = event.stopTs - event.startTs;
                var histo = histograms[event.name];
                histo.add(duration);
            }
        },
        counter: function (event, histograms, counters) {
            if (!counters[event.name]) {
                counters[event.name] = 0;
            }
            counters[event.name] += event.increment;
        },
        composites: null
    }
};

module.exports = config;
