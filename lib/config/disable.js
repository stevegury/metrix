'use strict';

const NullCounter = require('../counter/disable.js');
const NullTimer = require('../timer/disable.js');
const NullHistogram = require('../histogram/disable.js');

/**
 * Disable configuration.
 * Discard all events.
 */
const config = {
    recorder: {
        timer: function(recorder, name, tags) {
            return NullTimer;
        },
        counter: function(recorder, name, value, tags) {
            return NullCounter;
        },
        histogram: function(recorder, name, tags) {
            return NullHistogram;
        }
    },
    aggregator: {
        timer: function(event, histograms, counters) {
            return null; // never used
        },
        counter: function(event, histograms, counters) {
            return null; // never used
        },
        composites: null
    }
};

module.exports = config;
