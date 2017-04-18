'use strict';

const metrix = require('..');
const histogram = metrix.histogram;
const timer = metrix.timer;
const counter = metrix.counter;
const gauge = metrix.gauge;

/**
 * Here's a template for creating your own configuration
 */
const config = {
    recorder: {
        timer: function(recorder, name, tags) {
            return timer.createDefault(recorder, name, tags);
        },
        counter: function(recorder, name, value, tags) {
            return counter.createDefault(recorder, name, value, tags);
        },
        histogram: function(recorder, name, tags) {
            return histogram.createDefault(recorder, name, tags);
        },
        gauge: function(recorder, name, tags) {
            return gauge.createDefault(recorder, name, tags);
        }
    },
    aggregator: {
        timer: function(event, histograms, counters) {
            if (event.startTs) {
                event.value = event.stopTs - event.startTs;
                config.aggregator.histogram(event, histograms, counters);
            }
        },
        counter: function(event, histograms, counters) {
            if (!counters[event.name]) {
                counters[event.name] = 0;
            }
            counters[event.name] += event.increment;
        },
        histogram: function(event, histograms, counters) {
            if (!histograms[event.name]) {
                histograms[event.name] = histogram.createBucketHistogram({
                    max: 60 * 60 * 1000,        // 1 hour
                    error: 2 / 1000,            // 2% precision
                    quantiles: [0.5, 0.9, 0.99, 0.999] // default quantiles
                });
            }

            if (event.startTs) {
                const duration = event.stopTs - event.startTs;
                const histo = histograms[event.name];
                histo.add(duration);
            }
        },
        composites: null
    }
};

module.exports = config;
